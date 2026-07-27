// AgroZot AI — qoidalarga asoslangan bilim bazasi (fallback rejim).
// ANTHROPIC_API_KEY qo'yilmaganda yoki AI xizmati ishlamay qolganda ishlatiladi.
const prisma = require('./prisma');

const CATEGORY_NAMES = {
  cattle: 'Qoramol',
  sheep: "Qo'y-echki",
  rabbit: 'Quyonlar',
  poultry: 'Parranda',
  horse: 'Otlar',
  feed: 'Yem-hashak',
  equipment: 'Jihozlar',
};

const KNOWLEDGE = [
  {
    keywords: ['emlash', 'emla', 'vaksina', 'vaccin', 'ukol'],
    answer:
      "Emlash jadvali bo'yicha umumiy tavsiyalar:\n\n" +
      "• Qoramol: yiliga 2 marta oqsil (yashur) kasalligiga, 1 marta kuydirgiga qarshi emlanadi.\n" +
      "• Qo'y-echki: chechak, brutsellyoz va enterotoksemiyaga qarshi emlash muhim.\n" +
      "• Parranda: Nyukasl kasalligiga qarshi jo'jalikdan boshlab emlash kerak.\n" +
      "• Quyonlar: miksomatoz va VGBK ga qarshi 45 kunlikdan emlanadi.\n\n" +
      "Aniq jadval uchun hududingizdagi veterinariya xizmatiga murojaat qiling — emlash muddatlari mavsum va hududga qarab farq qiladi.",
  },
  {
    keywords: ['oqsil', 'yashur', "og'iz", 'tuyoq', "so'lak"],
    answer:
      "Oqsil (yashur) belgilari: og'iz va tuyoqlarda yara, kuchli so'lak oqishi, oqsoqlanish, isitma.\n\n" +
      "Nima qilish kerak:\n" +
      "1. Kasal hayvonni darhol podadan ajrating (karantin).\n" +
      "2. Veterinarga zudlik bilan xabar bering — bu yuqumli kasallik, davlat nazoratida.\n" +
      "3. Og'iz yaralarini kaliy permanganat eritmasi bilan yuvish mumkin.\n" +
      "4. Yumshoq ozuqa va toza suv bering.\n\n" +
      "O'z-o'zini davolash bilan cheklanmang — albatta veterinar ko'rigidan o'tkazing.",
  },
  {
    keywords: ['ich ket', 'diareya', 'ichi ket', 'ich buzil'],
    answer:
      "Ich ketishda birinchi yordam:\n\n" +
      "1. Hayvonni suvsizlanishdan saqlang — elektrolit eritmalari (regidron yoki tuz-shakar eritmasi) bering.\n" +
      "2. 12-24 soat davomida og'ir ozuqani cheklab, faqat suv va yengil xashak bering.\n" +
      "3. Yosh mollarda ich ketish juda xavfli — 1 kundan uzoq davom etsa zudlik bilan veterinar chaqiring.\n" +
      "4. Sabab ko'pincha: sifatsiz ozuqa, keskin ratsion o'zgarishi, parazitlar yoki infeksiya.\n\n" +
      "Antibiotikni faqat veterinar tavsiyasi bilan qo'llang.",
  },
  {
    keywords: ['ratsion', 'ozuqa', 'yem', 'oziqlantirish', 'boqish', 'xashak', 'beda'],
    answer:
      "To'g'ri ratsion — mahsuldorlikning asosi:\n\n" +
      "• Sog'in sigir (kuniga): 25-30 kg ko'k xashak/silos, 3-5 kg omuxta yem, 50-100 g tuz va mineral qo'shimcha.\n" +
      "• Semirtirilayotgan buqa: don aralashmasini asta-sekin 60-70% gacha oshirib boriladi.\n" +
      "• Qo'ylar: kuniga 1.5-2 kg quruq xashak + 300-500 g don.\n" +
      "• Suv doim toza va yetarli bo'lsin — sigir kuniga 60-80 litr suv ichadi.\n\n" +
      "Ratsionni keskin o'zgartirmang — 7-10 kun davomida asta-sekin o'tkazing.",
  },
  {
    keywords: ['sut', "sog'im", "sog'ish", 'laktatsiya', 'mastit', 'yelin'],
    answer:
      "Sut miqdorini oshirish bo'yicha tavsiyalar:\n\n" +
      "1. Ratsionga oqsilga boy ozuqa qo'shing: beda, kunjara, soya shroti.\n" +
      "2. Suv tanqisligi sutni 20-30% ga kamaytiradi — suv doim yetarli bo'lsin.\n" +
      "3. Sog'ishni bir xil vaqtda, kuniga 2-3 marta o'tkazing.\n" +
      "4. Yelin gigiyenasiga rioya qiling — mastit sut yo'qotishning asosiy sababi.\n" +
      "5. Sigirni stress holatlaridan asrang (issiq, shovqin, tor joy).\n\n" +
      "Zotdor sigir to'g'ri parvarishda kuniga 20-30 litr sut beradi.",
  },
  {
    keywords: ['semirtirish', 'vazn', "og'irlik", "bo'rdoqi", "go'sht"],
    answer:
      "Semirtirish (bo'rdoqichilik) bo'yicha maslahatlar:\n\n" +
      "1. Semirtirish uchun 8-18 oylik erkak buzoqlar eng samarali.\n" +
      "2. Ratsion: 60-70% don aralashmasi (arpa, makkajo'xori), 30-40% dag'al ozuqa.\n" +
      "3. Kunlik qo'shimcha vazn: yaxshi parvarishda 1-1.5 kg.\n" +
      "4. Harakatni cheklang, tinch va salqin joy ta'minlang.\n" +
      "5. Har 2 haftada vaznni nazorat qilib, ratsionni moslashtiring.\n\n" +
      "3-4 oylik intensiv bo'rdoqidan so'ng so'yish vazniga yetadi.",
  },
  {
    keywords: ['quyon'],
    answer:
      "Quyon boqish bo'yicha asosiy qoidalar:\n\n" +
      "• Katak quruq, shamollatiladigan, ammo yelvizaksiz bo'lishi kerak.\n" +
      "• Ozuqa: ko'k o't/pichan asosiy, don va sabzavot qo'shimcha. Ho'l o't bermang — ich shishiradi!\n" +
      "• Miksomatoz va VGBK ga qarshi emlash majburiy (45 kunlikdan).\n" +
      "• Urg'ochi quyon yiliga 4-6 marta, har safar 6-10 bola beradi.\n" +
      "• 3-4 oyda so'yish vazniga (2.5-3 kg) yetadi.\n\n" +
      "Kaliforniya va Flandr zotlari go'sht uchun eng samarali.",
  },
  {
    keywords: ['tovuq', 'parranda', "jo'ja", 'broyler', 'tuxum'],
    answer:
      "Parrandachilik bo'yicha tavsiyalar:\n\n" +
      "• Broyler jo'jalar 45-60 kunda 2.5-3 kg ga yetadi — harorat rejimi juda muhim (1-haftada 32-34°C).\n" +
      "• Tuxum yo'nalishida: yorug'lik kuni 14-16 soat bo'lishi kerak, kaltsiyli qo'shimcha bering.\n" +
      "• Nyukasl va Gamboro kasalliklariga qarshi emlash majburiy.\n" +
      "• Ozuqada protein: jo'jalarga 20-22%, katta tovuqlarga 16-18%.\n\n" +
      "Toza suv va quruq to'shama — kasalliklarning oldini olishning asosi.",
  },
  {
    keywords: ["bo'g'oz", "tug'ish", 'tuqqan', 'buzoqla', "qo'zila", 'homila'],
    answer:
      "Bo'g'oz hayvon parvarishi:\n\n" +
      "• Sigirda bo'g'ozlik 280-285 kun, qo'yda 145-155 kun davom etadi.\n" +
      "• Oxirgi 2 oyda ozuqa sifatini oshiring, ammo ortiqcha semirtirmang.\n" +
      "• Tug'ishdan 7-10 kun oldin alohida toza joyga o'tkazing.\n" +
      "• Tug'ish cho'zilsa (sigirda 6 soatdan ortiq) — zudlik bilan veterinar chaqiring.\n" +
      "• Yangi tug'ilgan buzoqqa 1 soat ichida og'iz suti (molozivo) berilishi shart.\n\n" +
      "Tug'ishdan keyin onaga iliq suv va yengil ozuqa bering.",
  },
  {
    keywords: ['gijja', 'parazit', 'qurt', 'gelmint', 'kana'],
    answer:
      "Parazitlarga qarshi kurash:\n\n" +
      "1. Yiliga kamida 2 marta (bahor va kuz) gijjaga qarshi dori bering.\n" +
      "2. Yaylov va katakni toza saqlang — najas orqali qayta yuqadi.\n" +
      "3. Kanalar kasallik tarqatadi — bahorda maxsus eritma bilan ishlov bering.\n" +
      "4. Dori turini va dozasini veterinar bilan aniqlang.\n\n" +
      "Belgilari: ozish, xira jun, ishtaha buzilishi, kamqonlik.",
  },
];

