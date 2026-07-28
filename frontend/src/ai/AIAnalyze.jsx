import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, ChevronDown } from 'lucide-react';
import { useAI } from './AIContext';
import AIPersona from './AIPersona';
import { buildAnalysis } from './aiReply';

const ICONS = { price: TrendingUp, plus: CheckCircle2, watch: AlertTriangle, tip: Lightbulb };
const ICON_TONE = {
  price: 'text-brand-green-dark bg-brand-green/12',
  plus: 'text-brand-green-dark bg-brand-green/12',
  watch: 'text-amber-600 bg-amber-500/12',
  tip: 'text-brand-sky bg-brand-sky/12',
};

/**
 * Kontekstual "AI orqali tahlil qilish" — DetailModal ichida narx tagida.
 * Bosilganda talking personaj + balandligi o'sib boradigan tahlil oynasi ochiladi.
 * Limit yo'q bo'lsa — sad personaj + Paywall.
 */
export default function AIAnalyze({ listing }) {
  const { consume, openPaywall } = useAI();
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sections, setSections] = useState(null);
  const [denied, setDenied] = useState(false);

  const run = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (!consume()) {
      setDenied(true);
      setSections(null);
      setAnalyzing(false);
      setOpen(true);
      setTimeout(() => openPaywall(), 1200);
      return;
    }
    setDenied(false);
    setSections(null);
    setAnalyzing(true);
    setOpen(true);
    setTimeout(() => {
      setSections(buildAnalysis(listing));
      setAnalyzing(false);
    }, 1500);
  };

  const mood = denied ? 'sad' : 'talking';

  return (
    <div className="mt-3.5">
      {/* Premium gradient tugma (yaltiroq) */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={run}
        className="relative w-full overflow-hidden rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-white font-bold text-sm shadow-lg shadow-brand-green/25"
        style={{ background: 'linear-gradient(110deg,#16a34a,#0f766e,#0284c7)' }}
      >
        <motion.span
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)' }}
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
        />
        <Sparkles size={16} className="relative" />
        <span className="relative">AI orqali tahlil qilish</span>
        <ChevronDown size={15} className={`relative transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl border border-brand-green/25 bg-brand-green/[0.05] p-4">
              {/* Sarlavha — kichik personaj */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="shrink-0">
                  <AIPersona mood={mood} height={72} shadow={false} />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-brand flex items-center gap-1">
                    Chorva AI tahlili <Sparkles size={12} className="text-brand-green-dark" />
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {denied ? 'Bepul limit tugadi' : analyzing ? 'Tahlil qilinmoqda...' : "Shu e'lon bo'yicha xulosa"}
                  </p>
                </div>
              </div>

              {denied ? (
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  Afsuski, bepul limitlaringiz tugadi 😔 To'liq tahlil uchun Chorva AI Premiumga o'ting.
                </p>
              ) : analyzing ? (
                <div className="flex gap-1 py-2 pl-1">
                  <span className="w-2 h-2 rounded-full bg-brand-green/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-green/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-green/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sections?.map((s, i) => {
                    const Icon = ICONS[s.icon] || Sparkles;
                    return (
                      <motion.div
                        key={s.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.12, duration: 0.35 }}
                        className="flex gap-2.5"
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ICON_TONE[s.icon] || ''}`}>
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold text-brand">{s.title}</p>
                          <p className="text-[12.5px] text-slate-600 leading-relaxed">{s.body}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <p className="text-[10px] text-slate-400 pt-1 flex items-center gap-1">
                    <Sparkles size={10} /> Chorva AI tomonidan — bu maslahat, aniq qaror uchun mutaxassisga murojaat qiling.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
