/** E'lon kartochkasi uchun yuklanish skeleti (yangilangan kartochkaga mos) */
export default function ListingSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse listing-card">
      <div style={{ aspectRatio: '4/3' }} className="bg-slate-200" />
      <div className="p-3">
        {/* Narx */}
        <div className="h-5 bg-slate-200 rounded-md w-2/3" />
        {/* Sarlavha */}
        <div className="h-3 bg-slate-200 rounded w-full mt-2" />
        <div className="h-3 bg-slate-200 rounded w-4/5 mt-1.5" />
        {/* Joylashuv */}
        <div className="h-2.5 bg-slate-200 rounded w-1/2 mt-2.5" />
        {/* Sotuvchi qatori */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
          <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
          <div className="h-2.5 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
