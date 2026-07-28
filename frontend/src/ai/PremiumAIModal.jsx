import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Crown, Zap, TrendingUp, Camera } from 'lucide-react';
import { useAI } from './AIContext';
import AIPersona from './AIPersona';

const FEATURES = [
  { icon: Zap, text: 'Cheksiz AI savollar' },
  { icon: Camera, text: 'Hayvon rasmidan vazn va narx tahlili' },
  { icon: TrendingUp, text: 'Bozor narxi bashorati' },
  { icon: Sparkles, text: 'Ustuvor, tezkor javoblar' },
];

const PLANS = [
  { id: 'monthly', name: 'Oylik', price: '29 000', per: "so'm / oy", note: '' },
  { id: 'yearly', name: 'Yillik', price: '249 000', per: "so'm / yil", note: '2 oy sovg\'a', best: true },
];

/** Obuna (Paywall) oynasi — glassmorphism, tariflar, "Obuna bo'lish". */
export default function PremiumAIModal() {
  const { paywallOpen, closePaywall, subscribe } = useAI();
  const [plan, setPlan] = useState('yearly');

  return (
    <AnimatePresence>
      {paywallOpen && (
        <motion.div
          className="ai-backdrop fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePaywall}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="ai-glass relative w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] overflow-hidden max-h-[92dvh] overflow-y-auto scrollbar-hide"
          >
            <button
              onClick={closePaywall}
              className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-slate-200 transition-colors"
              aria-label="Yopish"
            >
              <X size={17} />
            </button>

            {/* Personaj (empatiya) */}
            <div className="flex flex-col items-center pt-7 px-6">
              <AIPersona mood="sad" height={130} glow shadow={false} />
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                <Crown size={12} /> CHORVA AI PREMIUM
              </div>
              <h2 className="text-[19px] font-extrabold text-slate-800 dark:text-white mt-2.5 text-center leading-tight">
                Bepul limitingiz tugadi
              </h2>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-300 text-center mt-1.5 leading-relaxed max-w-[19rem]">
                Suhbatni cheksiz davom ettirish va rasm tahlili uchun Premiumga o'ting — chorva savdosida bir qadam oldinda bo'ling.
              </p>
            </div>

            {/* Imkoniyatlar */}
            <div className="px-6 mt-5 grid grid-cols-1 gap-2">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-brand-green/15 flex items-center justify-center text-brand-green-dark shrink-0">
                    <Icon size={14} />
                  </span>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{text}</span>
                  <Check size={15} className="ml-auto text-brand-green shrink-0" />
                </div>
              ))}
            </div>

            {/* Tariflar */}
            <div className="px-6 mt-5 grid grid-cols-2 gap-2.5">
              {PLANS.map((p) => {
                const active = plan === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`relative text-left rounded-2xl border-2 p-3.5 transition-all ${
                      active
                        ? 'border-brand-green bg-brand-green/[0.07] shadow-md shadow-brand-green/15'
                        : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5'
                    }`}
                  >
                    {p.best && (
                      <span className="absolute -top-2 right-2.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-brand-green to-brand-green-dark text-white text-[8.5px] font-extrabold tracking-wide">
                        ENG FOYDALI
                      </span>
                    )}
                    <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">{p.name}</p>
                    <p className="text-[19px] font-extrabold text-slate-800 dark:text-white leading-tight mt-0.5">
                      {p.price}
                    </p>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">{p.per}</p>
                    {p.note && <p className="text-[10.5px] font-bold text-brand-green-dark mt-1">{p.note}</p>}
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <div className="px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={subscribe}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-green to-brand-green-dark text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-xl shadow-brand-green/35"
              >
                <Sparkles size={17} /> Obuna bo'lish
              </motion.button>
              <button
                onClick={closePaywall}
                className="w-full mt-2 py-2 text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Hozircha kerak emas
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
