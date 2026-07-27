// Maxsus chorvachilik ikonkalari — lucide uslubida (stroke, 24x24).
// Lucide to'plamida sigir/qo'y/ot ikonkalari yo'qligi uchun qo'lda chizilgan.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Sigir boshi (qoramol) */
export function CowIcon({ size = 24, className = '' }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M4 5c-1.5 0-2.5-1-3-2 0 2.5 1 4 3 4.5" />
      <path d="M20 5c1.5 0 2.5-1 3-2 0 2.5-1 4-3 4.5" />
      <path d="M7 4.5C7.5 3 9.5 2 12 2s4.5 1 5 2.5c1 2.5.5 5-1 6.5H8c-1.5-1.5-2-4-1-6.5Z" />
      <path d="M8 11c-1.5.8-2.5 2.4-2.5 4.2 0 3.5 2.9 5.8 6.5 5.8s6.5-2.3 6.5-5.8c0-1.8-1-3.4-2.5-4.2" />
      <circle cx="9.5" cy="7" r="0.5" fill="currentColor" />
      <circle cx="14.5" cy="7" r="0.5" fill="currentColor" />
      <circle cx="9.5" cy="16.5" r="0.6" fill="currentColor" />
      <circle cx="14.5" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** Qo'y (yon ko'rinish, momiq tana) */
export function SheepIcon({ size = 24, className = '' }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M17.5 8.5c1.4 0 2.5-1.1 2.5-2.5S18.9 3.5 17.5 3.5c-.3 0-.7.1-1 .2C16 2.7 15 2 13.8 2c-.9 0-1.8.5-2.3 1.2" />
      <path d="M5 9.5C3.9 9.7 3 10.7 3 12c0 1 .6 1.9 1.5 2.3-.3.5-.5 1-.5 1.7 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1" />
      <path d="M6.8 9.8C6.9 7.7 8.7 6 11 6h3c2.5 0 4.5 2 4.5 4.5 0 .8-.2 1.5-.6 2.2.4.6.6 1.3.6 2 0 2.1-1.7 3.8-3.8 3.8H10c-1.9 0-3.4-1.5-3.4-3.4 0-.4.1-.8.2-1.2C6 13.4 5.6 12.5 5.6 11.5c0-.6.2-1.2.5-1.7" />
      <path d="M9 18.5V22" />
      <path d="M15 18.5V22" />
      <circle cx="17" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

/** Ot boshi (yon ko'rinish, yolli) */
export function HorseIcon({ size = 24, className = '' }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M14 3l1.5-1 .5 2.5" />
      <path d="M16 4.5c2.5 1 4 3.5 4 6.5v3c0 .8-.7 1.5-1.5 1.5S17 14.8 17 14v-1" />
      <path d="M16 4.5C13 3.5 9.5 4.5 7.5 7L4 11.5c-.6.8-.4 2 .4 2.6.7.5 1.7.4 2.3-.2L9 11.5" />
      <path d="M9 11.5c-.7 2-.5 4.5.5 6.5l1.5 4" />
      <path d="M17 13c-.5 3-2 5.5-4.5 7l-1.5 2" />
      <path d="M16 4.5c-.5 1.5-.3 3 .5 4.5" />
      <circle cx="16.5" cy="8" r="0.5" fill="currentColor" />
    </svg>
  );
}

/** Instagram belgisi (lucide to'plamidan olib tashlangani uchun qo'lda) */
export function InstagramIcon({ size = 24, className = '' }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/** YouTube belgisi (lucide to'plamidan olib tashlangani uchun qo'lda) */
export function YoutubeIcon({ size = 24, className = '' }) {
  return (
    <svg {...base} width={size} height={size} className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0 2 2 0 0 1-1.4-1.4Z" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

/**
 * Tasdiqlangan profil belgisi — Instagram uslubidagi ko'k muhr ichida oq galochka.
 * Ism yonida ishlatiladi: <VerifiedBadge size={14} />
 */
export function VerifiedBadge({ size = 14, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`inline-block shrink-0 align-middle ${className}`}
      aria-label="Tasdiqlangan profil"
    >
      <path
        d="M12 1.5l2.44 2.06 3.13-.62.98 3.05 2.83 1.49-1.15 2.98L21.5 13l-2.27 2.24.15 3.19-3.16.46L14.5 21.5 12 19.9l-2.5 1.6-1.72-2.61-3.16-.46.15-3.19L2.5 13l1.27-2.54L2.62 7.48l2.83-1.49.98-3.05 3.13.62L12 1.5z"
        fill="#0095F6"
      />
      <path
        d="M8.4 12.2l2.4 2.4 4.8-4.9"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** AgroZot logo belgisi — barg ichida tuyoq izi */
export function LogoIcon({ size = 32, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" className={className}>
      <defs>
        <linearGradient id="agrozot-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      <path
        d="M24 3C12 3 4 11 4 23c0 13 9 21 20 22 11-1 20-9 20-22C44 11 36 3 24 3Z"
        fill="url(#agrozot-g)"
      />
      <path
        d="M18 20c0-2.2 1.3-4 3-4s3 1.8 3 4-1.3 4-3 4-3-1.8-3-4Zm12-4c1.7 0 3 1.8 3 4s-1.3 4-3 4-3-1.8-3-4 1.3-4 3-4ZM17.5 30.5c1.5-2.5 4-4 6.5-4s5 1.5 6.5 4c1 1.7.4 3.9-1.3 4.9-1.6.9-3.4.6-5.2.6s-3.6.3-5.2-.6c-1.7-1-2.3-3.2-1.3-4.9Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}
