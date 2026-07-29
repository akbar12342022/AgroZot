import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown } from 'lucide-react';
import { REGIONS } from '../constants/data';

/** Region Dropdown Component */
export default function RegionDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Hududni tanlash"
        className={`flex items-center gap-1.5 h-10 px-3 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg text-sm font-medium text-slate-600 dark:text-gray-200 transition-colors whitespace-nowrap active:scale-95 ${
          open
            ? 'border-brand-green/50'
            : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
        }`}
      >
        <MapPin size={15} className="text-brand-green shrink-0" />
        <span className="hidden sm:inline max-w-[110px] truncate">{selected}</span>
        <ChevronDown
          size={14}
          className={`text-slate-500 dark:text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-full right-0 mt-1.5 w-48 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl shadow-2xl z-50 dropdown-menu overflow-hidden"
          >
            <div className="max-h-52 overflow-y-auto scrollbar-hide py-1">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => { onSelect(r); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    selected === r
                      ? 'bg-brand-green/10 text-brand-green-dark font-semibold'
                      : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
