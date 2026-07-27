/** Reusable Empty State Component */
export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 h-full w-full">
      {Icon && <Icon size={40} className="mb-3 text-slate-500" />}
      <p className="text-sm font-medium text-brand">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
