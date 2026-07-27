import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Loader2,
  Search,
  RefreshCw,
  LogOut,
  Users,
  ImagePlus,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { VerifiedBadge } from './icons';
import { adminPing, adminUsers, adminSetPlan, adminSetVerified, adminDeleteUser } from '../api/admin';
import {
  SURVEY_ROLE_LABELS,
  SURVEY_INTEREST_LABELS,
  SURVEY_SOURCE_LABELS,
} from '../constants/survey';

const KEY_STORAGE = 'agrozot_admin_key';

const PLAN_STYLES = {
  none: 'bg-white border-slate-300 text-slate-500',
  pro: 'bg-brand-green/10 border-brand-green/40 text-brand-green-dark',
  plus: 'bg-amber-50 border-amber-300 text-amber-600',
};

const PLAN_LABELS = { none: 'Tarif yo\'q', pro: 'Pro', plus: 'Plus' };

function fmtDate(d) {
  return new Date(d).toLocaleDateString('uz', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Onboarding so'rovnomasi javoblari (maqsad, qiziqishlar, manba) — ixcham ustun */
function SurveyCell({ user }) {
  const interests = user.surveyInterests || [];
  if (!user.surveyRole && !user.surveySource && interests.length === 0) {
    return <span className="text-[11px] text-slate-400">—</span>;
  }
  return (
    <div className="space-y-1 max-w-[200px]">
      {user.surveyRole && (
        <span className="inline-block px-1.5 py-0.5 rounded-md bg-brand-sky/10 border border-brand-sky/30 text-brand-sky text-[10px] font-semibold">
          {SURVEY_ROLE_LABELS[user.surveyRole] || user.surveyRole}
        </span>
      )}
      {interests.length > 0 && (
        <p className="text-[10px] text-slate-500 leading-snug">
          {interests.map((i) => SURVEY_INTEREST_LABELS[i] || i).join(', ')}
        </p>
      )}
      {user.surveySource && (
        <p className="text-[10px] text-slate-500">
          Manba: {SURVEY_SOURCE_LABELS[user.surveySource] || user.surveySource}
        </p>
      )}
    </div>
  );
}

/** Tasdiqlangan profil belgisini yoquvchi/o'chiruvchi switch */
function VerifySwitch({ user, onChange, busy }) {
  const on = !!user.isVerified;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={() => onChange(user, !on)}
      title={on ? 'Tasdiqni olib tashlash' : 'Profilni tasdiqlash'}
      className={`relative inline-flex w-10 h-[22px] rounded-full border transition-colors disabled:opacity-50 ${
        on ? 'bg-[#0095F6] border-[#0095F6]' : 'bg-slate-200 border-slate-300'
      }`}
    >
      <span
        className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200 flex items-center justify-center ${
          on ? 'left-[20px]' : 'left-[2px]'
        }`}
      >
        {busy && <Loader2 size={10} className="animate-spin text-slate-400" />}
      </span>
    </button>
  );
}

/** Foydalanuvchi tarifini o'zgartiruvchi select */
function PlanSelect({ user, onChange, busy }) {
  return (
    <div className="relative inline-block">
      <select
        value={user.aiPlan}
        disabled={busy}
        onChange={(e) => onChange(user, e.target.value)}
        className={`appearance-none cursor-pointer rounded-lg border pl-3 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-green transition-colors disabled:opacity-50 ${
          PLAN_STYLES[user.aiPlan] || PLAN_STYLES.none
        }`}
      >
        <option value="none" className="bg-white text-slate-700">Tarif yo'q</option>
        <option value="pro" className="bg-white text-slate-700">Pro — 5 rasm/kun</option>
        <option value="plus" className="bg-white text-slate-700">Plus — cheksiz</option>
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-60">
        {busy ? <Loader2 size={11} className="animate-spin" /> : '▼'}
      </span>
    </div>
  );
}

/**
 * Admin panel — /#admin manzilida ochiladi.
 * ADMIN_KEY bilan kiriladi; foydalanuvchilar ro'yxati va AI tariflarini boshqaradi.
 */
export default function AdminPanel() {
  const [key, setKey] = useState(() => {
    try {
      return localStorage.getItem(KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(!!key);
  const [keyInput, setKeyInput] = useState('');
  const [loginError, setLoginError] = useState(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // o'chirish modali uchun foydalanuvchi
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const searchTimer = useRef(null);

  const flash = (message, type = 'success') => {
    clearTimeout(noticeTimer.current);
    setNotice({ message, type });
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  };

  // Saqlangan kalitni tekshirish
  useEffect(() => {
    if (!key) return;
    let alive = true;
    adminPing(key)
      .then(() => alive && setAuthed(true))
      .catch(() => {
        if (!alive) return;
        setAuthed(false);
        try {
          localStorage.removeItem(KEY_STORAGE);
        } catch {
          /* ignore */
        }
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [key]);

  // Foydalanuvchilarni yuklash (qidiruv 400ms kechikish bilan)
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      adminUsers(key, search)
        .then((res) => {
          if (!alive) return;
          setUsers(res.data || []);
          setError(null);
        })
        .catch((err) => alive && setError(err.message))
        .finally(() => alive && setLoading(false));
    }, search ? 400 : 0);
    return () => {
      alive = false;
      clearTimeout(searchTimer.current);
    };
  }, [authed, key, search]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    const candidate = keyInput.trim();
    if (!candidate) return;
    setChecking(true);
    setLoginError(null);
    try {
      await adminPing(candidate);
      try {
        localStorage.setItem(KEY_STORAGE, candidate);
      } catch {
        /* ignore */
      }
      setKey(candidate);
      setAuthed(true);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* ignore */
    }
    setKey('');
    setKeyInput('');
    setAuthed(false);
    setUsers([]);
  };

  const handlePlanChange = async (user, plan) => {
    const prevPlan = user.aiPlan;
    if (plan === prevPlan) return;
    setSavingId(user.id);
    // Optimistik yangilash
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, aiPlan: plan } : u)));
    try {
      await adminSetPlan(key, user.id, plan);
      flash(`${user.firstName || 'Foydalanuvchi'} → ${PLAN_LABELS[plan]}`);
    } catch (err) {
      // Xatolikda orqaga qaytarish
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, aiPlan: prevPlan } : u)));
      flash(err.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleVerifyChange = async (user, isVerified) => {
    setVerifyingId(user.id);
    // Optimistik yangilash
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isVerified } : u)));
    try {
      await adminSetVerified(key, user.id, isVerified);
      flash(
        `${user.firstName || 'Foydalanuvchi'} — ${isVerified ? 'tasdiqlandi ✓' : 'tasdiq olib tashlandi'}`
      );
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isVerified: !isVerified } : u))
      );
      flash(err.message, 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await adminDeleteUser(key, deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      flash(`${deleteTarget.firstName || 'Foydalanuvchi'} butunlay o'chirildi`);
      setDeleteTarget(null);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const forceReload = () => {
    setLoading(true);
    adminUsers(key, search)
      .then((res) => {
        setUsers(res.data || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // ── Kirish ekrani ──
  if (!authed) {
    return (
      <div className="min-h-[100dvh] bg-brand-bg flex items-center justify-center p-6 font-['Inter']">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <BrandLogo variant="lg" iconOnly />
            <h1 className="text-xl font-extrabold text-brand mt-3">AgroZot Admin</h1>
            <p className="text-xs text-slate-500 mt-1">Kirish uchun admin kalitini kiriting</p>
          </div>

          {checking ? (
            <div className="flex justify-center py-6">
              <Loader2 size={22} className="text-brand-green animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 focus-within:border-brand-green transition-colors">
                <KeyRound size={16} className="text-slate-500 shrink-0" />
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Admin kaliti"
                  autoFocus
                  className="flex-1 bg-transparent py-3.5 text-sm text-brand placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={!keyInput.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-green to-brand disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShieldCheck size={16} /> Kirish
              </button>
            </form>
          )}

          <a href="/" className="block text-center text-[11px] text-slate-400 hover:text-slate-600 mt-6 transition-colors">
            ← Ilovaga qaytish
          </a>
        </div>
      </div>
    );
  }

  // ── Panel ──
  return (
    <div className="min-h-[100dvh] bg-brand-bg font-['Inter'] text-brand">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Sarlavha */}
        <div className="flex items-center gap-3 mb-5">
          <BrandLogo iconOnly />
          <div className="flex-1">
            <h1 className="text-lg font-extrabold leading-tight">AgroZot Admin</h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Users size={11} /> {users.length} ta foydalanuvchi
            </p>
          </div>
          <button
            onClick={forceReload}
            title="Yangilash"
            className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-green transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleLogout}
            title="Chiqish"
            className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Qidiruv */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 mb-4 max-w-md">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Bildirishnoma */}
        {notice && (
          <div
            className={`mb-3 text-xs px-3.5 py-2.5 rounded-xl border ${
              notice.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-brand-green/10 border-brand-green/30 text-brand-green-dark'
            }`}
          >
            {notice.message}
          </div>
        )}

        {/* Jadval */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {loading && users.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 size={22} className="text-brand-green animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button
                onClick={forceReload}
                className="px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-semibold hover:bg-brand-green-dark transition-colors"
              >
                Qayta urinish
              </button>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-14">Foydalanuvchilar topilmadi</p>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[1020px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                    <th className="px-4 py-3 font-semibold text-center">E'lonlar</th>
                    <th className="px-4 py-3 font-semibold text-center">Rasm (bugun)</th>
                    <th className="px-4 py-3 font-semibold">So'rovnoma</th>
                    <th className="px-4 py-3 font-semibold">Sana</th>
                    <th className="px-4 py-3 font-semibold text-center">Tasdiq</th>
                    <th className="px-4 py-3 font-semibold text-right">AI tarif</th>
                    <th className="px-4 py-3 font-semibold text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500">#{u.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold leading-tight flex items-center gap-1">
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Nomsiz'}
                          {u.isVerified && <VerifiedBadge size={13} />}
                        </p>
                        <p className="text-[11px] text-slate-500">{u.phone || u.username || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600">{u.activeAnimals}</td>
                      <td className="px-4 py-3 text-center">
                        {u.aiPlan === 'pro' ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                              u.aiImagesToday >= (u.aiImageLimit || 5) ? 'text-red-500' : 'text-slate-600'
                            }`}
                          >
                            <ImagePlus size={11} /> {u.aiImagesToday}/{u.aiImageLimit || 5}
                          </span>
                        ) : u.aiPlan === 'plus' ? (
                          <span className="text-[11px] text-amber-600 font-semibold">∞</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SurveyCell user={u} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <VerifySwitch user={u} busy={verifyingId === u.id} onChange={handleVerifyChange} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PlanSelect user={u} busy={savingId === u.id} onChange={handlePlanChange} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title="Foydalanuvchini o'chirish"
                          className="w-8 h-8 rounded-lg bg-slate-100 inline-flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-4 text-center">
          Tarif o'zgarishi foydalanuvchiga darhol qo'llanadi — Pro: kuniga 5 ta rasm tahlili, Plus: cheksiz.
        </p>
      </div>

      {/* ── O'chirishni tasdiqlash modali ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
                <AlertTriangle size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-brand">Foydalanuvchini o'chirish</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  <span className="font-semibold text-brand">
                    {[deleteTarget.firstName, deleteTarget.lastName].filter(Boolean).join(' ') || 'Nomsiz'}
                  </span>{' '}
                  ({deleteTarget.phone || deleteTarget.username || `#${deleteTarget.id}`}) hisobini butunlay
                  o'chirmoqchimisiz? Barcha e'lonlari, xabarlari va suhbatlari ham o'chib ketadi.{' '}
                  <span className="font-semibold text-red-500">Bu amalni ortga qaytarib bo'lmaydi.</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
