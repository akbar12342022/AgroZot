// Bazaga namunaviy ma'lumotlarni kiritish skripti
// Ishga tushirish: node prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USERS = [
  {
    telegramId: 111111111n,
    firstName: 'Akmal',
    lastName: 'Karimov',
    username: 'akmal_fermer',
    phone: '+998901234567',
  },
  {
    telegramId: 222222222n,
    firstName: 'Dilshod',
    lastName: "Ro'ziyev",
    username: 'dilshod_chorva',
    phone: '+998935557788',
  },
  {
    telegramId: 333333333n,
    firstName: 'Gulnora',
    lastName: 'Salimova',
    username: 'gulnora_agro',
    phone: '+998971112233',
  },
  {
    // Dev-mode foydalanuvchi (lokal test uchun)
    telegramId: 999999999n,
    firstName: 'Test',
    lastName: 'Chorvador',
    username: 'dev_user',
    phone: '+998901112233',
  },
];

const img = (id, w = 800) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const ANIMALS = [
  {
    title: "Golshtin zotli sog'in sigir, kuniga 25 litr sut beradi",
    category: 'cattle',
    price: 28000000,
    description: "Golshtin zotli sog'in sigir. Kuniga 24-26 litr sut beradi. 3-tug'ishi. Barcha emlashlar o'z vaqtida qilingan, veterinariya hujjatlari mavjud. Sog'lom, tinch fe'lli. Sababi — ferma qisqartirilmoqda.",
    images: [img('photo-1570042225831-d98fa7577f1e'), img('photo-1500595046743-cd271d694d30')],
    location: 'Chinoz tumani',
    region: 'Toshkent',
    breed: 'Golshtin',
    age: '4 yosh',
    gender: 'Urg\'ochi',
    weight: '520 kg',
    vaccinated: true,
    isTop: true,
    views: 342,
    ownerIdx: 0,
  },
  {
    title: "Qora-ola buqa, 18 oylik, go'shtga boquvda",
    category: 'cattle',
    price: 19500000,
    description: "Qora-ola zotli buqa. 18 oylik, vazni 380 kg. Kuchli, sog'lom. Go'sht yo'nalishida boqilgan. Narxda kelishamiz.",
    images: [img('photo-1560343090-f0409e92791a')],
    location: 'Urgut tumani',
    region: 'Samarqand',
    breed: 'Qora-ola',
    age: '18 oy',
    gender: 'Erkak',
    weight: '380 kg',
    vaccinated: true,
    views: 187,
    ownerIdx: 1,
  },
  {
    title: "Hisori qo'chqorlar, 6-8 oylik, 10 bosh",
    category: 'sheep',
    price: 3500000,
    description: "Hisori zotli qo'chqorlar. 6-8 oylik, har biri 45-55 kg. 10 bosh, donalab ham sotiladi. Narx 1 boshi uchun. Emlangan, sog'lom.",
    images: [img('photo-1484557985045-edf25e08da73'), img('photo-1533318087102-b3ad366ed041')],
    location: 'Denov tumani',
    region: 'Surxondaryo',
    breed: 'Hisori',
    age: '6-8 oy',
    gender: 'Erkak',
    weight: '45-55 kg',
    vaccinated: true,
    isTop: true,
    views: 421,
    ownerIdx: 1,
  },
  {
    title: "Angor echkilari, suti shifobaxsh, 5 bosh",
    category: 'sheep',
    price: 2200000,
    description: "Angor zotli echkilar. Sut yo'nalishi, kuniga 2-3 litr sut. Juni ham qimmatbaho. 5 bosh bor, narx 1 boshi uchun.",
    images: [img('photo-1524024973431-2ad916746881')],
    location: "Bo'ka tumani",
    region: 'Toshkent',
    breed: 'Angor',
    age: '2 yosh',
    gender: 'Urg\'ochi',
    weight: '35 kg',
    vaccinated: false,
    views: 95,
    ownerIdx: 2,
  },
  {
    title: 'Kaliforniya quyonlari, naslli juftlik',
    category: 'rabbit',
    price: 450000,
    description: "Kaliforniya zotli quyonlar. Naslli juftlik (erkak + urg'ochi). Tez ko'payadi, go'shti mazali. Katakchasi bilan berilishi mumkin (kelishiladi).",
    images: [img('photo-1585110396000-c9ffd4e4b308')],
    location: 'Asaka tumani',
    region: 'Andijon',
    breed: 'Kaliforniya',
    age: '8 oy',
    gender: 'Juftlik',
    weight: '4 kg',
    vaccinated: true,
    views: 156,
    ownerIdx: 2,
  },
  {
    title: "Brama tovuqlari, tuxumga kirgan, 20 dona",
    category: 'poultry',
    price: 180000,
    description: "Brama zotli tovuqlar. Tuxumga kirgan, yirik zot. 20 dona bor, narx 1 donasi uchun. Xo'rozlari ham bor.",
    images: [img('photo-1548550023-2bdb3c5beed7')],
    location: 'Rishton tumani',
    region: "Farg'ona",
    breed: 'Brama',
    age: '7 oy',
    gender: 'Urg\'ochi',
    weight: '3 kg',
    vaccinated: true,
    views: 203,
    ownerIdx: 0,
  },
  {
    title: "Kurka (indyuk) jo'jalari, 50 dona, ulgurji",
    category: 'poultry',
    price: 65000,
    description: "Oq ko'krakli kurka jo'jalari. 1 oylik, baquvvat. 50 dona, ulgurji olganlarga chegirma. Narx 1 donasi uchun.",
    images: [img('photo-1563281577-a7be47e20db9')],
    location: 'Kattaqo\'rg\'on tumani',
    region: 'Samarqand',
    breed: "Oq ko'krakli",
    age: '1 oy',
    gender: 'Aralash',
    weight: '1 kg',
    vaccinated: false,
    views: 78,
    ownerIdx: 1,
  },
  {
    title: "Qorabayir oti, 5 yosh, chopqir va chiroyli",
    category: 'horse',
    price: 85000000,
    description: "Qorabayir zotli ayg'ir. 5 yosh, juda chopqir va chiroyli. Ko'pkari va poygalarda qatnashgan. Hujjatlari to'liq. Jiddiy xaridorlar uchun.",
    images: [img('photo-1553284965-83fd3e82fa5a'), img('photo-1534773728080-33d31da27ae5')],
    location: 'Qarshi tumani',
    region: 'Qashqadaryo',
    breed: 'Qorabayir',
    age: '5 yosh',
    gender: 'Erkak',
    weight: '450 kg',
    vaccinated: true,
    isTop: true,
    views: 567,
    ownerIdx: 0,
  },
  {
    title: 'Beda (yo\'ng\'ichqa) pichani, press qilingan, 500 bog\'',
    category: 'feed',
    price: 25000,
    description: "Sifatli beda pichani. Press qilingan, har bog'i 18-20 kg. 500 bog' bor. Yetkazib berish xizmati mavjud (kelishiladi). Narx 1 bog' uchun.",
    images: [img('photo-1595475207225-428b62bda831')],
    location: "G'ijduvon tumani",
    region: 'Buxoro',
    vaccinated: null,
    views: 134,
    ownerIdx: 1,
  },
  {
    title: "Omixta yem, 40 kg qop, oqsilga boy",
    category: 'feed',
    price: 165000,
    description: "Chorva uchun omixta yem. 40 kg qoplarda. Tarkibi: arpa, makkajo'xori, kepak, kunjara. Oqsilga boy. Ulgurji narxlar ham bor.",
    images: [img('photo-1625246333195-78d9c38ad449')],
    location: 'Chust tumani',
    region: 'Namangan',
    vaccinated: null,
    views: 88,
    ownerIdx: 2,
  },
  {
    title: "Sut sog'ish apparati, 2 sigirlik, yangi",
    category: 'equipment',
    price: 4800000,
    description: "Sut sog'ish apparati. Bir vaqtda 2 sigirni sog'adi. Yangi, qutisida. 1 yil kafolat. Zapchastlari doim topiladi.",
    images: [img('photo-1595872018818-97555653a011')],
    location: 'Yunusobod tumani',
    region: 'Toshkent',
    vaccinated: null,
    views: 167,
    ownerIdx: 0,
  },
  {
    title: "Simmental g'unajin, 2 yosh, bo'g'oz",
    category: 'cattle',
    price: 24000000,
    description: "Simmental zotli g'unajin. 2 yosh, 5 oylik bo'g'oz. Birinchi tug'ishi. Juda sog'lom, veterinar ko'rigidan o'tgan. Hujjatlari bor.",
    images: [img('photo-1546445317-29f4545e9d53')],
    location: 'Pop tumani',
    region: 'Namangan',
    breed: 'Simmental',
    age: '2 yosh',
    gender: 'Urg\'ochi',
    weight: '430 kg',
    vaccinated: true,
    views: 245,
    ownerIdx: 2,
  },
  {
    title: "Merinos qo'ylari, juni sifatli, 15 bosh suruv",
    category: 'sheep',
    price: 2800000,
    description: "Merinos zotli qo'ylar. Juni juda sifatli, yiliga 2 marta qirqiladi. 15 bosh suruv, birga yoki donalab sotiladi. Narx 1 boshi uchun.",
    images: [img('photo-1517849845537-4d257902454a')],
    location: 'Nurota tumani',
    region: 'Navoiy',
    breed: 'Merinos',
    age: '1-3 yosh',
    gender: 'Aralash',
    weight: '40-60 kg',
    vaccinated: true,
    views: 112,
    ownerIdx: 1,
  },
  {
    title: "Flandr quyonlari, yirik zot, 10 dona",
    category: 'rabbit',
    price: 350000,
    description: "Flandr (Belgiya giganti) quyonlari. Eng yirik zot — 7-8 kg gacha boradi. 3 oylik, 10 dona. Narx 1 donasi uchun.",
    images: [img('photo-1452857297128-d9c29adba80b')],
    location: 'Xiva tumani',
    region: 'Xorazm',
    breed: 'Flandr',
    age: '3 oy',
    gender: 'Aralash',
    weight: '2.5 kg',
    vaccinated: true,
    views: 67,
    ownerIdx: 0,
  },
];