const SUGGESTIONS = [
  'Sigir emlash jadvali qanday?',
  'Qoramol narxi qancha?',
  'Mastit qanday davolanadi?',
  'Sut miqdorini qanday oshiraman?',
  'Ich ketishda nima qilaman?',
  'Quyon boqish qoidalari',
];

function pickSuggestions(count = 4) {
  return SUGGESTIONS.slice(0, count);
}

const GREETINGS = ['salom', 'assalom', 'assalomu', 'salam', 'hello', 'hi', 'hey', 'hayrli'];

function isGreetingOnly(message) {
  const words = message.toLowerCase().replace(/[.,!?]/g, ' ').trim().split(/\s+/);
  if (words.length > 4) return false;
  return words.some((w) => GREETINGS.includes(w));
}

const GREETING_REPLY =
  "Assalomu alaykum! Men AgroZot AI yordamchisiman.\n\n" +
  "Menga istalgan savolingizni berishingiz mumkin — chorva salomatligi, ozuqlantirish, " +
  "emlash, bozor narxlari va boshqa mavzularda yordam beraman. Hayvon rasmini yuborsangiz, " +
  "taxminiy vazni va narxini ham baholab beraman.";

function findKnowledgeAnswer(message) {
  const text = ` ${message.toLowerCase()} `;
  for (const item of KNOWLEDGE) {
    if (item.keywords.some((k) => text.includes(k))) return item.answer;
  }
  if (isGreetingOnly(message)) return GREETING_REPLY;
  return null;
}

