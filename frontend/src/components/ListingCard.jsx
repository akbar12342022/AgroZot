import { MapPin, Heart, Award } from 'lucide-react';
import { formatPrice, imgFallback } from '../utils/helpers';

/** Listing Card — OLX/Avito style */
export default function ListingCard({ item, isBookmarked, onBookmark, onSelect }) {
  return (
    <div 
      onClick={() => onSelect(item)}
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer card-hover-shadow"
    >
      {/* Image Container — 4:3 Aspect Ratio */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={item.img || (item.images && item.images[0])}
          alt={item.title}
          className="w-full h-full object-cover card-img-zoom"
          loading="lazy"
          onError={(e) => imgFallback(e, item.category)}
        />
        
        {/* Top-left badge */}
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

        {/* Heart — top-right */}
        <button 
          onClick={(e) => { e.stopPropagation(); onBookmark(item); }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all hover:bg-slate-900/40 active:scale-90"
        >
          <Heart 
            size={15} 
            className={`transition-colors ${isBookmarked ? 'text-red-500 fill-red-500' : 'text-white/80'}`} 
          />
        </button>

        {/* Bottom gradient overlay for image count */}
        {item.images && item.images.length > 1 && (
          <div className="absolute bottom-2 right-2.5 z-10 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] text-white/90 font-medium">
            📷 {item.images.length}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 space-y-1.5">
        {/* Price — bold and prominent */}
        <p className="text-[15px] font-extrabold text-brand leading-tight">
          {formatPrice(item.price)}
        </p>

        {/* Title — max 2 lines */}
        <h4 className="text-[13px] font-medium text-brand line-clamp-2 leading-snug">
          {item.title}
        </h4>

        {/* Location & Time */}
        <div className="flex items-center gap-1.5 pt-1">
          <MapPin size={11} className="text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-500 truncate">
            {item.location} • {item.time}
          </span>
        </div>
      </div>
    </div>
  );
}
