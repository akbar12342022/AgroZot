import { motion } from 'framer-motion';
import { Sparkles, Zap, Crown, Check, X, Send } from 'lucide-react';

const CONTACT_FALLBACK = 'https://t.me/afaridshop';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    tagline: 'Kundalik savollar uchun',
    features: [
      'Cheksiz matnli suhbat',
      'Kuniga 5 ta rasm tahlili',
      'Vazn va narxni baholash',
      'Bozor narxlari asosida javoblar',
    ],
    accent: {
      ring: 'border-brand-green/40 hover:border-brand-green/60',
      iconBox: 'bg-brand-green/10 border-brand-green/40 text-brand-green-dark',
      check: 'text-brand-green-dark',
      glow: 'from-brand-green/[0.07]',
      button: 'from-brand-green to-brand shadow-brand-green/20',
    },
  },
  {
    id: 'plus',
    name: 'Plus',
    icon: Crown,
    tagline: 'Professional chorvadorlar uchun',
    badge: 'ENG YAXSHI TAKLIF',
    features: [
      'Cheksiz matnli suhbat',
      'Cheksiz rasm tahlili',
      'Vazn va narxni baholash',
      'Barcha Pro imkoniyatlari',
    ],
    accent: {
      ring: 'border-amber-300 hover:border-amber-400/70',
      iconBox: 'bg-amber-50 border-amber-300 text-amber-600',
      check: 'text-amber-600',
      glow: 'from-amber-500/[0.08]',
      button: 'from-amber-500 to-orange-600 shadow-amber-500/25',
    },
  },
];

/**
 * AI tariflar oynasi — tarifi yo'q foydalanuvchi AI bo'limini ochganda ko'rsatiladi.
 * Ikkita karta (Pro / Plus) va har birida admin bilan bog'lanish tugmasi.
 */
export default function PricingModal({ contact, onClose }) {
  const link = contact || CONTACT_FALLBACK;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4"
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:max-w-3xl max-h-[92dvh] overflow-y-auto scrollbar-hide bg-white border border-slate-200 rounded-t-3xl md:rounded-3xl shadow-2xl shadow-black/60"
      >
        {/* Bezak nurlari */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-amber-50 blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-brand transition-colors"
        >
          <X size={17} />
        </button>

        {/* Sarlavha */}
        <div className="relative flex flex-col items-center text-center px-6 pt-9 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green to-brand flex items-center justify-center text-white shadow-lg shadow-brand-green/20 mb-4">
            <Sparkles size={26} />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-brand tracking-tight">
            AgroZot AI tariflari
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
            AI yordamchi — veterinariya maslahatlari, hayvon rasmidan vazn va bozor narxini
            baholash. Foydalanish uchun tarifni tanlang.
          </p>
        </div>

        {/* Tarif kartalari */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:px-8 md:pb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-gradient-to-b ${plan.accent.glow} to-transparent bg-white p-5 md:p-6 transition-colors ${plan.accent.ring}`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] font-extrabold tracking-widest shadow-lg shadow-amber-500/30 whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${plan.accent.iconBox}`}>
                  <plan.icon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-brand leading-tight">{plan.name}</h3>
                  <p className="text-[11px] text-slate-500">{plan.tagline}</p>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <Check size={15} className={`shrink-0 mt-0.5 ${plan.accent.check}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${plan.accent.button} text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] hover:brightness-110`}
              >
                <Send size={15} />
                Sotib olish uchun Admin bilan bog'laning
              </a>
            </div>
          ))}
        </div>

        <p className="relative text-center text-[11px] text-slate-400 pb-6 px-6">
          Tarif ulangach, AI yordamchi hisobingizda darhol ochiladi.
        </p>
      </motion.div>
    </motion.div>
  );
}
