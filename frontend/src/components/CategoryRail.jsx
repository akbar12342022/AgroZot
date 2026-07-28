/**
 * Kategoriya tanlagichi — och yashil doira ichida zamonaviy SVG ikonka + tag.
 * Sarlavha ostiga yopishib turadi (sticky), gorizontal aylanadi.
 */
export default function CategoryRail({ categories, activeCategory, onSelect }) {
  return (
    <div className="glass-header sticky top-0 z-20 border-b border-slate-200">
      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 py-3">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="cat-item group flex flex-col items-center gap-1.5 shrink-0 w-[62px] focus:outline-none"
              aria-pressed={active}
            >
              <span
                className={`cat-circle w-14 h-14 rounded-full flex items-center justify-center border ${
                  active
                    ? 'is-active bg-brand-green border-brand-green text-white'
                    : 'bg-brand-green/10 border-brand-green/20 text-brand-green-dark'
                }`}
              >
                <cat.icon size={24} />
              </span>
              <span
                className={`text-[10.5px] leading-tight text-center truncate w-full ${
                  active ? 'font-bold text-brand-green-dark' : 'font-medium text-slate-500'
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
