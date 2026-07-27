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
} from 'lucide-react';
import { formatPrice, imgFallback } from '../utils/helpers';
import { VerifiedBadge } from './icons';

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
    const shareText = `${listing.title} — ${formatPrice(listing.price)} | AgroZot`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AgroZot', text: shareText, url: window.location.href });
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
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg md:max-w-2xl h-[92dvh] md:h-[85vh] bg-white md:rounded-2xl overflow-hidden flex flex-col relative"
      >
        {/* Sarlavha paneli */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs text-slate-500 font-medium">
            <Eye size={12} className="inline mr-1" />
            {listing.views || 0} ko'rishlar
          </span>
          <div className="flex items-center gap-1">
            <button onClick={handleShare} className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors" title="Ulashish">
              {copied ? <Check size={18} className="text-brand-green-dark" /> : <Share2 size={18} className="text-slate-500" />}
            </button>
            <button onClick={() => onBookmark(listing)} className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <Heart size={20} className={isBookmarked ? 'text-red-500 fill-red-500' : 'text-slate-500'} />
            </button>
          </div>
        </div>

        {/* Kontent */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
          {/* Rasm galereyasi */}
          <div className="relative bg-black">
            <div ref={galleryRef} className="gallery-container flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              {allImages.map((src, idx) => (
                <div key={idx} className="w-full shrink-0 snap-center" style={{ aspectRatio: '4/3' }}>
                  <img src={src} alt="" className="w-full h-full object-cover" onError={imgFallback} />
                </div>
              ))}
            </div>
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeImgIdx ? 'bg-white w-4' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Narx */}
            <div>
              <p className="text-2xl font-extrabold text-brand tracking-tight">{formatPrice(listing.price)}</p>
              <h2 className="text-sm font-medium text-slate-600 mt-1.5 leading-relaxed">{listing.title}</h2>
            </div>

            {/* Belgilar */}
            <div className="flex flex-wrap gap-1.5">
              {listing.isTop && (
                <span className="badge-top px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1">
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

            {/* Manzil va vaqt */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-500" /> {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-slate-500" /> {listing.time}
              </span>
            </div>

            {/* Tavsif */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tavsif</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {listing.description || "Sotuvchi tavsif qoldirmagan. Batafsil ma'lumot uchun qo'ng'iroq qiling."}
              </p>
            </div>

            {/* Xarakteristikalar (kalitlar tayyor nomlar bilan keladi) */}
            {listing.specs && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Xarakteristikalar</h3>
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
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sotuvchi</h3>
              <div className="flex items-center gap-3">
                {listing.sellerAvatar ? (
                  <img
                    src={listing.sellerAvatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover shrink-0 shadow-lg shadow-brand-green/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-green to-brand flex items-center justify-center text-white text-base font-bold shrink-0 shadow-lg shadow-brand-green/20">
                    {listing.sellerName?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand truncate flex items-center gap-1">
                    {listing.sellerName || 'Sotuvchi'}
                    {listing.sellerVerified && <VerifiedBadge size={14} />}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">AgroZot'da {listing.sellerSince || '2026'}-yildan beri</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pastki harakat paneli (safe-area: uy indikatori tugmalarni yopmasligi uchun) */}
        <div className="action-bar absolute bottom-0 left-0 right-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex gap-2.5 shrink-0">
          {isOwnListing ? (
            <div className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center justify-center">
              Bu sizning e'loningiz
            </div>
          ) : (
            <>
              {listing.sellerPhone && (
                <a
                  href={`tel:${listing.sellerPhone}`}
                  className="btn-phone flex-[1.4] py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Phone size={16} />
                  Qo'ng'iroq qilish
                </a>
              )}
              <button
                onClick={handleMessageSeller}
                disabled={openingChat}
                className="flex-1 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-60"
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
