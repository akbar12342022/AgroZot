import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { sendSmsCode, confirmSmsAndRegister, resetRecaptcha } from '../api/auth';

/** Telefon raqamni yozish paytida formatlash: +998 90 123 45 67 */
function formatPhoneInput(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  let out = '+998';
  if (digits.length > 0) out += ' ' + digits.slice(0, 2);
  if (digits.length > 2) out += ' ' + digits.slice(2, 5);
  if (digits.length > 5) out += ' ' + digits.slice(5, 7);
  if (digits.length > 7) out += ' ' + digits.slice(7, 9);
  return out;
}

const RESEND_SECONDS = 60;

/**
 * Ro'yxatdan o'tish ekrani — Firebase Phone Auth bilan ikki qadam:
 * 1) ism + telefon → SMS kod yuboriladi; 2) 6 xonali kod → tasdiq → backendga kirish.
 * survey — onboarding so'rovnomasi javoblari, backendga birga yuboriladi.
 */
export default function RegisterScreen({ onSuccess, survey }) {
  const [step, setStep] = useState('form'); // 'form' | 'code'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const phoneDigits = phone.replace(/\D/g, '');
  const isValid = name.trim().length >= 2 && phoneDigits.length === 12;
  const phoneE164 = `+${phoneDigits}`;

  // Qayta yuborish tugmasi uchun sekundomer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Ekrandan chiqishda reCAPTCHA ni tozalash
  useEffect(() => () => resetRecaptcha(), []);

  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const conf = await sendSmsCode(phoneE164);
      setConfirmation(conf);
      setCode('');
      setStep('code');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "SMS yuborib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const conf = await sendSmsCode(phoneE164);
      setConfirmation(conf);
      setCode('');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err.message || "SMS yuborib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e?.preventDefault();
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const user = await confirmSmsAndRegister(confirmation, code, name.trim(), survey);
      onSuccess(user);
    } catch (err) {
      console.error("Ro'yxatdan o'tish xatosi:", err);
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const backToForm = () => {
    setStep('form');
    setCode('');
    setConfirmation(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 relative overflow-hidden">
      {/* Orqa fon bezagi */}
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-brand-sky/10 blur-3xl pointer-events-none" />

      {/* Firebase ko'rinmas reCAPTCHA shu yerga bog'lanadi — doim DOMda turishi kerak */}
      <div id="recaptcha-container" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          {/* Markazlashgan logotip */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, delay: 0.15 }}
          >
            <BrandLogo variant="lg" />
          </motion.div>
          <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
            {step === 'form' ? (
              <>
                O'zbekiston chorvachilik bozori.
                <br />
                Davom etish uchun ro'yxatdan o'ting.
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-600">{phone}</span> raqamiga SMS kod
                yubordik.
                <br />
                6 xonali kodni kiriting.
              </>
            )}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === 'form' ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSendCode}
              className="space-y-3.5"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Ismingiz
                </label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 focus-within:border-brand-green transition-colors">
                  <User size={16} className="text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sardor"
                    maxLength={60}
                    autoFocus
                    className="flex-1 bg-transparent py-3.5 text-sm text-brand placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Telefon raqamingiz
                </label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 focus-within:border-brand-green transition-colors">
                  <Phone size={16} className="text-slate-500 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    onFocus={() => !phone && setPhone('+998 ')}
                    placeholder="+998 90 123 45 67"
                    className="flex-1 bg-transparent py-3.5 text-sm text-brand placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-green to-brand disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-brand-green/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Kod yuborilmoqda...
                  </>
                ) : (
                  <>
                    SMS kod olish <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="code"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleConfirm}
              className="space-y-3.5"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Tasdiqlash kodi
                </label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 focus-within:border-brand-green transition-colors">
                  <ShieldCheck size={16} className="text-slate-500 shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    autoFocus
                    className="flex-1 bg-transparent py-3.5 text-base font-bold tracking-[0.5em] text-brand placeholder:text-slate-300 placeholder:tracking-[0.5em] focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={code.length !== 6 || loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-green to-brand disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-brand-green/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Tekshirilmoqda...
                  </>
                ) : (
                  <>
                    Tasdiqlash va kirish <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={backToForm}
                  className="flex items-center gap-1 text-slate-500 hover:text-brand transition-colors"
                >
                  <ArrowLeft size={13} /> Raqamni o'zgartirish
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendIn > 0 || loading}
                  className="text-brand-green-dark font-semibold disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resendIn > 0 ? `Qayta yuborish (${resendIn}s)` : 'Kodni qayta yuborish'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed">
          Raqamingiz faqat xaridorlar siz bilan bog'lanishi uchun ishlatiladi.
          <br />
          Avval ro'yxatdan o'tgan bo'lsangiz, shu raqam bilan hisobingizga kirasiz.
        </p>
      </motion.div>
    </div>
  );
}
