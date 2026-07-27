import { useEffect } from 'react';
import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

/**
 * Saytga kirganda chiqadigan salomlashish animatsiyasi:
 * "Assalomu alaykum, {ism}!" — so'zlar ketma-ket paydo bo'ladi.
 */
export default function WelcomeSplash({ name, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 2600);
    return () => clearTimeout(timer);
  }, [onDone]);

  const words = ['Assalomu', 'alaykum,'];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45 }}
      className="absolute inset-0 z-[300] bg-brand-bg flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Yumshoq nur effekti */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute w-[400px] h-[400px] rounded-full bg-brand-green/10 blur-3xl"
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 120 }}
        className="relative"
      >
        <BrandLogo variant="lg" />
      </motion.div>

      <div className="relative mt-7 flex flex-wrap justify-center gap-x-2 px-8">
        {words.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.5 + i * 0.18, duration: 0.45 }}
            className="text-xl font-semibold text-slate-600"
          >
            {word}
          </motion.span>
        ))}
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 1.0, duration: 0.55, type: 'spring', damping: 14 }}
        className="relative text-3xl font-extrabold bg-gradient-to-r from-brand-green via-brand-green-dark to-brand bg-clip-text text-transparent mt-1.5 px-6 text-center"
      >
        {name}!
      </motion.h1>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="relative h-[2px] w-24 bg-gradient-to-r from-transparent via-brand-green/70 to-transparent mt-5 origin-center"
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.5 }}
        className="relative text-[11px] text-slate-500 mt-4 tracking-widest uppercase"
      >
        Chorva Bozori — zamonaviy savdo
      </motion.p>
    </motion.div>
  );
}
