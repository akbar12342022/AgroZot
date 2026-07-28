import { resolveImageUrl } from '../api/client';
import { ATTRIBUTE_LABELS } from '../constants/data';

export const formatPrice = (num) => {
  if (!num) return "0 so'm";
  return Math.round(Number(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
};

export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Hozirgina';
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' yil oldin';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' oy oldin';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' kun oldin';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' soat oldin';
  return Math.floor(seconds / 60) + ' daqiqa oldin';
};

/** Rasm yuklanmasa ko'rsatiladigan SVG placeholder (neytral tuyoq izi belgisi) */
export function categoryPlaceholder() {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0%' stop-color='#E2E8F0'/><stop offset='100%' stop-color='#F1F5F9'/>` +
    `</linearGradient></defs>` +
    `<rect width='800' height='600' fill='url(#g)'/>` +
    `<g transform='translate(340,240) scale(5)' fill='#2c3446'>` +
    `<ellipse cx='6' cy='6' rx='4' ry='5.5'/>` +
    `<ellipse cx='18' cy='6' rx='4' ry='5.5'/>` +
    `<path d='M4 19c2-4 5-6 8-6s6 2 8 6c1.4 2.4.5 5.4-2 6.7-2.2 1.2-4.4.8-6 .8s-3.8.4-6-.8c-2.5-1.3-3.4-4.3-2-6.7Z'/>` +
    `</g>` +
    `<text x='400' y='430' font-family='Inter,sans-serif' font-size='24' fill='#3d4660' text-anchor='middle'>Chorvabozor</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Rasm yuklanmaganda placeholderga almashtirish (onError handler) */
export function imgFallback(e) {
  const el = e.currentTarget;
  if (el.dataset.fallbackApplied) return;
  el.dataset.fallbackApplied = '1';
  el.src = categoryPlaceholder();
}

/**
 * API dan kelgan e'lonni UI komponentlar kutadigan shaklga keltirish.
 * (img, time, sellerName, specs, badges va h.k.)
 */
export function normalizeAnimal(a) {
  if (!a) return a;
  const images = (a.images || []).map(resolveImageUrl).filter(Boolean);
  const img = images[0] || categoryPlaceholder();
  const seller = a.user || {};

  // Xarakteristikalar: ustunlar + attributes JSON birlashtiriladi
  const specs = {};
  if (a.breed) specs[ATTRIBUTE_LABELS.breed] = a.breed;
  if (a.age) specs[ATTRIBUTE_LABELS.age] = a.age;
  if (a.gender) specs[ATTRIBUTE_LABELS.gender] = a.gender;
  if (a.weight) specs[ATTRIBUTE_LABELS.weight] = a.weight;
  if (a.vaccinated !== null && a.vaccinated !== undefined) {
    specs[ATTRIBUTE_LABELS.vaccinated] = a.vaccinated ? 'Ha' : "Yo'q";
  }
  if (a.attributes && typeof a.attributes === 'object') {
    for (const [key, val] of Object.entries(a.attributes)) {
      if (val === null || val === undefined || val === '') continue;
      const label = ATTRIBUTE_LABELS[key] || key;
      specs[label] = typeof val === 'boolean' ? (val ? 'Ha' : "Yo'q") : String(val);
    }
  }

  const badges = [];
  if (a.vaccinated) badges.push('Emlangan');

  const place = [a.district || a.location, a.region].filter(Boolean).join(', ');

  return {
    ...a,
    img,
    images: images.length ? images : [img],
    time: timeAgo(a.createdAt),
    rawLocation: a.location || '',
    location: place || a.region || '',
    sellerName: [seller.firstName, seller.lastName].filter(Boolean).join(' ') || 'Sotuvchi',
    sellerUsername: seller.username || '',
    sellerPhone: seller.phone || '',
    sellerVerified: !!seller.isVerified,
    sellerAvatar: resolveImageUrl(seller.avatarUrl),
    sellerSince: seller.createdAt ? new Date(seller.createdAt).getFullYear() : new Date().getFullYear(),
    specs: Object.keys(specs).length ? specs : null,
    badges,
  };
}