async function main() {
  console.log('Seed boshlandi...');

  // Foydalanuvchilarni yaratish (upsert — qayta ishga tushirilsa dublikat bo'lmaydi)
  const createdUsers = [];
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { telegramId: u.telegramId },
      update: { firstName: u.firstName, lastName: u.lastName, username: u.username, phone: u.phone },
      create: u,
    });
    createdUsers.push(user);
    console.log(`  User: ${user.firstName} ${user.lastName} (id=${user.id})`);
  }

  // Agar e'lonlar allaqachon mavjud bo'lsa, qayta kiritmaymiz
  const existing = await prisma.animal.count();
  if (existing > 0) {
    console.log(`Bazada allaqachon ${existing} ta e'lon bor — seed o'tkazib yuborildi.`);
    return;
  }

  for (const a of ANIMALS) {
    const { ownerIdx, ...data } = a;
    const animal = await prisma.animal.create({
      data: { ...data, district: data.location || null, userId: createdUsers[ownerIdx].id },
    });
    console.log(`  E'lon: ${animal.title.slice(0, 40)}... (id=${animal.id})`);
  }

  console.log(`Seed tugadi: ${USERS.length} user, ${ANIMALS.length} e'lon.`);
}

main()
  .catch((e) => {
    console.error('Seed xatosi:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
