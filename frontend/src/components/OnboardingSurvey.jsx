import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, PartyPopper, Sparkles } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { SURVEY_ROLES, SURVEY_INTERESTS, SURVEY_SOURCES } from '../constants/survey';

const QUESTIONS = [
  {
    key: 'role',
    title: 'Chorvabozor platformasidan qanday maqsadda foydalanmoqchisiz?',
    options: SURVEY_ROLES,
    multi: false,
  },
  {
    key: 'interests',
    title: 'Sizni asosan qaysi turdagi chorva qiziqtiradi?',
    hint: "Bir nechtasini tanlashingiz mumkin",
    options: SURVEY_INTERESTS,
    multi: true,
  },
  {
    key: 'source',
    title: "Loyihamiz haqida ilk bor qayerdan eshitdingiz?",
    options: SURVEY_SOURCES,
    multi: false,
  },
];

// Qadamlar orasidagi silliq surilish (dir: 1 — oldinga, -1 — orqaga)
const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir * 48, filter: 'blur(5px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir) => ({ opacity: 0, x: dir * -48, filter: 'blur(5px)' }),
};

/** Bitta variant kartochkasi (bir yoki ko'p tanlovli) */
function OptionCard({ option, selected, multi, index, onClick }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.055, duration: 0.32 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
        selected
          ? 'bg-brand-green/10 border-brand-green/50 shadow-lg shadow-brand-green/10'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center transition-colors duration-200 ${
          selected
            ? 'bg-brand-green border-brand-green text-white'
            : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}
      >
        <option.icon size={20} />
      </span>

      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-semibold leading-snug ${selected ? 'text-brand' : 'text-slate-700'}`}>
          {option.label}
        </span>
        {option.sub && <span className="block text-[11px] text-slate-500 mt-0.5">{option.sub}</span>}
      </span>

      <span
        className={`w-[22px] h-[22px] shrink-0 border-2 flex items-center justify-center transition-colors duration-200 ${
          multi ? 'rounded-md' : 'rounded-full'
        } ${selected ? 'bg-brand-green border-brand-green' : 'border-slate-300'}`}
      >
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 400 }}
              className="text-white flex"
            >
              <Check size={13} strokeWidth={3.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

/**
 * Onboarding so'rovnomasi — ro'yxatdan o'tishdan oldin 3 ta qisqa savol.
 * Qadamlar: 0 — salomlashish (mobilda intro video bilan), 1-3 — savollar, 4 — rahmat ekrani.
 * Yakunda onComplete({ role, interests, source }) chaqiriladi.
 */
export default function OnboardingSurvey({ onComplete }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState({ role: null, interests: [], source: null });
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const goTo = (next) => {
    clearTimeout(advanceTimer.current);
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  // Bir tanlovli savol: tanlov belgilanadi, so'ng avtomatik keyingi qadamga o'tiladi
  const pickSingle = (key, id) => {
    setAnswers((a) => ({ ...a, [key]: id }));
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      setDir(1);
      setStep((s) => Math.min(s + 1, 4));
    }, 400);
  };

  const toggleInterest = (id) =>
    setAnswers((a) => ({
      ...a,
      interests: a.interests.includes(id)
        ? a.interests.filter((x) => x !== id)
        : [...a.interests, id],
    }));

  const question = step >= 1 && step <= 3 ? QUESTIONS[step - 1] : null;
  const interestCount = answers.interests.length;

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-brand-bg">
      {/* Orqa fon bezagi */}
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-brand-sky/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col h-full w-full max-w-md mx-auto">
        {/* ── Yuqori panel: orqaga tugmasi + jarayon chizig'i ── */}
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-5 pt-5 shrink-0"
          >
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              aria-label="Orqaga"
              className="w-9 h-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand hover:border-slate-300 transition-colors active:scale-95"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: step >= i ? '100%' : '0%' }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand"
                  />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">
              {Math.min(step, 3)}/3
            </span>
          </motion.div>
        )}

        {/* ── Qadamlar ── */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.25, 0.8, 0.25, 1] }}
              className="h-full flex flex-col"
            >
              {/* ── 0: Salomlashish ── */}
              {step === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-7 overflow-y-auto scrollbar-hide py-8">
                  {/* Mobilda: intro video (oq fonli versiya) — multiply sahifa foniga singdiradi,
                      radial parda esa chekkadagi soya/vinyetkalarni eritib yuboradi */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="md:hidden relative w-full max-w-[320px] mb-4"
                  >
                    <video
                      src="/intro-white.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ mixBlendMode: 'multiply' }}
                      className="w-full"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_55%,_#F8FAFC_95%)]"
                    />
                  </motion.div>

                  {/* md+ da: katta logotip */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 14, delay: 0.1 }}
                    className="hidden md:block"
                  >
                    <BrandLogo variant="lg" />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.45 }}
                    className="text-2xl font-extrabold text-brand mt-4 tracking-tight"
                  >
                    Assalomu alaykum! 👋
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38, duration: 0.45 }}
                    className="text-lg font-bold bg-gradient-to-r from-brand-green to-brand-sky bg-clip-text text-transparent mt-1"
                  >
                    Chorvabozor platformasiga xush kelibsiz
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.45 }}
                    className="text-xs text-slate-500 mt-4 leading-relaxed max-w-xs"
                  >
                    Xizmatimizni aynan sizga moslashtirishimiz uchun atigi{' '}
                    <span className="text-brand-green-dark font-semibold">3 ta qisqa savolga</span> javob
                    bersangiz kifoya — bu 30 soniyadan kam vaqt oladi.
                  </motion.p>

                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.62, duration: 0.45 }}
                    onClick={() => goTo(1)}
                    className="mt-8 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-green to-brand text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-green/25 transition-transform active:scale-[0.97]"
                  >
                    Boshlash <ArrowRight size={16} />
                  </motion.button>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85, duration: 0.5 }}
                    className="text-[10px] text-slate-400 mt-5 flex items-center gap-1.5"
                  >
                    <Sparkles size={11} className="text-brand-green/70" />
                    Javoblaringiz faqat xizmatni yaxshilash uchun ishlatiladi
                  </motion.p>
                </div>
              )}

              {/* ── 1-3: Savollar ── */}
              {question && (
                <>
                  {/* Markazlashgan logotip */}
                  <div className="flex justify-center pt-4 shrink-0">
                    <BrandLogo />
                  </div>

                  <div className="px-5 pt-4 pb-4 shrink-0">
                    <h2 className="text-lg font-extrabold text-brand leading-snug tracking-tight">
                      {question.title}
                    </h2>
                    {question.hint && (
                      <p className="text-[11px] text-brand-green-dark font-medium mt-1.5">
                        {question.hint}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-hide px-5 space-y-2.5 pb-4">
                    {question.options.map((opt, i) => (
                      <OptionCard
                        key={opt.id}
                        option={opt}
                        index={i}
                        multi={question.multi}
                        selected={
                          question.multi
                            ? answers.interests.includes(opt.id)
                            : answers[question.key] === opt.id
                        }
                        onClick={() =>
                          question.multi
                            ? toggleInterest(opt.id)
                            : pickSingle(question.key, opt.id)
                        }
                      />
                    ))}
                  </div>

                  {/* Ko'p tanlovli savolda "Davom etish" tugmasi */}
                  {question.multi && (
                    <div className="px-5 pb-6 pt-2 shrink-0">
                      <button
                        type="button"
                        disabled={interestCount === 0}
                        onClick={() => goTo(step + 1)}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-green to-brand disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-brand-green/20"
                      >
                        {interestCount > 0 ? `Davom etish (${interestCount})` : 'Davom etish'}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── 4: Rahmat ekrani ── */}
              {step === 4 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-7 overflow-y-auto scrollbar-hide py-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 11, stiffness: 160, delay: 0.05 }}
                    className="w-20 h-20 rounded-full bg-brand-green/10 border border-brand-green/40 flex items-center justify-center text-brand-green"
                  >
                    <PartyPopper size={34} />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.45 }}
                    className="text-2xl font-extrabold text-brand mt-6 tracking-tight"
                  >
                    Katta rahmat! 🎉
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.45 }}
                    className="text-xs text-slate-500 mt-3 leading-relaxed max-w-xs"
                  >
                    Javoblaringiz biz uchun juda qadrli. Endi ro'yxatdan o'tib, Chorvabozor'ning barcha
                    imkoniyatlaridan bemalol foydalanishingiz mumkin.
                  </motion.p>

                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.45 }}
                    onClick={() => onComplete(answers)}
                    className="mt-8 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-green to-brand text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-green/25 transition-transform active:scale-[0.97]"
                  >
                    Ro'yxatdan o'tish <ArrowRight size={16} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
