import { aiChat } from '../api/animals';
import { formatPrice } from '../utils/helpers';

/**
 * Chat javobi. Avval haqiqiy backend AI (aiChat) sinaladi; ulanmasa yoki
 * xato bo'lsa — mavzuga mos mahalliy javob qaytadi (demo va offline uchun ishonchli).
 */
export async function getChatReply(message, history = []) {
  try {
    const data = await aiChat({ message, history });
    if (data && data.reply) return data.reply;
  } catch {
    /* backend yo'q — pastdagi mahalliy javob ishlatiladi */
  }
  return localReply(message);
}

function localReply(msg = '') {
  const m = msg.toLowerCase();
  if (/salom|assalom|hello|hi\b/.test(m))
    return "Va alaykum assalom! Chorvachilik bo'yicha nima yordam bera olaman — narx, sog'liq yoki zot tanlash?";
  if (/narx|qancha|pul|baho/.test(m))
    return "Narx zot, yosh, vazn va hududga bog'liq. Menga hayvon turi va vaznini ayting — men bozor bo'yicha taxminiy oraliqni chiqarib beraman.";
  if (/kasal|davola|emlash|mastit|veterinar|sog'liq|salomat/.test(m))
    return "Bunday holatda avval belgilarni kuzating (harorat, ishtaha, sut miqdori). Aniq tashxis uchun veterinar shart. Umumiy profilaktika — o'z vaqtida emlash va toza saqlash.";
  if (/sut|sog'in|milk/.test(m))
    return "Sut miqdori ratsion (beda, omixta yem), suv va sog'in rejimiga bog'liq. Kunlik 2–3 marta bir vaqtda sog'ish va sifatli yem sutni sezilarli oshiradi.";
  if (/zot|breed|golshtin|hisori|qorabayir/.test(m))
    return "Zot tanlash maqsadga bog'liq: sut uchun Golshtin/Simmental, go'sht uchun Angus/Gereford, qo'ylarda esa Hisori bo'rdoqiga zo'r. Sizning maqsadingiz — sut, go'sht yoki nasl?";
  if (/yem|beda|ratsion|oziq/.test(m))
    return "Muvozanatli ratsion: dag'al yem (beda, somon) + omixta yem + mineral qo'shimchalar. Vazn ortishi uchun energiyaga boy yem, sut uchun oqsilga boy beda muhim.";
  return "Yaxshi savol! Men chorva sog'lig'i, ratsion, zot tanlash va bozor narxlari bo'yicha yordam beraman. Savolingizni biroz aniqroq yozsangiz, aniqroq maslahat beraman.";
}

/**
 * E'lon bo'yicha kontekstual tahlil — DetailModal ichida ishlatiladi.
 * listing ma'lumotlaridan (narx, zot, vazn, yosh, specs) foydali xulosa quradi.
 * Natija: bo'limlar massivi [{ icon, title, body }].
 */
export function buildAnalysis(listing) {
  const price = Number(listing.price) || 0;
  const specs = listing.specs || {};
  const findSpec = (re) => {
    const hit = Object.entries(specs).find(([k]) => re.test(k));
    return hit ? hit[1] : undefined;
  };
  const breed = specs['Zoti'] || findSpec(/zot/i) || listing.breed;
  const weight = specs['Vazni'] || findSpec(/vazn/i) || listing.weight;
  const age = specs['Yoshi'] || findSpec(/yosh/i) || listing.age;
  const vaccinated = specs['Emlangan'] === 'Ha' || listing.vaccinated === true;

  const sections = [];

  // 1) Narx bahosi
  let priceNote = `So'ralayotgan narx — ${formatPrice(price)}.`;
  const kg = weight && parseInt(String(weight).replace(/\D/g, ''), 10);
  if (kg && price) {
    const perKg = Math.round(price / kg);
    priceNote += ` Bu ~${formatPrice(perKg)}/kg ga to'g'ri keladi — bozordagi o'rtacha oraliqda deb baholash mumkin.`;
  } else {
    priceNote += ' Vazn ko\'rsatilsa, kilogrammiga narxni aniqroq baholagan bo\'lardim.';
  }
  sections.push({ icon: 'price', title: 'Narx bahosi', body: priceNote });

  // 2) Ijobiy tomonlari
  const plus = [];
  if (breed) plus.push(`${breed} zoti — bozorda talabgir`);
  if (vaccinated) plus.push('emlangan — sog\'liq xavfi past');
  if (age) plus.push(`yoshi (${age}) ko'rsatilgan — shaffof`);
  if (listing.sellerVerified) plus.push('sotuvchi tasdiqlangan');
  sections.push({
    icon: 'plus',
    title: 'Ijobiy tomonlari',
    body: plus.length ? plus.join('; ') + '.' : "E'londa asosiy ma'lumotlar keltirilgan.",
  });

  // 3) E'tibor bering
  const watch = [];
  if (!vaccinated) watch.push('emlash holati aniq emas — so\'rab oling');
  if (!weight) watch.push('aniq vazn ko\'rsatilmagan');
  if (!breed) watch.push('zot ko\'rsatilmagan');
  watch.push('ko\'rganda tuyoq, ko\'z va ishtahasini tekshiring');
  sections.push({ icon: 'watch', title: "E'tibor bering", body: watch.join('; ') + '.' });

  // 4) Tavsiya
  sections.push({
    icon: 'tip',
    title: 'Tavsiya',
    body:
      'To\'lovni hayvonni o\'zingiz ko\'rib, veterinar ko\'rigidan so\'ng amalga oshiring. ' +
      'Narxni jonli muloqotda 5–10% kelishishga urinib ko\'ring.',
  });

  return sections;
}