/** Bozordagi kategoriya bo'yicha narx statistikasi (bazadan) */
async function getMarketStats() {
  const groups = await prisma.animal.groupBy({
    by: ['category'],
    where: { status: 'ACTIVE' },
    _avg: { price: true },
    _min: { price: true },
    _max: { price: true },
    _count: true,
  });

  return groups.map((g) => ({
    category: g.category,
    categoryName: CATEGORY_NAMES[g.category] || g.category,
    count: g._count,
    avg: Math.round(g._avg.price || 0),
    min: Math.round(g._min.price || 0),
    max: Math.round(g._max.price || 0),
  }));
}

const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Narx so'ralganda bazadagi statistikadan javob tayyorlash */
async function priceAnswer(message) {
  const text = message.toLowerCase();
  const wantsPrice = ['narx', 'qancha', 'necha pul', 'baho'].some((k) => text.includes(k));
  if (!wantsPrice) return null;

  const categoryHints = {
    cattle: ['qoramol', 'sigir', 'buqa', 'buzoq', "g'unajin", 'novvos'],
    sheep: ["qo'y", 'echki', "qo'chqor", "qo'zi"],
    rabbit: ['quyon'],
    poultry: ['tovuq', 'parranda', "jo'ja", 'kurka'],
    horse: ['ot ', 'otlar', 'otning'],
    feed: ['yem', 'xashak', 'beda', 'silos'],
    equipment: ['jihoz', 'apparat', 'inkubator'],
  };

  let category = null;
  for (const [cat, hints] of Object.entries(categoryHints)) {
    if (hints.some((h) => text.includes(h))) {
      category = cat;
      break;
    }
  }

  const where = { status: 'ACTIVE' };
  if (category) where.category = category;

  const stats = await prisma.animal.aggregate({
    where,
    _avg: { price: true },
    _min: { price: true },
    _max: { price: true },
    _count: true,
  });

  if (!stats._count) {
    return "Hozircha bozorda bu turdagi e'lonlar yo'q, shuning uchun narx statistikasini keltira olmayman.";
  }

  const catName = category ? CATEGORY_NAMES[category] : "Barcha e'lonlar";

  return (
    `AgroZot bozoridagi joriy narxlar (${catName}, ${stats._count} ta e'lon asosida):\n\n` +
    `• O'rtacha narx: ${fmt(stats._avg.price)} so'm\n` +
    `• Eng arzon: ${fmt(stats._min.price)} so'm\n` +
    `• Eng qimmat: ${fmt(stats._max.price)} so'm\n\n` +
    `Narxlar sotuvchilar e'lonlaridan olingan. Bozorni bosh sahifadagi filtrlar orqali o'zingiz ham o'rganishingiz mumkin.`
  );
}

const FALLBACK_REPLY =
  "Savolingiz bo'yicha umumiy tavsiya: hayvon holatini kuzatib boring — ishtaha, harorat va faollik asosiy ko'rsatkichlardir. " +
  "Kasallik belgilari sezilsa, hududingizdagi veterinariya xizmatiga murojaat qilganingiz ma'qul.\n\n" +
  "Menga aniqroq savol bering — quyidagi mavzulardan birini tanlashingiz mumkin:";

module.exports = {
  CATEGORY_NAMES,
  findKnowledgeAnswer,
  priceAnswer,
  getMarketStats,
  pickSuggestions,
  FALLBACK_REPLY,
};
