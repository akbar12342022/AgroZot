import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, ArrowRight, Loader2 } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { register } from '../api/auth';

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

/**
 * Saytga birinchi kirishda ism va telefon bilan ro'yxatdan o'tish ekrani.
 * survey — onboarding so'rovnomasi javoblari ({role, interests, source}), backendga birga yuboriladi.
 */
export default function RegisterScreen({ onSuccess, survey }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const phoneDigits = phone.replace(/\D/g, '');
  const isValid = name.trim().length >= 2 && phoneDigits.length === 12;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const user = await register(name.trim(), phone, survey);
      onSuccess(user);
    } catch (err) {
      console.error("Ro'yxatdan o'tish xatosi:", err);
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 relative overflow-hidden">
      {/* Orqa fon bezagi */}
      <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full bg-brand-sky/10 blur-3xl pointer-events-none" />

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
            O'zbekiston chorvachilik bozori.
            <br />
            Davom etish uchun ro'yxatdan o'ting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                <Loader2 size={16} className="animate-spin" /> Kirilmoqda...
              </>
            ) : (
              <>
                Boshlash <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed">
          Raqamingiz faqat xaridorlar siz bilan bog'lanishi uchun ishlatiladi.
          <br />
          Avval ro'yxatdan o'tgan bo'lsangiz, shu raqam bilan hisobingizga kirasiz.
        </p>
      </motion.div>
    </div>
  );
}
