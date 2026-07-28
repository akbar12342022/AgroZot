import { motion, AnimatePresence } from 'framer-motion';
import { aiSrc } from './aiAssets';

// Rasm nisbati (chroma-key'dan keyin): 507 x 1000
const RATIO = 0.507;

/**
 * Chorva AI personaji.
 * - Crossfade: mood o'zgarganda rasm silliq almashadi (opacity 0→1, scale 0.95→1).
 * - Breathing: doimiy, juda silliq y-o'q bo'ylab nafas olish (xuddi tirikdek).
 * props: mood, height (px), glow, shadow, className
 */
export default function AIPersona({ mood = 'idle', height = 200, glow = false, shadow = true, className = '' }) {
  const width = Math.round(height * RATIO);
  const slow = mood === 'sad'; // empatiya bilan sekinroq o'tish

  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ width }}>
      {glow && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: width * 1.8,
            height: height * 0.9,
            background: 'radial-gradient(circle, rgba(52,211,153,0.35) 0%, rgba(22,163,74,0.12) 40%, transparent 70%)',
            filter: 'blur(14px)',
          }}
        />
      )}

      <motion.div
        className="relative"
        style={{ width, height }}
        animate={{ y: [0, -3.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={mood}
            src={aiSrc(mood)}
            alt="Chorva AI"
            draggable={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: slow ? 0.9 : 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 w-full h-full object-contain object-bottom ai-persona-fade select-none"
            onError={(e) => {
              e.currentTarget.style.opacity = 0;
            }}
          />
        </AnimatePresence>
      </motion.div>

      {shadow && (
        <div
          className="ai-shadow rounded-[50%] -mt-2 pointer-events-none"
          style={{ width: width * 0.78, height: Math.max(10, height * 0.05) }}
        />
      )}
    </div>
  );
}
