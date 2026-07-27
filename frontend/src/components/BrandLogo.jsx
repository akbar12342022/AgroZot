import { useEffect, useState } from 'react';

/**
 * AgroZot brend lockup — chapda shaffof belgi (public/assets/logo-clean.png),
 * o'ngda "AgroZot" sarlavhasi va "zamonaviy savdo" shiori.
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
      className={`flex items-center gap-3 select-none ${className}`}
      style={{ opacity: isMounted ? 1 : 0, transition: 'opacity 300ms ease' }}
    >
      <img
        src="/assets/logo-clean.png"
        alt="AgroZot"
        draggable={false}
        className={`${lg ? 'w-14 h-14' : 'w-12 h-12'} object-contain shrink-0`}
      />
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={`${lg ? 'text-3xl' : 'text-2xl'} font-extrabold leading-none tracking-tight text-brand`}>
            AgroZot
          </span>
          <span className={`${lg ? 'text-xs' : 'text-[10px]'} uppercase tracking-wider font-semibold text-brand-green mt-1`}>
            zamonaviy savdo
          </span>
        </div>
      )}
    </div>
  );
}
