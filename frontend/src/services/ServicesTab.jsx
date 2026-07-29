import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, MapPin, Sparkles, SearchX, BadgeCheck } from 'lucide-react';
import {
  SERVICE_TYPES,
  SERVICE_TYPE_MAP,
  providerMetric,
  providerPriceLine,
} from './servicesData';

/** Bitta provayder kartochkasi */
function ProviderCard({ p, index }) {
  const cfg = SERVICE_TYPE_MAP[p.type];
  const metric = providerMetric(p);
  const priceLine = providerPriceLine(p);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.3 }}
      className="surface-card p-4"
    >
      <div className="flex items-start gap-3">
        {/* Avatar — xizmat turiga mos gradient, ism bosh harfi */}
        <div className="relative shrink-0">
          {p.photo ? (
            <img src={p.photo} alt="" className="w-12 h-12 rounded-2xl object-cover" />
          ) : (
            <span
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.avatar} flex items-center justify-center text-white text-lg font-extrabold`}
            >
              {p.name.charAt(0)}
            </span>
          )}
          <span className="absolute -bottom-1.5 -right-1.5 text-[13px] leading-none bg-white rounded-full border border-slate-200 w-6 h-6 flex items-center justify-center shadow-sm">
            {cfg.emoji}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-[14px] font-bold text-brand truncate">{p.name}</h4>
            <BadgeCheck size={14} className="text-brand-sky shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
              <MapPin size={10} className="shrink-0" />
              {p.region} • {p.district}
            </span>
          </div>

          {/* Asosiy ko'rsatkich: masalan "Isuzu | 5 tonna" */}
          <p className="mt-2 text-[12.5px] font-semibold text-brand-green-dark bg-brand-green/[0.07] border border-brand-green/15 rounded-lg px-2.5 py-1.5 inline-block">
            {metric}
          </p>

          {priceLine && (
            <p className="text-[11.5px] font-semibold text-slate-600 mt-1.5">{priceLine}</p>
          )}
          {p.note && (
            <p className="text-[11.5px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{p.note}</p>
          )}
        </div>
      </div>

      {/* Qo'ng'iroq qilish */}
      <a
        href={`tel:${p.phone}`}
        className="mt-3.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-green to-brand text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-green/20 active:scale-[0.98] transition-transform"
      >
        <Phone size={14} /> Qo'ng'iroq qilish
      </a>
    </motion.div>
  );
}

/**
 * "Xizmatlar" ochiq sahifasi — qassoblar, haydovchilar va ozuqa sotuvchilari ro'yxati.
 * Bosh sahifadagi "Xizmatlar" kategoriyasidan ochiladi.
 */
export default function ServicesTab({ providers, onBack, onBecomeProvider }) {
  const [filter, setFilter] = useState('all');

  const list = useMemo(
    () => (filter === 'all' ? providers : providers.filter((p) => p.type === filter)),
    [providers, filter]
  );

  return (
    <div className="min-h-full flex flex-col">
      {/* Sarlavha — orqaga + nom */}
      <div className="glass-header sticky top-0 z-20 border-b border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={onBack}
            aria-label="Orqaga"
            className="w-9 h-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand transition-colors active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-brand leading-tight">Xizmatlar</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {list.length} ta xizmat ko'rsatuvchi topildi
            </p>
          </div>
        </div>

        {/* Tur bo'yicha filtr chiplari */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
              filter === 'all'
                ? 'bg-brand-green border-brand-green text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-brand-green/40'
            }`}
          >
            Barchasi
          </button>
          {SERVICE_TYPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors flex items-center gap-1.5 ${
                filter === s.id
                  ? 'bg-brand-green border-brand-green text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-brand-green/40'
              }`}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ro'yxat */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {list.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16 px-8">
            <span className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <SearchX size={26} />
            </span>
            <h3 className="text-sm font-bold text-brand">Bu turdagi xizmatlar hali yo'q</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Birinchi bo'lib ro'yxatdan o'ting va mijozlaringizni shu yerda toping!
            </p>
          </div>
        ) : (
          list.map((p, i) => <ProviderCard key={p.id} p={p} index={i} />)
        )}

        {/* Pastki CTA — o'zi ham provayder bo'lish */}
        <button
          onClick={onBecomeProvider}
          className="w-full mt-2 rounded-2xl border-2 border-dashed border-brand-green/40 bg-brand-green/[0.05] hover:bg-brand-green/[0.09] p-4 flex items-center gap-3 text-left transition-colors"
        >
          <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-green/15 flex items-center justify-center text-brand-green-dark">
            <Sparkles size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-[13px] font-bold text-brand">
              Siz ham xizmat ko'rsatasizmi?
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Ro'yxatdan o'ting — mijozlar sizni shu yerdan topadi
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
