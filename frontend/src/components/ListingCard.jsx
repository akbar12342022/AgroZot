import { MapPin, Heart, Award, ShieldCheck } from 'lucide-react';
import { formatPrice, imgFallback } from '../utils/helpers';
import { VerifiedBadge } from './icons';

/** E'lon kartochkasi — premium marketplace uslubi (mayin soya, yashil narx, tasdiqlangan sotuvchi) */
export default function ListingCard({ item, isBookmarked, onBookmark, onSelect }) {
  const verified = item.sellerVerified;

  return (
    <div
      onClick={() => onSelect(item)}
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer listing-card flex flex-col"
    >
      {/* Rasm — 4:3 nisbat */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={item.img || (item.images && item.images[0])}
          alt={item.title}
          className="w-full h-full object-cover card-img-zoom"
          loading="lazy"
          onError={(e) => imgFallback(e, item.category)}
        />

        {/* Yuqori-chap belgi */}
        {item.isTop && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="badge-top px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-lg">
              <Award size={10} /> TOP
            </span>
          </div>
        )}
        {!item.isTop && item.badges && item.badges.includes('Zotdor') && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="badge-zotdor px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-sm">
              Zotdor
            </span>
          </div>
        )}

        {/* Sevimlilar — yuqori-o'ng */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark(item);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all hover:bg-slate-900/50 active:scale-90"
        >
          <Heart
            size={15}
            className={`transition-colors ${isBookmarked ? 'text-red-500 fill-red-500' : 'text-white/85'}`}
          />
        </button>

        {/* Rasm soni */}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-2 right-2.5 z-10 bg-black/55 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] text-white/90 font-medium">
            📷 {item.images.length}
          </div>
        )}
      </div>

      {/* Kartochka tanasi */}
      <div className="p-3 flex flex-col flex-1">
        {/* Narx — yirik, qalin, yashil (e'tiborni tortadi) */}
        <p className="text-[17px] font-extrabold text-brand-green-dark leading-tight tracking-tight">
          {formatPrice(item.price)}
        </p>

        {/* Sarlavha — 2 qatorgacha */}
        <h4 className="mt-1 text-[13px] font-medium text-brand line-clamp-2 leading-snug min-h-[2.4em]">
          {item.title}
        </h4>

        {/* Joylashuv va vaqt */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <MapPin size={11} className="text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-500 truncate">
            {item.location} • {item.time}
          </span>
        </div>

        {/* Sotuvchi + Tasdiqlangan belgi (ishonch uyg'otadi) */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          {item.sellerAvatar ? (
            <img src={item.sellerAvatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-green to-brand flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {item.sellerName?.charAt(0) || 'S'}
            </span>
          )}
          <span className="text-[11px] font-medium text-slate-600 truncate">
            {item.sellerName || 'Sotuvchi'}
          </span>
          {verified ? (
            <VerifiedBadge size={13} className="shrink-0" />
          ) : (
            <ShieldCheck size={12} className="text-slate-300 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
