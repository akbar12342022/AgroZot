import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAI } from './AIContext';
import { aiSrc } from './aiAssets';

/**
 * Yaltirab (glow) turuvchi suzuvchi "Chorva AI" tugmasi.
 * Pastki navigatsiya ustida, o'ng tomonda. Bosilганда chat ochiladi.
 */
export default function AILauncher() {
  const { openChat, chatOpen, paywallOpen, isSubscribed, freeLeft } = useAI();
  if (chatOpen || paywallOpen) return null;

  return (
    <motion.div
      className="fixed right-4 z-[120] flex items-center gap-2"
      style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))' }}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 16, stiffness: 240, delay: 0.4 }}
    >
      {/* Nomli chip */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="ai-glass rounded-full pl-3 pr-3.5 py-1.5 flex items-center gap-1.5 shadow-lg"
      >
        <Sparkles size={13} className="text-brand-green-dark" />
        <span className="text-[12px] font-bold text-slate-700 dark:text-white whitespace-nowrap">Chorva AI</span>
      </motion.div>

      {/* Asosiy tugma — glow + pulse */}
      <button
        onClick={openChat}
        aria-label="Chorva AI'ni ochish"
        className="ai-glow-ring relative rounded-full shadow-[0_10px_30px_-6px_rgba(22,163,74,0.6)] active:scale-95 transition-transform"
        style={{ width: 60, height: 60 }}
      >
        {/* Pulslanuvchi halqa */}
        <span className="ai-pulse-ring absolute inset-0 rounded-full bg-brand-green/40 z-0" />

        {/* Personaj avatari */}
        <span className="relative z-10 block w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-brand-green to-brand-green-dark ring-2 ring-white/70 dark:ring-white/20">
          <img
            src={aiSrc('idle')}
            alt="Chorva AI"
            draggable={false}
            className="absolute left-1/2 -translate-x-1/2 select-none"
            style={{ top: '9%', height: '150%', maxWidth: 'none' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </span>

        {/* Sparkle belgisi */}
        <span className="absolute -top-0.5 -right-0.5 z-20 w-5 h-5 rounded-full bg-white dark:bg-slate-800 shadow flex items-center justify-center">
          <Sparkles size={11} className="text-brand-green-dark" />
        </span>

        {/* Qolgan bepul so'rovlar / Premium nuqtasi */}
        {!isSubscribed && freeLeft > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 z-20 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-sky text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-800">
            {freeLeft}
          </span>
        )}
      </button>
    </motion.div>
  );
}
