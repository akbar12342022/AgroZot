import { useEffect, useState } from 'react';

/**
 * Chorvabozor brend lockup — chapda belgi (public/assets/logo-clean.png) toza oq
 * plitka ustida (to'q fonda ham yaqqol ko'rinadi), o'ngda "Chorvabozor" nomi.
 * (Ilgari nom tagida "ZAMONAVIY SAVDO" shiori bor edi — brendni soddalashtirish
 * uchun olib tashlandi.)
 * variant: 'md' — navbar va ixcham joylar | 'lg' — auth/onboarding katta ko'rinish.
 * iconOnly — faqat belgi (yonida o'z sarlavhasi bor ekranlar uchun).
 * Lockup mount'dan keyin fade-in bo'ladi — rasm dekodlanguncha "yalt" etmasligi uchun.
 */
export default function BrandLogo({ variant = 'md', iconOnly = false, className = '' }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Birinchi kadr opacity 0 bilan chizilib, keyin silliq fade-in bo'ladi
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const lg = variant === 'lg';

  return (
    <div
      className={`flex items-center ${lg ? 'gap-3.5' : 'gap-2.5'} select-none ${className}`}
      style={{ opacity: isMounted ? 1 : 0, transition: 'opacity 300ms ease' }}
    >
      {/* Belgi toza oq plitka ustida — to'q fonda ham logo yaqqol ko'rinadi.
          bg-[#FFFFFF] tungi rejimda ham oq qoladi (.bg-white qayta bo'yaladi, bu esa yo'q). */}
      <span
        className={`${
          lg ? 'w-16 h-16 rounded-2xl' : 'w-10 h-10 rounded-xl'
        } bg-[#FFFFFF] ring-1 ring-black/[0.07] shadow-sm flex items-center justify-center shrink-0`}
      >
        <img
          src="/assets/logo-clean.png"
          alt="Chorvabozor"
          draggable={false}
          className={`${lg ? 'w-[52px] h-[52px]' : 'w-8 h-8'} object-contain`}
        />
      </span>

      {!iconOnly && (
        <div className="flex flex-col min-w-0">
          <span
            className={`${lg ? 'text-4xl' : 'text-xl'} font-extrabold leading-none tracking-tight text-brand`}
          >
            Chorvabozor
          </span>
        </div>
      )}
    </div>
  );
}
