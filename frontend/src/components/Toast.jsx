import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 size={16} className="text-brand-green shrink-0" />,
  error: <AlertCircle size={16} className="text-red-500 shrink-0" />,
  info: <Info size={16} className="text-brand-sky shrink-0" />,
};

const BORDERS = {
  success: 'border-brand-green/30',
  error: 'border-red-200',
  info: 'border-brand-sky/30',
};

/** Ekran tepasida chiqadigan qisqa bildirishnoma */
export default function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 max-w-[90%] bg-white/95 backdrop-blur-md border ${BORDERS[toast.type] || BORDERS.info} rounded-xl px-3.5 py-2.5 shadow-2xl`}
        >
          {ICONS[toast.type] || ICONS.info}
          <span className="text-xs text-slate-700 leading-snug">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
