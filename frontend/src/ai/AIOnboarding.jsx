import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShoppingBag, Store } from 'lucide-react';
import { useAI } from './AIContext';
import AIPersona from './AIPersona';

/**
 * Chorva AI onboarding — saytga birinchi kirishda bir marta ko'rinadi.
 * hello (salom) → talking (savol: Xaridor/Sotuvchi) → success ("Ajoyib!") → silliq yo'qoladi.
 * enabled: faqat foydalanuvchi ilovaga kirgach (splashdan keyin) true bo'ladi.
 */
export default function AIOnboarding({ enabled }) {
  const { onboarded, completeOnboarding } = useAI();
  const [step, setStep] = useState(0); // 0 hello, 1 question, 2 success
  const [leaving, setLeaving] = useState(false);

  const visible = enabled && !onboarded && !leaving;
  const mood = step === 0 ? 'hello' : step === 1 ? 'talking' : 'success';

  const choose = (type) => {
    setStep(2);
    setTimeout(() => setLeaving(true), 1700); // "Ajoyib!" ko'rinib turadi, so'ng yo'qoladi
    setTimeout(() => completeOnboarding(type), 2050);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ai-backdrop fixed inset-0 z-[320] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ y: 90, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', damping: 22, stiffness: 240 }}
            className="ai-glass relative w-full max-w-sm rounded-[32px] px-6 pt-7 pb-7 text-center"
          >
            <div className="flex justify-center">
              <AIPersona mood={mood} height={185} glow />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mt-4"
              >
                {step === 0 && (
                  <>
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-green/15 text-brand-green-dark text-[11px] font-bold mb-2.5">
                      ✨ Chorva AI
                    </span>
                    <h2 className="text-[20px] font-extrabold text-slate-800 dark:text-white leading-snug">
                      Assalomu alaykum!
                    </h2>
                    <p className="text-[13.5px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      Men <b className="text-brand-green-dark">Chorva AI</b>man — sizning shaxsiy yordamchingiz.
                      Chorva tanlash, narx va sog'liq bo'yicha maslahat beraman.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(1)}
                      className="w-full mt-5 py-3.5 rounded-2xl bg-gradient-to-r from-brand-green to-brand-green-dark text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-xl shadow-brand-green/30"
                    >
                      Davom etish <ArrowRight size={17} />
                    </motion.button>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h2 className="text-[19px] font-extrabold text-slate-800 dark:text-white leading-snug">
                      Ayting-chi, siz asosan nima qidirasiz?
                    </h2>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Shu asosda sizga mosini ko'rsataman.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 mt-4">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => choose('buyer')}
                        className="rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-brand-green hover:bg-brand-green/[0.06] p-4 flex flex-col items-center gap-2 transition-all"
                      >
                        <span className="w-11 h-11 rounded-xl bg-brand-green/15 flex items-center justify-center text-brand-green-dark">
                          <ShoppingBag size={20} />
                        </span>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Xaridorman</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => choose('seller')}
                        className="rounded-2xl border-2 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-brand-green hover:bg-brand-green/[0.06] p-4 flex flex-col items-center gap-2 transition-all"
                      >
                        <span className="w-11 h-11 rounded-xl bg-brand-sky/15 flex items-center justify-center text-brand-sky">
                          <Store size={20} />
                        </span>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Sotuvchiman</span>
                      </motion.button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-[22px] font-extrabold text-brand-green-dark leading-snug">Ajoyib! 🎉</h2>
                    <p className="text-[13.5px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      Endi sizga eng mos e'lonlar va maslahatlarni tayyorlab beraman.
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
