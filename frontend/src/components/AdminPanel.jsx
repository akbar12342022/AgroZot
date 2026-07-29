import { useState, useEffect, useRef, useCallback } from 'react';
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
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  Wifi,
  Newspaper,
  Hourglass,
  Moon,
  Sun,
  Crown,
  CalendarDays,
  MapPin,
  Eye,
  Sparkles,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { VerifiedBadge } from './icons';
import {
  adminPing,
  adminUsers,
  adminStats,
  adminSetPlan,
  adminSetVerified,
  adminDeleteUser,
  adminReports,
  adminReplyReport,
  adminAnimals,
  adminSetAnimalStatus,
} from '../api/admin';
import {
  SURVEY_ROLE_LABELS,
  SURVEY_INTEREST_LABELS,
  SURVEY_SOURCE_LABELS,
} from '../constants/survey';
import { CATEGORIES } from '../constants/data';
import { resolveImageUrl } from '../api/client';
import { useI18n } from '../i18n';

const KEY_STORAGE = 'agrozot_admin_key';

// ─── Premium "shisha" (glassmorphism) dizayn tokenlari ───
const GLASS =
  'bg-white/75 dark:bg-white/[0.05] backdrop-blur-xl border border-white/70 dark:border-white/10 ' +
  'shadow-[0_10px_36px_-8px_rgba(15,61,76,0.14)] dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.5)]';
const GLASS_SOFT =
  'bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-white/60 dark:border-white/10';

