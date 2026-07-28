import { Home, MessagesSquare, PlusCircle, Bot, User } from 'lucide-react';
import { BiCategoryAlt } from 'react-icons/bi';
import { GiCow, GiSheep, GiRabbit, GiRooster, GiHorseHead, GiWheat, GiGears } from 'react-icons/gi';

// ─── O'zbekiston viloyatlari va tumanlari ───
export const REGIONS_DATA = {
  'Toshkent shahri': [
    'Bektemir', 'Chilonzor', 'Mirobod', "Mirzo Ulug'bek", 'Olmazor', 'Sergeli',
    'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yashnobod', 'Yunusobod', 'Yangihayot',
  ],
  'Toshkent viloyati': [
    'Angren', 'Bekobod', "Bo'ka", "Bo'stonliq", 'Chinoz', 'Chirchiq', 'Nurafshon',
    'Ohangaron', 'Olmaliq', "Oqqo'rg'on", 'Parkent', 'Piskent', 'Qibray',
    'Quyichirchiq', "O'rtachirchiq", "Yangiyo'l", 'Zangiota', 'Yuqorichirchiq',
  ],
  'Andijon': [
    'Andijon shahri', 'Asaka', 'Baliqchi', "Bo'z", 'Buloqboshi', 'Izboskan',
    'Jalaquduq', "Xo'jaobod", "Qo'rg'ontepa", 'Marhamat', "Oltinko'l", 'Paxtaobod',
    'Shahrixon', "Ulug'nor", 'Xonobod',
  ],
  "Farg'ona": [
    "Farg'ona shahri", "Marg'ilon", "Qo'qon", 'Quva', 'Rishton', "Bag'dod",
    'Beshariq', 'Buvayda', "Dang'ara", 'Furqat', "Qo'shtepa", 'Oltiariq',
    "O'zbekiston", "So'x", 'Toshloq', "Uchko'prik", 'Yozyovon',
  ],
  'Namangan': [
    'Namangan shahri', 'Chortoq', 'Chust', 'Kosonsoy', 'Mingbuloq', 'Norin',
    'Pop', "To'raqo'rg'on", "Uchqo'rg'on", 'Uychi', "Yangiqo'rg'on",
  ],
  'Samarqand': [
    'Samarqand shahri', "Bulung'ur", 'Ishtixon', 'Jomboy', "Kattaqo'rg'on",
    'Narpay', 'Nurobod', 'Oqdaryo', 'Paxtachi', 'Payariq', "Pastdarg'om",
    "Qo'shrabot", 'Toyloq', 'Urgut',
  ],
  'Buxoro': [
    'Buxoro shahri', "G'ijduvon", 'Jondor', 'Kogon', 'Olot', 'Peshku',
    "Qorako'l", 'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent',
  ],
  'Navoiy': [
    'Navoiy shahri', 'Zarafshon', 'Karmana', 'Konimex', 'Navbahor', 'Nurota',
    'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi',
  ],
  'Qashqadaryo': [
    'Qarshi shahri', 'Shahrisabz', 'Chiroqchi', 'Dehqonobod', "G'uzor", 'Kasbi',
    'Kitob', 'Koson', "Ko'kdala", 'Mirishkor', 'Muborak', 'Nishon', 'Qamashi', "Yakkabog'",
  ],
  'Surxondaryo': [
    'Termiz shahri', 'Angor', 'Bandixon', 'Boysun', 'Denov', "Jarqo'rg'on",
    'Muzrabot', 'Oltinsoy', 'Qiziriq', "Qumqo'rg'on", 'Sariosiyo', 'Sherobod',
    "Sho'rchi", 'Uzun',
  ],
  'Jizzax': [
    'Jizzax shahri', 'Arnasoy', 'Baxmal', "Do'stlik", 'Forish', "G'allaorol",
    "Mirzacho'l", 'Paxtakor', 'Sharof Rashidov', 'Yangiobod', 'Zafarobod',
    'Zarbdor', 'Zomin',
  ],
  'Sirdaryo': [
    'Guliston shahri', 'Shirin', 'Yangiyer', 'Boyovut', 'Guliston tumani',
    'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Xovos',
  ],
  'Xorazm': [
    'Urganch shahri', 'Xiva', "Bog'ot", 'Gurlan', 'Hazorasp', "Qo'shko'pir",
    'Shovot', "Tuproqqal'a", 'Xonqa', 'Yangiariq', 'Yangibozor',
  ],
  "Qoraqalpog'iston": [
    'Nukus shahri', 'Amudaryo', 'Beruniy', 'Chimboy', "Ellikqal'a", 'Kegeyli',
    "Mo'ynoq", 'Nukus tumani', "Qanliko'l", "Qorao'zak", 'Shumanay',
    "Taxtako'pir", "To'rtko'l", "Xo'jayli",
  ],
};

