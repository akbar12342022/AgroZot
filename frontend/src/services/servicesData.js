// ─── Xizmatlar ekotizimi: konfiguratsiya va mock ma'lumotlar ───
// Hozircha backend yo'q — provayderlar ro'yxati mock + localStorage'da saqlanadi.

// Xizmat yo'nalishlari (forma karta-tugmalari va badge ranglari)
export const SERVICE_TYPES = [
  {
    id: 'butcher',
    emoji: '🔪',
    label: 'Qassob',
    tagline: "So'yish va nimtalash xizmati",
    badge: 'bg-red-50 text-red-600 border-red-200',
    avatar: 'from-red-400 to-rose-600',
  },
  {
    id: 'transport',
    emoji: '🚛',
    label: 'Yuk tashish',
    tagline: 'Chorva va yuk tashish',
    badge: 'bg-sky-50 text-sky-600 border-sky-200',
    avatar: 'from-sky-400 to-blue-600',
  },
  {
    id: 'feed',
    emoji: '🌾',
    label: 'Ozuqa',
    tagline: 'Yem-xashak yetkazib berish',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    avatar: 'from-amber-400 to-orange-500',
  },
];

export const SERVICE_TYPE_MAP = Object.fromEntries(SERVICE_TYPES.map((t) => [t.id, t]));

// Forma variantlari
export const TRANSPORT_TYPES = ['Isuzu', 'Gazel', 'Labo', 'Porter', 'KamAZ', 'Boshqa'];
export const CAPACITY_UNITS = ['tonna', 'kg'];
export const PRICING_TYPES = ['Kelishilgan', '1 km uchun narx', 'Qatnov uchun'];
export const BUTCHER_ANIMALS = ['Qoramol', "Qo'y-echki", 'Yilqi', 'Parranda'];
export const FEED_KINDS = ['Beda', 'Yem', 'Sheluxa', 'Makka', 'Somon', 'Boshqa'];
export const FEED_UNITS = ['kg', 'tonna', 'press'];

/** Kartochkadagi asosiy ko'rsatkich qatori (masalan: "Isuzu | 5 tonna") */
export function providerMetric(p) {
  if (p.type === 'transport') return `${p.transport} | ${p.capacity} ${p.capacityUnit}`;
  if (p.type === 'butcher') return `${p.experience} yil tajriba | ${(p.animals || []).join(', ')}`;
  if (p.type === 'feed') return `${p.feedKind} | ${p.amount} ${p.unit}`;
  return '';
}

/** Narx qatori (bo'lsa) */
export function providerPriceLine(p) {
  const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
  if (p.type === 'butcher' && p.price) return `${fmt(p.price)} / bosh`;
  if (p.type === 'feed' && p.price) return `${fmt(p.price)} / ${p.unit === 'press' ? 'press' : p.unit}`;
  if (p.type === 'transport') return p.pricing;
  return null;
}

// ─── Mock provayderlar (dizayn va ro'yxat uchun boshlang'ich ma'lumot) ───
export const MOCK_PROVIDERS = [
  {
    id: 'm1',
    type: 'transport',
    name: 'Baxtiyor aka',
    region: 'Toshkent viloyati',
    district: 'Chinoz',
    phone: '+998901112233',
    transport: 'Isuzu',
    capacity: 5,
    capacityUnit: 'tonna',
    pricing: 'Kelishilgan',
    note: "Chorva mollarini xavfsiz tashish uchun maxsus kuzov. Viloyatlararo qatnovlar ham bor.",
  },
  {
    id: 'm2',
    type: 'butcher',
    name: 'Usta Karim',
    region: 'Samarqand',
    district: 'Urgut',
    phone: '+998911234567',
    animals: ['Qoramol', "Qo'y-echki"],
    experience: 15,
    price: 300000,
    events: true,
    note: "To'y va ma'rakalarga chiqamiz. Halol, tez va toza xizmat kafolatlanadi.",
  },
  {
    id: 'm3',
    type: 'feed',
    name: 'Ozodbek',
    region: "Farg'ona",
    district: 'Quva',
    phone: '+998933456789',
    feedKind: 'Beda',
    amount: 500,
    unit: 'press',
    price: 25000,
    delivery: true,
    note: "Yangi o'rilgan sifatli beda. 50 pressdan ortiq buyurtmaga chegirma.",
  },
  {
    id: 'm4',
    type: 'transport',
    name: "Jasur haydovchi",
    region: 'Andijon',
    district: 'Asaka',
    phone: '+998907654321',
    transport: 'Gazel',
    capacity: 1.5,
    capacityUnit: 'tonna',
    pricing: '1 km uchun narx',
    note: "Mayda mol va parranda tashish. Tez yetkazib berish, kunlik qatnovlar.",
  },
  {
    id: 'm5',
    type: 'butcher',
    name: 'Hasan qassob',
    region: 'Toshkent shahri',
    district: 'Sergeli',
    phone: '+998935556677',
    animals: ['Qoramol', "Qo'y-echki", 'Parranda'],
    experience: 8,
    price: 250000,
    events: false,
    note: "Uyga borib so'yib beramiz. Go'shtni nimtalab, qismlarga ajratib beramiz.",
  },
  {
    id: 'm6',
    type: 'feed',
    name: 'Muzaffar aka',
    region: 'Qashqadaryo',
    district: 'Kitob',
    phone: '+998942223344',
    feedKind: 'Makka',
    amount: 10,
    unit: 'tonna',
    price: 3200000,
    delivery: false,
    note: "O'z dalamizdan makkajo'xori. Ulgurji narxlarda, sifat kafolati bilan.",
  },
  {
    id: 'm7',
    type: 'transport',
    name: 'Olim KamAZchi',
    region: 'Buxoro',
    district: "G'ijduvon",
    phone: '+998909998877',
    transport: 'KamAZ',
    capacity: 10,
    capacityUnit: 'tonna',
    pricing: 'Qatnov uchun',
    note: "Katta hajmdagi yuklar va ko'p sonli chorva uchun. Respublika bo'ylab.",
  },
  {
    id: 'm8',
    type: 'butcher',
    name: 'Botir usta',
    region: 'Namangan',
    district: 'Chust',
    phone: '+998914445566',
    animals: ['Yilqi', 'Qoramol'],
    experience: 20,
    price: 400000,
    events: true,
    note: "Yilqi va yirik qoramol bo'yicha 20 yillik tajriba. Qozon-o'choq xizmati ham bor.",
  },
  {
    id: 'm9',
    type: 'feed',
    name: 'Sardor ozuqa',
    region: 'Toshkent viloyati',
    district: 'Zangiota',
    phone: '+998977778899',
    feedKind: 'Yem',
    amount: 2000,
    unit: 'kg',
    price: 4500,
    delivery: true,
    note: 'Omixta yem — qoramol va parranda uchun. Dostavka bepul (20 km gacha).',
  },
];

// localStorage kaliti — foydalanuvchi yuborgan arizalar shu yerda saqlanadi
export const PROVIDERS_STORAGE_KEY = 'agrozot_providers';

export function loadSavedProviders() {
  try {
    const raw = localStorage.getItem(PROVIDERS_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveProviders(list) {
  try {
    localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage to'la — mock rejimda jiddiy emas */
  }
}
