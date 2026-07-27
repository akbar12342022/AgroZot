import { ShoppingCart, Beef, Compass, Rabbit, Bird, Send, Users } from 'lucide-react';
import { CowIcon, SheepIcon, HorseIcon, InstagramIcon, YoutubeIcon } from '../components/icons';

// ─── Onboarding so'rovnomasi variantlari ───
// Bazada qisqa `id` kalitlari saqlanadi; ko'rinadigan matnlar shu yerdan olinadi.

export const SURVEY_ROLES = [
  { id: 'farmer', icon: CowIcon, label: 'Chorva boqaman / Sotaman', sub: 'Chorvador yoki fermerman', short: 'Chorvador' },
  { id: 'buyer', icon: ShoppingCart, label: "O'zim uchun sotib olmoqchiman", sub: 'Hayvon yoki mahsulot izlayapman', short: 'Xaridor' },
  { id: 'butcher', icon: Beef, label: "Qassoblik / Go'sht savdosi", sub: "Go'sht yo'nalishida ishlayman", short: 'Qassob' },
  { id: 'curious', icon: Compass, label: 'Shunchaki qiziqish uchun kirdim', sub: 'Platforma bilan tanishmoqchiman', short: 'Qiziquvchi' },
];

export const SURVEY_INTERESTS = [
  { id: 'cattle', icon: CowIcon, label: 'Yirik shoxli', sub: "Sigir, buqa, ho'kiz" },
  { id: 'sheep', icon: SheepIcon, label: 'Mayda shoxli', sub: "Qo'y va echkilar" },
  { id: 'horse', icon: HorseIcon, label: 'Otlar', sub: 'Ot va toychoqlar' },
  { id: 'rabbit', icon: Rabbit, label: 'Quyonchilik', sub: 'Quyonlar' },
  { id: 'poultry', icon: Bird, label: 'Parrandachilik', sub: "Tovuq, o'rdak, g'oz, kurka" },
];

export const SURVEY_SOURCES = [
  { id: 'instagram', icon: InstagramIcon, label: 'Instagram' },
  { id: 'telegram', icon: Send, label: 'Telegram' },
  { id: 'youtube', icon: YoutubeIcon, label: 'YouTube' },
  { id: 'friends', icon: Users, label: 'Tanishlarimdan' },
];

const toMap = (list, key = 'label') => Object.fromEntries(list.map((o) => [o.id, o[key] || o.label]));

// Admin panel uchun qisqa nomlar
export const SURVEY_ROLE_LABELS = toMap(SURVEY_ROLES, 'short');
export const SURVEY_INTEREST_LABELS = toMap(SURVEY_INTERESTS);
export const SURVEY_SOURCE_LABELS = toMap(SURVEY_SOURCES);