export const ALL_REGIONS_LABEL = 'Barcha hududlar';
export const REGIONS = [ALL_REGIONS_LABEL, ...Object.keys(REGIONS_DATA)];

// ─── Kategoriyalar (react-icons SVG ikonkalari, emoji ishlatilmaydi) ───
export const CATEGORIES = [
  { id: 'all', icon: BiCategoryAlt, label: 'Barchasi' },
  { id: 'cattle', icon: GiCow, label: 'Qoramol' },
  { id: 'sheep', icon: GiSheep, label: "Qo'y-echki" },
  { id: 'rabbit', icon: GiRabbit, label: 'Quyonlar' },
  { id: 'poultry', icon: GiRooster, label: 'Parranda' },
  { id: 'horse', icon: GiHorseHead, label: 'Otlar' },
  { id: 'feed', icon: GiWheat, label: 'Yem-hashak' },
  { id: 'equipment', icon: GiGears, label: 'Jihozlar' },
];

export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

// ─── Kategoriyaga xos forma maydonlari ───
// field turlari: select | text | number | toggle
// target: 'column' (bazadagi ustun) yoki 'attr' (attributes JSON ichida)
export const CATEGORY_FIELDS = {
  cattle: [
    { key: 'breed', target: 'column', type: 'select', label: 'Zoti', options: ['Golshtin', 'Simmental', 'Qora-ola', 'Shvits', 'Angus', 'Gereford', 'Mahalliy', 'Boshqa'] },
    { key: 'purpose', target: 'attr', type: 'select', label: "Yo'nalishi", options: ["Sog'in (sut)", "Go'sht (bo'rdoqi)", 'Naslli', 'Ish hayvoni'] },
    { key: 'age', target: 'column', type: 'text', label: 'Yoshi', placeholder: '2 yosh' },
    { key: 'gender', target: 'column', type: 'select', label: 'Jinsi', options: ['Erkak', "Urg'ochi"] },
    { key: 'weight', target: 'column', type: 'text', label: 'Vazni', placeholder: '450 kg' },
    { key: 'milkPerDay', target: 'attr', type: 'text', label: 'Kunlik sut (litr)', placeholder: '20 litr' },
    { key: 'vaccinated', target: 'column', type: 'toggle', label: 'Emlangan' },
  ],
  sheep: [
    { key: 'kind', target: 'attr', type: 'select', label: 'Turi', options: ["Qo'y", 'Echki'] },
    { key: 'breed', target: 'column', type: 'select', label: 'Zoti', options: ['Hisori', 'Merinos', "Qorako'l", 'Jaydari', 'Angor', 'Zaanen', 'Mahalliy', 'Boshqa'] },
    { key: 'count', target: 'attr', type: 'number', label: 'Bosh soni', placeholder: '10' },
    { key: 'age', target: 'column', type: 'text', label: 'Yoshi', placeholder: '8 oy' },
    { key: 'gender', target: 'column', type: 'select', label: 'Jinsi', options: ['Erkak', "Urg'ochi", 'Aralash'] },
    { key: 'weight', target: 'column', type: 'text', label: 'Vazni (1 bosh)', placeholder: '50 kg' },
    { key: 'vaccinated', target: 'column', type: 'toggle', label: 'Emlangan' },
  ],
  rabbit: [
    { key: 'breed', target: 'column', type: 'select', label: 'Zoti', options: ['Kaliforniya', 'Flandr', 'Sovet shinshillasi', 'Oq gigant', 'Mahalliy', 'Boshqa'] },
    { key: 'count', target: 'attr', type: 'number', label: 'Soni (dona)', placeholder: '10' },
    { key: 'age', target: 'column', type: 'text', label: 'Yoshi', placeholder: '3 oy' },
    { key: 'gender', target: 'column', type: 'select', label: 'Jinsi', options: ['Erkak', "Urg'ochi", 'Juftlik', 'Aralash'] },
    { key: 'vaccinated', target: 'column', type: 'toggle', label: 'Emlangan' },
  ],
  poultry: [
    { key: 'kind', target: 'attr', type: 'select', label: 'Turi', options: ['Tovuq', "Xo'roz", "Jo'ja", 'Kurka', "O'rdak", "G'oz", 'Bedana', 'Boshqa'] },
    { key: 'purpose', target: 'attr', type: 'select', label: "Yo'nalishi", options: ['Tuxum', "Go'sht (broyler)", 'Naslli', 'Aralash'] },
    { key: 'count', target: 'attr', type: 'number', label: 'Soni (dona)', placeholder: '20' },
    { key: 'age', target: 'column', type: 'text', label: 'Yoshi', placeholder: '5 oy' },
    { key: 'vaccinated', target: 'column', type: 'toggle', label: 'Emlangan' },
  ],
  horse: [
    { key: 'breed', target: 'column', type: 'select', label: 'Zoti', options: ['Qorabayir', 'Axalteke', 'Arab', 'Mustang', 'Mahalliy', 'Boshqa'] },
    { key: 'age', target: 'column', type: 'text', label: 'Yoshi', placeholder: '5 yosh' },
    { key: 'gender', target: 'column', type: 'select', label: 'Jinsi', options: ["Ayg'ir", 'Biya', 'Toychoq'] },
    { key: 'weight', target: 'column', type: 'text', label: 'Vazni', placeholder: '450 kg' },
    { key: 'vaccinated', target: 'column', type: 'toggle', label: 'Emlangan' },
  ],
  feed: [
    { key: 'feedType', target: 'attr', type: 'select', label: 'Yem turi', options: ['Beda (pichan)', 'Omixta yem', 'Arpa', "Makkajo'xori", 'Kepak', 'Kunjara', 'Silos', 'Somon', 'Boshqa'] },
    { key: 'unit', target: 'attr', type: 'select', label: "O'lchov birligi", options: ['kg', 'qop', "bog'", 'tonna', 'dona'] },
    { key: 'amount', target: 'attr', type: 'number', label: 'Miqdori', placeholder: '500' },
    { key: 'delivery', target: 'attr', type: 'toggle', label: 'Yetkazib berish bor' },
  ],
  equipment: [
    { key: 'equipType', target: 'attr', type: 'select', label: 'Jihoz turi', options: ["Sog'ish apparati", 'Inkubator', 'Yem maydalagich', 'Suv tizimi', 'Katak/panjara', 'Elektr to\'siq', 'Boshqa'] },
    { key: 'condition', target: 'attr', type: 'select', label: 'Holati', options: ['Yangi', 'Yaxshi holatda', 'Ishlatilgan'] },
    { key: 'warranty', target: 'attr', type: 'toggle', label: 'Kafolat bor' },
  ],
};

