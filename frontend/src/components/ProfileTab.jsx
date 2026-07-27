import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Phone,
  Check,
  X,
  LogOut,
  PlusCircle,
  Bookmark,
  ClipboardList,
  Camera,
  Globe,
  Moon,
  Send,
  LifeBuoy,
} from 'lucide-react';
import { fetchMe, fetchMyAnimals, deleteAnimal, updateMyName, updateMyAvatar } from '../api/animals';
import { uploadMedia } from '../api/chat';
import { patchStoredUser } from '../api/auth';
import { resolveImageUrl } from '../api/client';
import { normalizeAnimal, formatPrice } from '../utils/helpers';
import { useI18n } from '../i18n.js';
import EmptyState from './EmptyState';
import ListingCard from './ListingCard';
import { VerifiedBadge } from './icons';

const ADMIN_TELEGRAM = 'https://t.me/afaridshop';
const ADMIN_PHONE_DISPLAY = '+998 95 978 74 74';
const ADMIN_PHONE_TEL = '+998959787474';

/** Profil: foydalanuvchi ma'lumotlari, statistika, mening e'lonlarim, saqlanganlar */
export default function ProfileTab({
  savedItems,
  onEdit,
  onOpenListing,
  onGoPost,
  onLogout,
  onBookmark,
  isBookmarked,
  showToast,
  refreshKey,
}) {
  const [me, setMe] = useState(null);
  const [myAnimals, setMyAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // "Qayta urinish" uchun
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const { t, lang, setLang, theme, setTheme } = useI18n();

  // Ma'lumotlarni yuklash — setState faqat promise callbacklarida (asinxron)
  // chaqiriladi, effekt ichida sinxron render zanjiri hosil bo'lmaydi.
  useEffect(() => {
    let alive = true;
    Promise.all([fetchMe(), fetchMyAnimals()])
      .then(([meData, myData]) => {
        if (!alive) return;
        setMe(meData);
        setMyAnimals((myData.data || []).map(normalizeAnimal));
        setError(null);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey, reloadKey]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteAnimal(id);
      showToast("E'lon o'chirildi", 'success');
      setMyAnimals((prev) => prev.filter((a) => a.id !== id));
      setMe((prev) =>
        prev
          ? { ...prev, stats: { ...prev.stats, activeAnimals: Math.max(0, (prev.stats?.activeAnimals || 1) - 1) } }
          : prev
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  const handleSaveName = async () => {
    if (nameInput.trim().length < 2) return;
    setSavingName(true);
    try {
      await updateMyName(nameInput.trim());
      setMe((prev) => (prev ? { ...prev, firstName: nameInput.trim() } : prev));
      setEditingName(false);
      showToast(t('profile.nameSaved'), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingName(false);
    }
  };

  // Profil rasmini yuklash: avval faylni serverga, so'ng profilga biriktiramiz
  const handleAvatarFile = async (file) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { url } = await uploadMedia(file);
      await updateMyAvatar(url);
      setMe((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
      patchStoredUser({ avatarUrl: url });
      showToast(t('profile.avatarSaved'), 'success');
    } catch (err) {
      showToast(err.message || 'Rasm yuklanmadi', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-brand-green-dark animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <EmptyState icon={Shield} title="Profil yuklanmadi" subtitle={error} />
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            setReloadKey((k) => k + 1);
          }}
          className="mx-auto block mt-2 px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-brand-green-dark transition-colors"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
  const initial = (me?.firstName || 'F').charAt(0).toUpperCase();
  const avatarSrc = resolveImageUrl(me?.avatarUrl);
  const stats = [
    { label: t('profile.myListingsStat'), value: String(me?.stats?.activeAnimals ?? 0), icon: ClipboardList },
    { label: t('profile.savedStat'), value: String(savedItems.length), icon: Bookmark },
    { label: t('profile.viewsStat'), value: String(me?.stats?.totalViews ?? 0), icon: Eye },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand">{t('profile.title')}</h2>
        {confirmLogout ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-[11px] font-bold transition-colors"
            >
              {t('profile.logout')}
            </button>
            <button
              onClick={() => setConfirmLogout(false)}
              className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium hover:text-slate-600 transition-colors"
            >
              {t('profile.cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLogout(true)}
            title={t('profile.logoutTitle')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <LogOut size={13} /> {t('profile.logout')}
          </button>
        )}
      </div>

      {/* Profil kartasi */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {/* Avatar — bosilsa rasm yuklanadi */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              handleAvatarFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
            title={t('profile.avatarChange')}
            className="relative w-14 h-14 shrink-0 rounded-full group focus:outline-none"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="w-14 h-14 rounded-full object-cover shadow-lg shadow-brand-green/20"
              />
            ) : (
              <span className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-green to-brand flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-brand-green/20">
                {initial}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-brand-green border-2 border-white flex items-center justify-center text-white">
              {uploadingAvatar ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Camera size={11} />
              )}
            </span>
          </button>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={60}
                  autoFocus
                  className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-brand focus:outline-none focus:border-brand-green"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="w-8 h-8 shrink-0 rounded-lg bg-brand-green hover:bg-brand-green-dark flex items-center justify-center text-white transition-colors disabled:opacity-60"
                >
                  {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNameInput(me?.firstName || '');
                  setEditingName(true);
                }}
                className="flex items-center gap-2 group text-left"
              >
                <h3 className="text-base font-bold text-brand truncate flex items-center gap-1.5">
                  {fullName}
                  {me?.isVerified && <VerifiedBadge size={15} />}
                </h3>
                <Pencil size={12} className="text-slate-500 group-hover:text-brand-green transition-colors shrink-0" />
              </button>
            )}
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Phone size={11} className="text-slate-500" /> {me?.phone}
            </p>
            {me?.isVerified && (
              <p className="text-[11px] text-[#0095F6] mt-1 flex items-center gap-1 font-semibold">
                <VerifiedBadge size={11} /> {t('profile.verified')}
              </p>
            )}
            <div className="mt-2">
              {me?.aiPlan === 'PREMIUM' ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-600 text-[10px] font-extrabold tracking-wide">
                  AI PREMIUM — cheksiz
                </span>
              ) : me?.aiPlan === 'PRO' ? (
                <span className="px-2 py-0.5 rounded-md bg-brand-green/10 border border-brand-green/40 text-brand-green-dark text-[10px] font-extrabold tracking-wide">
                  AI PRO
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-slate-200 border border-slate-200 text-slate-500 text-[10px] font-semibold">
                  AI STANDARD — 3 bepul savol
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <stat.icon size={17} className="mx-auto mb-1.5 text-brand-green-dark" />
            <p className="text-base font-bold text-brand">{stat.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Sozlamalar: til va tungi rejim ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 pt-4 pb-1">
          {t('profile.settings')}
        </h3>

        {/* Til */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <span className="w-9 h-9 shrink-0 rounded-lg bg-brand-sky/10 border border-brand-sky/30 flex items-center justify-center text-brand-sky">
            <Globe size={16} />
          </span>
          <span className="flex-1 text-sm font-medium text-brand">{t('profile.language')}</span>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setLang('uz')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                lang === 'uz' ? 'bg-brand-green text-white' : 'text-slate-500 hover:text-slate-600'
              }`}
            >
              O'zbekcha
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                lang === 'ru' ? 'bg-brand-green text-white' : 'text-slate-500 hover:text-slate-600'
              }`}
            >
              Русский
            </button>
          </div>
        </div>

        {/* Tungi rejim */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-9 h-9 shrink-0 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
            <Moon size={16} />
          </span>
          <span className="flex-1 text-sm font-medium text-brand">{t('profile.darkMode')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`relative inline-flex w-11 h-6 rounded-full border transition-colors ${
              theme === 'dark' ? 'bg-brand-green border-brand-green' : 'bg-slate-200 border-slate-300'
            }`}
          >
            <span
              className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all duration-200 ${
                theme === 'dark' ? 'left-[22px]' : 'left-[2px]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Admin bilan bog'lanish ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="w-9 h-9 shrink-0 rounded-lg bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green-dark">
            <LifeBuoy size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-brand">{t('profile.adminContact')}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('profile.adminContactHint')}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <a
            href={ADMIN_TELEGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-telegram flex-1 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            <Send size={14} /> {t('profile.telegramWrite')}
          </a>
          <a
            href={`tel:${ADMIN_PHONE_TEL}`}
            className="btn-phone flex-1 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            <Phone size={14} /> {ADMIN_PHONE_DISPLAY}
          </a>
        </div>
      </div>

      {/* Mening e'lonlarim */}
      <div>
        <h3 className="text-sm font-bold text-brand mb-2.5">{t('profile.myListings')}</h3>
        {myAnimals.length === 0 ? (
          <div>
            <EmptyState icon={PlusCircle} title={t('profile.noListings')} subtitle={t('profile.noListingsHint')} />
            <button
              onClick={onGoPost}
              className="mx-auto block px-5 py-2.5 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-brand-green-dark transition-colors active:scale-[0.98]"
            >
              {t('profile.postListing')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {myAnimals.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-3">
                <img
                  src={item.img}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover shrink-0 cursor-pointer"
                  onClick={() => onOpenListing(item)}
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenListing(item)}>
                  <p className="text-xs font-semibold text-brand truncate">{item.title}</p>
                  <p className="text-[13px] font-bold text-brand-green-dark mt-0.5">{formatPrice(item.price)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Eye size={9} /> {item.views || 0} • {item.time}
                  </p>
                </div>

                {confirmingId === item.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      {deletingId === item.id ? <Loader2 size={11} className="animate-spin" /> : "O'chirish"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium hover:text-slate-600 transition-colors"
                    >
                      Bekor
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onEdit(item)}
                      className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-brand-green transition-colors"
                      title="Tahrirlash"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmingId(item.id)}
                      className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saqlangan e'lonlar */}
      <div>
        <h3 className="text-sm font-bold text-brand mb-2.5">{t('profile.savedListings')}</h3>
        {savedItems.length === 0 ? (
          <EmptyState icon={Bookmark} title={t('profile.noSaved')} subtitle={t('profile.noSavedHint')} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {savedItems.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                isBookmarked={isBookmarked(item.id)}
                onBookmark={onBookmark}
                onSelect={onOpenListing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