const PLAN_META = {
  STANDARD: {
    label: 'Standard',
    cls: 'bg-slate-500/10 dark:bg-white/10 border-slate-300/70 dark:border-white/15 text-slate-500 dark:text-slate-300',
  },
  PRO: {
    label: 'Pro',
    cls: 'bg-brand-green/10 border-brand-green/40 text-brand-green-dark',
  },
  PREMIUM: {
    label: 'Premium',
    cls: 'bg-amber-400/15 border-amber-400/50 text-amber-600 dark:text-amber-400',
  },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('uz', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Obuna tugashigacha qolgan to'liq kunlar (o'tgan bo'lsa manfiy) */
function daysLeft(expiresAt) {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
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
        on ? 'bg-[#0095F6] border-[#0095F6]' : 'bg-slate-200 dark:bg-white/15 border-slate-300 dark:border-white/20'
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

/** Dashboard statistik kartochkasi */
function StatCard({ icon: Icon, label, value, accent, sub, loading }) {
  return (
    <div className={`${GLASS} rounded-2xl p-4 relative overflow-hidden`}>
      <span
        className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-25 pointer-events-none ${accent.blob}`}
      />
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${accent.icon}`}
      >
        <Icon size={18} />
      </span>
      <p className="text-[26px] font-extrabold text-brand dark:text-white leading-none mt-3 tabular-nums">
        {loading ? <Loader2 size={20} className="animate-spin text-slate-400" /> : value}
      </p>
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/** So'rovnoma tahlili uchun progress qator */
function ProgressRow({ label, count, total, gradient }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
          {count} ta · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** So'rovnoma tahlili bo'limi (sarlavha + progress qatorlar) */
function SurveyBlock({ icon: Icon, title, entries, labels, total, gradient }) {
  const rows = Object.entries(entries || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className={`${GLASS} rounded-2xl p-4`}>
      <h3 className="text-[13px] font-bold text-brand dark:text-white flex items-center gap-2 mb-3.5">
        <span className="w-7 h-7 rounded-lg bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green-dark">
          <Icon size={14} />
        </span>
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-[11px] text-slate-400 py-2">Hozircha ma'lumot yo'q</p>
      ) : (
        <div className="space-y-3">
          {rows.map(([id, count]) => (
            <ProgressRow
              key={id}
              label={labels[id] || id}
              count={count}
              total={total}
              gradient={gradient}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Obunani boshqarish modali — tarif tanlanadi, kunlar kiritiladi va tizim
 * "qachongacha amal qilishi"ni avtomatik hisoblab ko'rsatadi.
 */
function SubscriptionModal({ user, onClose, onSave, saving }) {
  const [plan, setPlan] = useState(user.aiPlan || 'STANDARD');
  const [days, setDays] = useState('30');

  const isPaid = plan !== 'STANDARD';
  const daysNum = parseInt(days, 10);
  const daysValid = Number.isFinite(daysNum) && daysNum >= 1 && daysNum <= 3650;
  // Amal qilish muddati — bugundan boshlab avtomatik hisoblanadi
  const expiresAt = isPaid && daysValid ? new Date(Date.now() + daysNum * 86400000) : null;

  return (
    <div
      className="fixed inset-0 z-[210] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={() => !saving && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${GLASS} w-full max-w-md rounded-3xl p-5 bg-white/90 dark:bg-[#101d2b]/95`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[15px] font-extrabold text-brand dark:text-white flex items-center gap-1.5">
              <Crown size={15} className="text-amber-500" /> Obunani boshqarish
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Nomsiz'} ·{' '}
              {user.phone || `#${user.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/70 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Joriy holat */}
        {user.aiPlan !== 'STANDARD' && user.aiPlanExpiresAt && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <CalendarDays size={12} />
            Joriy obuna: {PLAN_META[user.aiPlan]?.label} — {fmtDate(user.aiPlanExpiresAt)} gacha (
            {Math.max(0, daysLeft(user.aiPlanExpiresAt))} kun qoldi)
          </p>
        )}

        {/* Tarif tanlash */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['STANDARD', 'PRO', 'PREMIUM'].map((p) => {
            const active = plan === p;
            return (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`rounded-xl border-2 py-2.5 px-2 text-center transition-all ${
                  active
                    ? 'border-brand-green bg-brand-green/[0.08] shadow-md shadow-brand-green/15'
                    : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] hover:border-brand-green/40'
                }`}
              >
                <span
                  className={`block text-[12px] font-extrabold ${
                    active ? 'text-brand-green-dark' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {PLAN_META[p].label}
                </span>
                <span className="block text-[9px] text-slate-400 mt-0.5 leading-tight">
                  {p === 'STANDARD' ? '3 bepul savol' : p === 'PRO' ? '5 rasm/kun' : 'cheksiz'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Necha kunlik obuna */}
        <div className={isPaid ? '' : 'opacity-40 pointer-events-none'}>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            Necha kunlik obuna kerak?
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="3650"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="30"
              className="flex-1 bg-white/80 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-brand dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-green transition-colors"
            />
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">kun</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(String(d))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                  String(d) === days
                    ? 'bg-brand-green text-white border-brand-green'
                    : 'bg-white/60 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:border-brand-green/50'
                }`}
              >
                {d} kun
              </button>
            ))}
          </div>

          {/* Avtomatik hisoblangan amal qilish muddati (faqat pullik tarifda) */}
          {isPaid && (
            <div
              className={`mt-3.5 rounded-xl border px-3.5 py-2.5 flex items-center gap-2.5 ${
                expiresAt
                  ? 'bg-brand-green/[0.07] border-brand-green/30'
                  : 'bg-red-500/5 border-red-400/30'
              }`}
            >
              <Hourglass size={15} className={expiresAt ? 'text-brand-green-dark' : 'text-red-400'} />
              {expiresAt ? (
                <p className="text-[12px] text-slate-600 dark:text-slate-300">
                  Obuna{' '}
                  <span className="font-extrabold text-brand-green-dark">{fmtDate(expiresAt)}</span>{' '}
                  gacha amal qiladi ({daysNum} kun)
                </p>
              ) : (
                <p className="text-[12px] text-red-500">Kunlar sonini 1–3650 orasida kiriting</p>
              )}
            </div>
          )}
        </div>

        {!isPaid && (
          <p className="text-[11px] text-slate-400 mt-2">
            Standard tarifda obuna muddati bo'lmaydi — mavjud muddat o'chiriladi.
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-300/70 dark:hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => onSave(plan, isPaid ? daysNum : null)}
            disabled={saving || (isPaid && !daysValid)}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-green to-brand-green-dark text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-green/25 active:scale-[0.98]"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

/** Moderatsiya kartochkasi — e'lonni to'liq ko'rib, qabul qilish yoki rad etish */
function ModerationCard({ item, busy, onDecide, showActions }) {
  const img = item.images?.[0] ? resolveImageUrl(item.images[0]) : null;
  const catLabel = CATEGORIES.find((c) => c.id === item.category)?.label || item.category;
  const owner = [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || 'Nomsiz';
  return (
    <div className={`${GLASS} rounded-2xl overflow-hidden`}>
      <div className="flex gap-3.5 p-3.5">
        {/* Rasm */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-slate-200/60 dark:bg-white/[0.06] border border-white/50 dark:border-white/10 flex items-center justify-center">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus size={22} className="text-slate-400" />
          )}
        </div>

        {/* Ma'lumot */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13.5px] font-bold text-brand dark:text-white leading-snug line-clamp-2">
              {item.title}
            </h4>
            <span className="shrink-0 text-[13px] font-extrabold text-brand-green-dark whitespace-nowrap">
              {Number(item.price).toLocaleString('ru-RU')} so'm
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
            <span className="px-1.5 py-0.5 rounded-md bg-brand-green/10 border border-brand-green/25 text-brand-green-dark font-semibold">
              {catLabel}
            </span>
            {(item.region || item.district) && (
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {[item.region, item.district].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} /> {fmtDate(item.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={10} /> {item.views}
            </span>
          </div>
          {item.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
          <p className="text-[10.5px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Users size={10} />
            {owner}
            {item.user?.isVerified && <VerifiedBadge size={10} />}
            <span className="text-slate-400/80">· {item.user?.phone || `#${item.userId}`}</span>
          </p>
        </div>
      </div>

      {/* Qaror tugmalari */}
      {showActions && (
        <div className="flex gap-2 px-3.5 pb-3.5">
          <button
            onClick={() => onDecide(item, 'ACTIVE')}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-green to-brand-green-dark text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-brand-green/20"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Qabul qilish
          </button>
          <button
            onClick={() => onDecide(item, 'REJECTED')}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-400/40 text-red-500 text-[12.5px] font-bold flex items-center justify-center gap-1.5 hover:bg-red-500/15 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <XCircle size={13} /> Rad etish
          </button>
        </div>
      )}
    </div>
  );
}

/** Umumiy fon — yumshoq gradient + dekorativ nur dog'lari (glass effekt uchun zamin).
 *  MUHIM: komponent ichida emas, modul darajasida — aks holda har renderda
 *  qayta yaratilib, ichidagi inputlar fokusini yo'qotadi. */
function PageShell({ children }) {
  return (
    <div className="min-h-[100dvh] font-['Inter'] text-brand dark:text-slate-100 relative overflow-x-hidden bg-gradient-to-br from-slate-100 via-emerald-50/70 to-sky-100/60 dark:from-[#0B1520] dark:via-[#0C1A26] dark:to-[#0A1E1C]">
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-brand-green/15 dark:bg-brand-green/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-amber-300/10 dark:bg-amber-400/5 blur-3xl" />
      {children}
    </div>
  );
}

/**
 * Admin panel — /#admin manzilida ochiladi.
 * Premium dizayn: glassmorphism, Dark/Light rejim, Dashboard analitikasi,
 * obuna boshqaruvi va e'lonlar moderatsiyasi.
 */
export default function AdminPanel() {
  const { theme, setTheme } = useI18n();

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
  const [verifyingId, setVerifyingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const searchTimer = useRef(null);

  // Bo'lim: 'dashboard' | 'users' | 'moderation' | 'reports'
  const [tab, setTab] = useState('dashboard');

  // Dashboard
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Obuna modali
  const [subTarget, setSubTarget] = useState(null);
  const [subSaving, setSubSaving] = useState(false);

  // Moderatsiya
  const [animals, setAnimals] = useState([]);
  const [animalsLoading, setAnimalsLoading] = useState(false);
  const [animalsError, setAnimalsError] = useState(null);
  const [modStatus, setModStatus] = useState('PENDING');
  const [pendingCount, setPendingCount] = useState(0);
  const [decidingId, setDecidingId] = useState(null);

  // Shikoyatlar
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [openReports, setOpenReports] = useState(0);
  const [replyText, setReplyText] = useState({});
  const [sendingReplyId, setSendingReplyId] = useState(null);

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

  // Dashboard statistikasi — kirilganda va bo'lim ochilganda
  const loadStats = useCallback(() => {
    setStatsLoading(true);
    adminStats(key)
      .then((res) => {
        setStats(res);
        setPendingCount(res.pendingListings || 0);
        setStatsError(null);
      })
      .catch((err) => setStatsError(err.message))
      .finally(() => setStatsLoading(false));
  }, [key]);

  useEffect(() => {
    if (authed) loadStats();
  }, [authed, loadStats]);

  useEffect(() => {
    if (authed && tab === 'dashboard') loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Moderatsiya ro'yxati
  const loadAnimals = useCallback(
    (status = modStatus) => {
      setAnimalsLoading(true);
      adminAnimals(key, status)
        .then((res) => {
          setAnimals(res.data || []);
          setPendingCount(res.pendingCount || 0);
          setAnimalsError(null);
        })
        .catch((err) => setAnimalsError(err.message))
        .finally(() => setAnimalsLoading(false));
    },
    [key, modStatus]
  );

  useEffect(() => {
    if (authed && tab === 'moderation') loadAnimals(modStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab, modStatus]);

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
    setStats(null);
  };

  // Obunani saqlash (tarif + kunlar) — server amal qilish muddatini hisoblab qaytaradi
  const handleSubscriptionSave = async (plan, days) => {
    if (!subTarget) return;
    setSubSaving(true);
    try {
      const res = await adminSetPlan(key, subTarget.id, plan, days);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === subTarget.id
            ? { ...u, aiPlan: res.user.aiPlan, aiPlanExpiresAt: res.user.aiPlanExpiresAt }
            : u
        )
      );
      flash(
        res.user.aiPlanExpiresAt
          ? `${subTarget.firstName || 'Foydalanuvchi'} → ${PLAN_META[plan].label} (${fmtDate(res.user.aiPlanExpiresAt)} gacha)`
          : `${subTarget.firstName || 'Foydalanuvchi'} → ${PLAN_META[plan].label}`
      );
      setSubTarget(null);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSubSaving(false);
    }
  };

  const handleVerifyChange = async (user, isVerified) => {
    setVerifyingId(user.id);
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

  // Moderatsiya qarori — qabul qilish / rad etish
  const handleDecide = async (item, status) => {
    setDecidingId(item.id);
    try {
      await adminSetAnimalStatus(key, item.id, status);
      // Joriy filtr ro'yxatidan chiqarish va hisoblagichni yangilash
      setAnimals((prev) => prev.filter((a) => a.id !== item.id));
      if (item.status === 'PENDING') setPendingCount((n) => Math.max(0, n - 1));
      flash(
        status === 'ACTIVE'
          ? `"${item.title}" qabul qilindi — endi saytda ko'rinadi ✅`
          : `"${item.title}" rad etildi`
      );
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setDecidingId(null);
    }
  };

  // ── Shikoyatlar ──
  const loadReports = useCallback(() => {
    setReportsLoading(true);
    adminReports(key)
      .then((res) => {
        setReports(res.data || []);
        setOpenReports(res.openCount || 0);
        setReportsError(null);
      })
      .catch((err) => setReportsError(err.message))
      .finally(() => setReportsLoading(false));
  }, [key]);

  useEffect(() => {
    if (authed && tab === 'reports') loadReports();
  }, [authed, tab, loadReports]);

  const handleReply = async (report) => {
    const text = (replyText[report.id] || '').trim();
    if (!text || sendingReplyId) return;
    setSendingReplyId(report.id);
    try {
      await adminReplyReport(key, report.id, text);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'RESOLVED', adminReply: text } : r))
      );
      setOpenReports((n) => Math.max(0, n - 1));
      setReplyText((prev) => ({ ...prev, [report.id]: '' }));
      flash('Javob yuborildi — foydalanuvchi chatiga xabar bordi');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSendingReplyId(null);
    }
  };

  const refreshCurrent = () => {
    if (tab === 'dashboard') loadStats();
    else if (tab === 'moderation') loadAnimals();
    else if (tab === 'reports') loadReports();
    else forceReload();
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Foydalanuvchilar', icon: Users },
    { id: 'moderation', label: 'Moderatsiya', icon: Newspaper, badge: pendingCount },
    { id: 'reports', label: 'Shikoyatlar', icon: Inbox, badge: openReports },
  ];

  // ── Kirish ekrani ──
  if (!authed) {
    return (
      <PageShell>
        <div className="relative min-h-[100dvh] flex items-center justify-center p-6">
          <div className={`${GLASS} w-full max-w-sm rounded-3xl p-7`}>
            <div className="flex flex-col items-center mb-7">
              <BrandLogo variant="lg" iconOnly />
              <h1 className="text-xl font-extrabold text-brand dark:text-white mt-3">
                Chorvabozor Admin
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kirish uchun admin kalitini kiriting
              </p>
            </div>

            {checking ? (
              <div className="flex justify-center py-6">
                <Loader2 size={22} className="text-brand-green animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className={`${GLASS_SOFT} flex items-center gap-2.5 rounded-xl px-3.5 focus-within:border-brand-green transition-colors`}>
                  <KeyRound size={16} className="text-slate-500 shrink-0" />
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Admin kaliti"
                    autoFocus
                    className="flex-1 bg-transparent py-3.5 text-sm text-brand dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-red-500 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!keyInput.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-green to-brand disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-brand-green/25"
                >
                  <ShieldCheck size={16} /> Kirish
                </button>
              </form>
            )}

            <a
              href="/"
              className="block text-center text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-6 transition-colors"
            >
              ← Ilovaga qaytish
            </a>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Panel ──
  return (
    <PageShell>
      <div className="relative max-w-6xl mx-auto p-4 md:p-6">
        {/* Sarlavha — glass panel */}
        <div className={`${GLASS} rounded-2xl px-4 py-3.5 flex items-center gap-3 mb-4`}>
          <BrandLogo iconOnly />
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-extrabold leading-tight text-brand dark:text-white">
              Chorvabozor Admin
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles size={10} className="text-brand-green" /> Premium boshqaruv paneli
            </p>
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Kunduzgi/tungi rejim"
            className={`${GLASS_SOFT} w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-amber-300 hover:text-brand-green-dark transition-colors active:scale-95`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={refreshCurrent}
            title="Yangilash"
            className={`${GLASS_SOFT} w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-brand-green transition-colors active:scale-95`}
          >
            <RefreshCw
              size={15}
              className={loading || reportsLoading || statsLoading || animalsLoading ? 'animate-spin' : ''}
            />
          </button>
          <button
            onClick={handleLogout}
            title="Chiqish"
            className={`${GLASS_SOFT} w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-red-500 transition-colors active:scale-95`}
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Bo'lim almashtirgich */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                tab === id
                  ? 'bg-gradient-to-r from-brand-green to-brand-green-dark text-white border-transparent shadow-lg shadow-brand-green/25'
                  : `${GLASS_SOFT} text-slate-600 dark:text-slate-300 hover:border-brand-green/40`
              }`}
            >
              <Icon size={14} /> {label}
              {badge > 0 && (
                <span
                  className={`ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    tab === id ? 'bg-white/25 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bildirishnoma */}
        {notice && (
          <div
            className={`mb-3 text-xs px-3.5 py-2.5 rounded-xl border backdrop-blur-md ${
              notice.type === 'error'
                ? 'bg-red-500/10 border-red-400/40 text-red-500'
                : 'bg-brand-green/10 border-brand-green/30 text-brand-green-dark'
            }`}
          >
            {notice.message}
          </div>
        )}

        {/* ═══ Dashboard ═══ */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            {statsError ? (
              <div className={`${GLASS} rounded-2xl text-center py-12 px-4`}>
                <p className="text-sm text-red-500 mb-3">{statsError}</p>
                <button
                  onClick={loadStats}
                  className="px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-semibold hover:bg-brand-green-dark transition-colors"
                >
                  Qayta urinish
                </button>
              </div>
            ) : (
              <>
                {/* Asosiy ko'rsatkichlar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard
                    icon={Users}
                    label="Jami foydalanuvchilar"
                    value={stats?.totalUsers ?? '—'}
                    loading={statsLoading && !stats}
                    accent={{
                      blob: 'bg-brand-green',
                      icon: 'bg-brand-green/10 border-brand-green/30 text-brand-green-dark',
                    }}
                  />
                  <StatCard
                    icon={Wifi}
                    label="Hozir onlayn"
                    value={stats?.onlineNow ?? '—'}
                    sub="Aktiv sessiyalar"
                    loading={statsLoading && !stats}
                    accent={{
                      blob: 'bg-sky-400',
                      icon: 'bg-sky-400/10 border-sky-400/30 text-sky-500',
                    }}
                  />
                  <StatCard
                    icon={Newspaper}
                    label="Faol e'lonlar"
                    value={stats?.activeListings ?? '—'}
                    sub="Saytda ko'rinmoqda"
                    loading={statsLoading && !stats}
                    accent={{
                      blob: 'bg-amber-400',
                      icon: 'bg-amber-400/10 border-amber-400/30 text-amber-500',
                    }}
                  />
                  <StatCard
                    icon={Hourglass}
                    label="Kutilayotgan e'lonlar"
                    value={stats?.pendingListings ?? '—'}
                    sub="Moderatsiyada"
                    loading={statsLoading && !stats}
                    accent={{
                      blob: 'bg-red-400',
                      icon: 'bg-red-400/10 border-red-400/30 text-red-400',
                    }}
                  />
                </div>

                {/* So'rovnoma tahlili */}
                <div className="flex items-center gap-2 pt-2">
                  <h2 className="text-[13px] font-extrabold text-brand dark:text-white uppercase tracking-wider">
                    So'rovnoma tahlili
                  </h2>
                  <span className="text-[10px] text-slate-400">
                    ro'yxatdan o'tishdagi javoblar asosida
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <SurveyBlock
                    icon={Users}
                    title="Kim sifatida kirishgan?"
                    entries={stats?.survey?.roles}
                    labels={SURVEY_ROLE_LABELS}
                    total={stats?.totalUsers || 0}
                    gradient="from-brand-green to-emerald-400"
                  />
                  <SurveyBlock
                    icon={Send}
                    title="Qaysi tarmoqdan kelishgan?"
                    entries={stats?.survey?.sources}
                    labels={SURVEY_SOURCE_LABELS}
                    total={stats?.totalUsers || 0}
                    gradient="from-sky-500 to-cyan-400"
                  />
                  <SurveyBlock
                    icon={Sparkles}
                    title="Qaysi hayvonlarga qiziqishadi?"
                    entries={stats?.survey?.interests}
                    labels={SURVEY_INTEREST_LABELS}
                    total={stats?.survey?.answered || 0}
                    gradient="from-amber-500 to-orange-400"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ Foydalanuvchilar ═══ */}
        {tab === 'users' && (
          <>
            {/* Qidiruv */}
            <div className={`${GLASS_SOFT} flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 max-w-md`}>
              <Search size={15} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ism yoki telefon bo'yicha qidirish..."
                className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-slate-400 text-brand dark:text-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Jadval */}
            <div className={`${GLASS} rounded-2xl overflow-hidden`}>
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
                  <table className="w-full text-left min-w-[1080px]">
                    <thead>
                      <tr className="border-b border-slate-200/70 dark:border-white/10 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-white/[0.03]">
                        <th className="px-4 py-3 font-semibold">ID</th>
                        <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                        <th className="px-4 py-3 font-semibold text-center">E'lonlar</th>
                        <th className="px-4 py-3 font-semibold text-center">Rasm (bugun)</th>
                        <th className="px-4 py-3 font-semibold">So'rovnoma</th>
                        <th className="px-4 py-3 font-semibold">Sana</th>
                        <th className="px-4 py-3 font-semibold text-center">Tasdiq</th>
                        <th className="px-4 py-3 font-semibold text-right">Obuna</th>
                        <th className="px-4 py-3 font-semibold text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const meta = PLAN_META[u.aiPlan] || PLAN_META.STANDARD;
                        const left = u.aiPlanExpiresAt ? daysLeft(u.aiPlanExpiresAt) : null;
                        return (
                          <tr
                            key={u.id}
                            className="border-b border-slate-100/80 dark:border-white/[0.06] last:border-0 hover:bg-white/50 dark:hover:bg-white/[0.04] transition-colors"
                          >
                            <td className="px-4 py-3 text-xs text-slate-500">#{u.id}</td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold leading-tight flex items-center gap-1 text-brand dark:text-white">
                                {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Nomsiz'}
                                {u.isVerified && <VerifiedBadge size={13} />}
                              </p>
                              <p className="text-[11px] text-slate-500">{u.phone || u.username || '—'}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-slate-600 dark:text-slate-300">
                              {u.activeAnimals}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {u.aiPlan === 'PRO' ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                    u.aiImagesToday >= (u.aiImageLimit || 5)
                                      ? 'text-red-500'
                                      : 'text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  <ImagePlus size={11} /> {u.aiImagesToday}/{u.aiImageLimit || 5}
                                </span>
                              ) : u.aiPlan === 'PREMIUM' ? (
                                <span className="text-[11px] text-amber-500 font-semibold">∞</span>
                              ) : (
                                <span
                                  className={`text-[11px] font-semibold ${
                                    (u.aiUsageCount ?? 0) >= 3 ? 'text-red-500' : 'text-slate-500'
                                  }`}
                                  title="Bepul savollar (jami 3 ta)"
                                >
                                  {Math.min(u.aiUsageCount ?? 0, 3)}/3
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <SurveyCell user={u} />
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {fmtDate(u.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <VerifySwitch user={u} busy={verifyingId === u.id} onChange={handleVerifyChange} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              {/* Obuna tugmasi — modal ochadi; muddat shu yerda ko'rinadi */}
                              <button
                                onClick={() => setSubTarget(u)}
                                title="Obunani boshqarish"
                                className={`inline-flex flex-col items-end rounded-lg border px-2.5 py-1.5 transition-all hover:shadow-md active:scale-95 ${meta.cls}`}
                              >
                                <span className="text-[11.5px] font-extrabold flex items-center gap-1">
                                  {u.aiPlan === 'PREMIUM' && <Crown size={10} />}
                                  {meta.label}
                                </span>
                                {u.aiPlan !== 'STANDARD' && u.aiPlanExpiresAt ? (
                                  <span
                                    className={`text-[9.5px] font-semibold flex items-center gap-0.5 mt-0.5 ${
                                      left <= 3 ? 'text-red-500' : 'opacity-80'
                                    }`}
                                  >
                                    <CalendarDays size={9} /> {fmtDate(u.aiPlanExpiresAt)} · {Math.max(0, left)} kun
                                  </span>
                                ) : u.aiPlan !== 'STANDARD' ? (
                                  <span className="text-[9.5px] opacity-70 mt-0.5">muddatsiz</span>
                                ) : null}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setDeleteTarget(u)}
                                title="Foydalanuvchini o'chirish"
                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] inline-flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 mt-4 text-center">
              Obuna muddati tugagach foydalanuvchi avtomatik Standard tarifga qaytadi.
            </p>
          </>
        )}

        {/* ═══ Moderatsiya (Kutilayotgan e'lonlar) ═══ */}
        {tab === 'moderation' && (
          <div className="space-y-3">
            {/* Status filtri */}
            <div className="flex items-center gap-2">
              {[
                { id: 'PENDING', label: 'Kutilmoqda', icon: Hourglass },
                { id: 'ACTIVE', label: 'Qabul qilingan', icon: CheckCircle2 },
                { id: 'REJECTED', label: 'Rad etilgan', icon: XCircle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setModStatus(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                    modStatus === id
                      ? 'bg-brand text-white border-brand dark:bg-brand-green dark:border-brand-green'
                      : `${GLASS_SOFT} text-slate-500 dark:text-slate-300 hover:border-brand-green/40`
                  }`}
                >
                  <Icon size={12} /> {label}
                  {id === 'PENDING' && pendingCount > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {animalsLoading && animals.length === 0 ? (
              <div className={`${GLASS} rounded-2xl flex justify-center py-16`}>
                <Loader2 size={22} className="text-brand-green animate-spin" />
              </div>
            ) : animalsError ? (
              <div className={`${GLASS} rounded-2xl text-center py-12 px-4`}>
                <p className="text-sm text-red-500 mb-3">{animalsError}</p>
                <button
                  onClick={() => loadAnimals()}
                  className="px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-semibold hover:bg-brand-green-dark transition-colors"
                >
                  Qayta urinish
                </button>
              </div>
            ) : animals.length === 0 ? (
              <div className={`${GLASS} rounded-2xl text-center py-16`}>
                <CheckCircle2 size={28} className="text-brand-green/60 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {modStatus === 'PENDING'
                    ? "Moderatsiya kutayotgan e'lonlar yo'q — hammasi ko'rib chiqilgan 🎉"
                    : "Bu bo'limda e'lonlar yo'q"}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {animals.map((a) => (
                  <ModerationCard
                    key={a.id}
                    item={a}
                    busy={decidingId === a.id}
                    onDecide={handleDecide}
                    showActions={modStatus !== 'ACTIVE' || a.status !== 'ACTIVE'}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ Shikoyatlar ═══ */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reportsLoading && reports.length === 0 ? (
              <div className={`${GLASS} rounded-2xl flex justify-center py-16`}>
                <Loader2 size={22} className="text-brand-green animate-spin" />
              </div>
            ) : reportsError ? (
              <div className={`${GLASS} rounded-2xl text-center py-12 px-4`}>
                <p className="text-sm text-red-500 mb-3">{reportsError}</p>
                <button
                  onClick={loadReports}
                  className="px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-semibold hover:bg-brand-green-dark transition-colors"
                >
                  Qayta urinish
                </button>
              </div>
            ) : reports.length === 0 ? (
              <div className={`${GLASS} rounded-2xl text-center py-16`}>
                <Inbox size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Hozircha shikoyatlar yo'q</p>
              </div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className={`${GLASS} rounded-2xl p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand dark:text-white flex items-center gap-2">
                        {[r.reporter?.firstName, r.reporter?.lastName].filter(Boolean).join(' ') ||
                          'Nomsiz'}
                        <span className="text-[11px] font-normal text-slate-400">
                          {r.reporter?.phone || `#${r.reporterId}`}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {fmtDate(r.createdAt)}
                        {r.targetType !== 'OTHER' && (
                          <span className="ml-1">
                            • {r.targetType}
                            {r.targetId ? ` #${r.targetId}` : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    {r.status === 'RESOLVED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green-dark bg-brand-green/10 border border-brand-green/30 rounded-full px-2 py-0.5 shrink-0">
                        <CheckCircle2 size={12} /> Javob berilgan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-400/10 border border-amber-400/40 rounded-full px-2 py-0.5 shrink-0">
                        <Clock size={12} /> Yangi
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5 whitespace-pre-wrap break-words bg-slate-100/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] rounded-xl px-3 py-2">
                    {r.reason}
                  </p>

                  {r.status === 'RESOLVED' && r.adminReply ? (
                    <div className="mt-2.5 border-l-2 border-brand-green pl-3">
                      <p className="text-[10px] font-bold text-brand-green-dark uppercase tracking-wider">
                        Javobingiz
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-wrap break-words">
                        {r.adminReply}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <textarea
                        value={replyText[r.id] || ''}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        placeholder="Foydalanuvchiga javob yozing — chatiga 'Qo'llab-quvvatlash (Admin)' nomidan boradi..."
                        rows={2}
                        maxLength={2000}
                        className={`${GLASS_SOFT} w-full rounded-xl px-3 py-2 text-sm text-brand dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-green transition-colors resize-none`}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleReply(r)}
                          disabled={!(replyText[r.id] || '').trim() || sendingReplyId === r.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors active:scale-[0.98]"
                        >
                          {sendingReplyId === r.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          Javob yuborish
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Obuna modali ── */}
      {subTarget && (
        <SubscriptionModal
          key={subTarget.id} /* boshqa foydalanuvchiga ochilganda holat yangidan boshlanadi */
          user={subTarget}
          onClose={() => setSubTarget(null)}
          onSave={handleSubscriptionSave}
          saving={subSaving}
        />
      )}

      {/* ── O'chirishni tasdiqlash modali ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${GLASS} w-full max-w-sm rounded-2xl p-5 bg-white/90 dark:bg-[#101d2b]/95`}
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-red-500/10 border border-red-400/30 flex items-center justify-center text-red-500">
                <AlertTriangle size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-brand dark:text-white">
                  Foydalanuvchini o'chirish
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  <span className="font-semibold text-brand dark:text-white">
                    {[deleteTarget.firstName, deleteTarget.lastName].filter(Boolean).join(' ') ||
                      'Nomsiz'}
                  </span>{' '}
                  ({deleteTarget.phone || deleteTarget.username || `#${deleteTarget.id}`}) hisobini
                  butunlay o'chirmoqchimisiz? Barcha e'lonlari, xabarlari va suhbatlari ham o'chib
                  ketadi.{' '}
                  <span className="font-semibold text-red-500">
                    Bu amalni ortga qaytarib bo'lmaydi.
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-300/70 dark:hover:bg-white/15 transition-colors disabled:opacity-50"
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
    </PageShell>
  );
}