// attributes kalitlari uchun ko'rsatiladigan nomlar (DetailModal)
export const ATTRIBUTE_LABELS = {
  breed: 'Zoti',
  age: 'Yoshi',
  gender: 'Jinsi',
  weight: 'Vazni',
  vaccinated: 'Emlangan',
  purpose: "Yo'nalishi",
  kind: 'Turi',
  count: 'Soni',
  milkPerDay: 'Kunlik sut',
  feedType: 'Yem turi',
  unit: "O'lchov birligi",
  amount: 'Miqdori',
  delivery: 'Yetkazib berish',
  equipType: 'Jihoz turi',
  condition: 'Holati',
  warranty: 'Kafolat',
};

// ─── Pastki navigatsiya ───
export const BOTTOM_TABS = [
  { id: 'home', icon: Home, label: 'Bosh sahifa' },
  { id: 'chat', icon: MessagesSquare, label: 'Chat' },
  { id: 'post', icon: PlusCircle, label: "E'lon" },
  { id: 'ai', icon: Bot, label: 'AI Yordam' },
  { id: 'profile', icon: User, label: 'Profil' },
];

export const CHAT_HISTORY = [
  {
    sender: 'ai',
    text: "Salom! Men Chorvabozor AI yordamchisiman. Istalgan savolingizga javob beraman — chorva salomatligi, ratsion, davolash yoki bozor narxlari. Hayvon rasmini yuborsangiz, taxminiy vazni va narxini baholab beraman.",
  },
];
