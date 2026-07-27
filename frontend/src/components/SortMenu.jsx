import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Check } from 'lucide-react';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Eng yangilari' },
  { id: 'cheapest', label: 'Avval arzoni' },
  { id: 'expensive', label: 'Avval qimmati' },
  { id: 'views', label: "Ko'p ko'rilgan" },
];

/** "Saralash" tugmasi va ochiladigan menyu */
export default function SortMenu({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = SORT_OPTIONS.find((o) => o.id === selected) || SORT_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-[11px] transition-colors ${
          selected !== 'newest' ? 'text-brand-green-dark' : 'text-slate-500 hover:text-slate-400'
        }`}
      >
        <SlidersHorizontal size={12} /> {current.label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-full right-0 mt-1.5 w-44 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 dropdown-menu overflow-hidden py-1"
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onSelect(opt.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  selected === opt.id
                    ? 'bg-brand-green/10 text-brand-green-dark font-medium'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {opt.label}
                {selected === opt.id && <Check size={13} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
