/** Loading Skeleton for ListingCard */
export default function ListingSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
      <div style={{ aspectRatio: '4/3' }} className="bg-slate-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}
