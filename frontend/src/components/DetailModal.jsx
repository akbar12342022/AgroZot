import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Eye,
  Heart,
  MapPin,
  Clock,
  Award,
  Phone,
  Share2,
  Check,
  MessageCircle,
  Loader2,
  FileText,
  ListChecks,
  ShieldCheck,
  User,
} from 'lucide-react';
import { formatPrice, imgFallback } from '../utils/helpers';
import { VerifiedBadge } from './icons';
import AIAnalyze from '../ai/AIAnalyze';

/** Bo'lim sarlavhasi — och yashil doira ichida ikonka + matn */
function Section({ icon: Icon, title, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="section-ic">
        <Icon size={14} />
      </span>
      <h3 className="text-[13px] font-bold text-brand">{title}</h3>
      {children}
    </div>
  );
}

/** E'lon batafsil oynasi */
export default function DetailModal({
  listing,
  onClose,
  isBookmarked,
  onBookmark,
  showToast,
  onMessageSeller,
  currentUserId,
}) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const isOwnListing = currentUserId != null && listing.userId === currentUserId;

  const handleMessageSeller = async () => {
    if (openingChat || !onMessageSeller) return;
    setOpeningChat(true);
    try {
      await onMessageSeller(listing);
    } catch (err) {
      showToast?.(err.message || 'Suhbatni ochib bo\'lmadi', 'error');
    } finally {
      setOpeningChat(false);
    }
  };
  const allImages = listing.images || [listing.img];
  const galleryRef = useRef(null);

  const handleShare = async () => {
    const shareText = `${listing.title} — ${formatPrice(listing.price)} | Chorvabozor`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Chorvabozor', text: shareText, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
        setCopied(true);
        showToast?.("E'lon havolasi nusxalandi", 'success');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* foydalanuvchi bekor qildi */
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (galleryRef.current) {
        const scrollLeft = galleryRef.current.scrollLeft;
        const width = galleryRef.current.offsetWidth;
        setActiveImgIdx(Math.round(scrollLeft / width));
      }
    };
    const gallery = galleryRef.current;
    if (gallery) {
      gallery.addEventListener('scroll', handleScroll);
      return () => gallery.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg md:max-w-2xl h-[92dvh] md:h-[85vh] bg-brand-bg md:rounded-3xl overflow-hidden flex flex-col relative"
      >
        {/* Sarlavha paneli */}
        <div className="glass-header flex items-center justify-between px-3 py-2.5 border-b border-slate-200 shrink-0 z-10">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
          >
            <ChevronLeft size={19} />
          </button>
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <Eye size={13} />
            {listing.views || 0} ko'rishlar
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Ulashish"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
            >
              {copied ? <Check size={17} className="text-brand-green-dark" /> : <Share2 size={16} className="text-slate-600" />}
            </button>
            <button
              onClick={() => onBookmark(listing)}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
            >
              <Heart size={18} className={isBookmarked ? 'text-red-500 fill-red-500' : 'text-slate-600'} />
            </button>
          </div>
        </div>

        {/* Kontent */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-28">
          {/* Rasm galereyasi */}
          <div className="relative bg-slate-900">
            <div ref={galleryRef} className="gallery-container flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {allImages.map((src, idx) => (
                <div key={idx} className="w-full shrink-0 snap-center" style={{ aspectRatio: '4/3' }}>
                  <img src={src} alt="" className="w-full h-full object-cover" onError={imgFallback} />
                </div>
              ))}
            </div>
            {/* Rasm hisoblagichi */}
            {allImages.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] text-white/95 font-semibold">
                📷 {activeImgIdx + 1} / {allImages.length}
              </div>
            )}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${idx === activeImgIdx ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-4 space-y-3.5">
            {/* Narx + sarlavha */}
            <div>
              {(listing.isTop || (listing.badges && listing.badges.length > 0)) && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {listing.isTop && (
                    <span className="badge-top px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm">
                      <Award size={11} /> TOP E'lon
                    </span>
                  )}
                  {listing.badges &&
                    listing.badges.map((b, idx) => (
                      <span key={idx} className="badge-emlangan px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                        {b}
                      </span>
                    ))}
                </div>
              )}
              <p className="text-[28px] leading-none font-extrabold text-brand-green-dark tracking-tight">
                {formatPrice(listing.price)}
              </p>
              <h2 className="text-[15px] font-semibold text-brand mt-2.5 leading-snug">{listing.title}</h2>

              {/* Manzil va vaqt — chiplar */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                  <MapPin size={13} className="text-brand-green" /> {listing.location}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                  <Clock size={13} className="text-brand-green" /> {listing.time}
                </span>
              </div>

              {/* Kontekstual AI tahlil — narx tagida */}
              <AIAnalyze listing={listing} />
            </div>

            {/* Tavsif */}
            <div className="surface-card p-4">
              <Section icon={FileText} title="Tavsif" />
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {listing.description || "Sotuvchi tavsif qoldirmagan. Batafsil ma'lumot uchun qo'ng'iroq qiling."}
              </p>
            </div>

            {/* Xarakteristikalar (kalitlar tayyor nomlar bilan keladi) */}
            {listing.specs && (
              <div className="surface-card p-4">
                <Section icon={ListChecks} title="Xarakteristikalar" />
                <div className="char-grid">
                  {Object.entries(listing.specs).map(([label, val]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-[11px] text-slate-500 mb-0.5">{label}</span>
                      <span className="text-sm font-semibold text-brand">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sotuvchi */}
            <div className="surface-card p-4">
              <Section icon={User} title="Sotuvchi">
                {listing.sellerVerified && (
                  <span className="ml-auto inline-flex items-center gap-1 bg-brand-green/10 border border-brand-green/25 text-brand-green-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <VerifiedBadge size={11} /> Tasdiqlangan
                  </span>
                )}
              </Section>
              <div className="flex items-center gap-3">
                {listing.sellerAvatar ? (
                  <img
                    src={listing.sellerAvatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-brand-green/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-green to-brand flex items-center justify-center text-white text-base font-bold shrink-0 ring-2 ring-brand-green/20">
                    {listing.sellerName?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand truncate flex items-center gap-1">
                    {listing.sellerName || 'Sotuvchi'}
                    {listing.sellerVerified && <VerifiedBadge size={14} />}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chorvabozor'da {listing.sellerSince || '2026'}-yildan beri
                  </p>
                </div>
              </div>
              {/* Xavfsizlik eslatmasi */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
                <ShieldCheck size={14} className="text-brand-green shrink-0 mt-0.5" />
                Xavfsiz savdo uchun to'lovni hayvonni ko'rib, ishonch hosil qilgach amalga oshiring.
              </div>
            </div>
          </div>
        </div>

        {/* Pastki harakat paneli (safe-area: uy indikatori tugmalarni yopmasligi uchun) */}
        <div className="action-bar absolute bottom-0 left-0 right-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex gap-2.5 shrink-0">
          {isOwnListing ? (
            <div className="flex-1 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center justify-center">
              Bu sizning e'loningiz
            </div>
          ) : (
            <>
              {listing.sellerPhone && (
                <a
                  href={`tel:${listing.sellerPhone}`}
                  className="btn-phone flex-[1.4] py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-green/25"
                >
                  <Phone size={16} />
                  Qo'ng'iroq qilish
                </a>
              )}
              <button
                onClick={handleMessageSeller}
                disabled={openingChat}
                className="flex-1 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-brand-green/40 transition-colors disabled:opacity-60 active:scale-[0.98]"
              >
                {openingChat ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <MessageCircle size={15} />
                )}
                Xabar yozish
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
