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
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-400 hover:border-slate-300 transition-colors whitespace-nowrap"
      >
        <MapPin size={13} className="text-brand-green" />
        <span className="max-w-[90px] truncate">{selected}</span>
        <ChevronDown size={13} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 dropdown-menu overflow-hidden"
          >
            <div className="max-h-52 overflow-y-auto scrollbar-hide py-1">
              {REGIONS.map(r => (
                <button 
                  key={r} 
                  onClick={() => { onSelect(r); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    selected === r 
                      ? 'bg-brand-green/10 text-brand-green-dark font-medium' 
                      : 'text-slate-400 hover:bg-slate-50'
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
