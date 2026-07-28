import { Search, X, ShieldCheck, BadgeCheck, MapPin } from 'lucide-react';

/**
 * Bosh sahifa "Hero" bo'limi — to'q yashil→teal gradient bant ustida
 * katta sarlavha, chiroyli qidiruv paneli va ishonch statistikasi.
 * searchQuery/setSearchQuery — bosh sahifa qidiruvi bilan bir holatga bog'langan.
 * sentinelRef — hero ekrandan chiqqanini aniqlash uchun (headerda ixcham qidiruv chiqadi).
 */
export default function HeroSection({ searchQuery, setSearchQuery, total, sentinelRef }) {
  const stats = [
    { icon: ShieldCheck, label: 'Xavfsiz savdo' },
    { icon: BadgeCheck, label: 'Tasdiqlangan sotuvchilar' },
    { icon: MapPin, label: '14 viloyat' },
  ];

  return (
    <section className="relative">
      {/* Gradient fon + nozik naqsh */}
      <div className="hero-band absolute inset-0" />
      <div className="hero-pattern absolute inset-0 opacity-70" />

      {/* Kontent */}
      <div className="relative px-5 pt-8 pb-10 md:pt-12 md:pb-14 flex flex-col items-center text-center">
        {/* Ishonch belgisi */}
        <span className="trust-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white/90 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          O'zbekistonning chorvachilik platformasi
        </span>

        {/* Katta sarlavha */}
        <h1 className="text-[26px] leading-[1.15] sm:text-3xl md:text-[40px] md:leading-[1.1] font-extrabold text-white tracking-tight max-w-2xl">
          O'zbekistonning eng{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
            ishonchli
          </span>{' '}
          chorva bozori
        </h1>

        {/* Tavsif */}
        <p className="mt-3 text-[13px] md:text-sm text-white/70 leading-relaxed max-w-md">
          Hayvon, yem-hashak va jihozlar — tasdiqlangan sotuvchilardan, bevosita o'zingizga.
        </p>

        {/* Qidiruv paneli */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.currentTarget.querySelector('input')?.blur();
          }}
          className="mt-6 w-full max-w-xl"
        >
          <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 pl-4 shadow-[0_18px_40px_-12px_rgba(5,46,22,0.5)] ring-1 ring-black/5">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masalan: Golshtin sigir, beda, inkubator..."
              className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none py-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 shrink-0"
                aria-label="Tozalash"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold rounded-xl px-4 md:px-5 py-2.5 transition-colors active:scale-[0.97]"
            >
              <Search size={16} className="md:hidden" />
              <span className="hidden md:inline">Qidirish</span>
            </button>
          </div>
        </form>

        {/* Ishonch statistikasi */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {typeof total === 'number' && total > 0 && (
            <span className="trust-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-white/85">
              <BadgeCheck size={13} className="text-emerald-300" />
              {total.toLocaleString('ru-RU')}+ faol e'lon
            </span>
          )}
          {stats.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="trust-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-white/85"
            >
              <Icon size={13} className="text-emerald-300" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Sahifa foniga silliq o'tish + observer sentineli */}
      <div className="hero-fade h-6 relative" />
      <div ref={sentinelRef} className="absolute bottom-0 h-px w-full" aria-hidden="true" />
    </section>
  );
}
