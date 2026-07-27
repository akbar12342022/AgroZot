// AI tarif (freemium) tizimi uchun end-to-end test.
// Tariflar: STANDARD (3 bepul savol) | PRO (matn cheksiz, 5 rasm/kun) | PREMIUM (cheksiz).
// Ishga tushirish: backend papkasida `node scripts/test-ai-plans.js` (server yoniq bo'lsin).
// Eslatma: ro'yxatdan o'tish endi Firebase talab qiladi, shuning uchun test
// foydalanuvchisi to'g'ridan-to'g'ri bazada yaratilib, JWT qo'lda imzolanadi.
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3000';
const ADMIN_KEY = process.env.ADMIN_KEY;
const TEST_PHONE = '+998990007766';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}  ${extra}`);
  }
}

async function j(method, path, { body, token, adminKey } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (adminKey) headers['x-admin-key'] = adminKey;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function tashkentToday() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

(async () => {
  // Avvalgi test foydalanuvchisi qolib ketgan bo'lsa — tozalash
  await prisma.user.deleteMany({ where: { phone: TEST_PHONE } });

  // 1. Foydalanuvchi yaratish — sxema bo'yicha default STANDARD va 0 savol
  const user = await prisma.user.create({
    data: { firstName: 'Tarif Test', phone: TEST_PHONE },
  });
  const uid = user.id;
  const token = jwt.sign({ userId: uid }, process.env.JWT_SECRET, { expiresIn: '1h' });
  check("yangi user aiPlan 'STANDARD'", user.aiPlan === 'STANDARD', user.aiPlan);
  check('yangi user aiUsageCount 0', user.aiUsageCount === 0);

  // 2. /access — STANDARD: 3 ta bepul savol
  const acc1 = await j('GET', '/api/ai/access', { token });
  check(
    'access STANDARD: 3 savol qoldi',
    acc1.data.plan === 'STANDARD' && acc1.data.remainingQuestions === 3 && !!acc1.data.contact,
    JSON.stringify(acc1.data)
  );

  // 3. STANDARD chat ishlaydi (bepul savollar doirasida)
  const chat1 = await j('POST', '/api/ai/chat', {
    token,
    body: { message: "Bir so'z bilan javob ber: sigir sut beradimi?" },
  });
  check('standard chat 200', chat1.status === 200 && !!chat1.data.reply, JSON.stringify(chat1.data).slice(0, 160));
  if (chat1.data.engine === 'claude') {
    check('standard (claude): 2 savol qoldi', chat1.data.remainingQuestions === 2, `got ${chat1.data.remainingQuestions}`);
  } else {
    check('standard (kb): savol sarflanmadi (3)', chat1.data.remainingQuestions === 3, `got ${chat1.data.remainingQuestions}`);
  }

  // 4. 3 savol tugagach — 403 LIMIT_REACHED
  await prisma.user.update({ where: { id: uid }, data: { aiUsageCount: 3 } });
  const chat2 = await j('POST', '/api/ai/chat', { token, body: { message: 'yana savol' } });
  check(
    'limit tugadi: 403 LIMIT_REACHED + success:false',
    chat2.status === 403 && chat2.data.code === 'LIMIT_REACHED' && chat2.data.success === false,
    JSON.stringify(chat2.data)
  );

  // 5. Admin autentifikatsiyasi va tarif qiymatlari
  const bad = await j('GET', '/api/admin/ping', { adminKey: 'notogri-kalit' });
  check('wrong admin key 401', bad.status === 401);
  const ping = await j('GET', '/api/admin/ping', { adminKey: ADMIN_KEY });
  check('admin ping ok', ping.status === 200 && ping.data.ok === true);

  const badPlan = await j('PUT', `/api/admin/users/${uid}/plan`, {
    adminKey: ADMIN_KEY,
    body: { plan: 'vip' },
  });
  check("invalid plan 'vip' 400", badPlan.status === 400);
  const legacyPlan = await j('PUT', `/api/admin/users/${uid}/plan`, {
    adminKey: ADMIN_KEY,
    body: { plan: 'pro' },
  });
  check("eski qiymat 'pro' endi 400", legacyPlan.status === 400);

  // 6. PRO: savol limiti yo'q (aiUsageCount=3 bo'lsa ham ishlaydi), 5 rasm/kun
  const setPro = await j('PUT', `/api/admin/users/${uid}/plan`, {
    adminKey: ADMIN_KEY,
    body: { plan: 'PRO' },
  });
  check("admin set 'PRO'", setPro.status === 200 && setPro.data.user?.aiPlan === 'PRO');

  const acc2 = await j('GET', '/api/ai/access', { token });
  check(
    'access PRO: 5/5 rasm, savol cheksiz',
    acc2.data.plan === 'PRO' && acc2.data.remainingImages === 5 && acc2.data.remainingQuestions === null,
    JSON.stringify(acc2.data)
  );

  const chat3 = await j('POST', '/api/ai/chat', {
    token,
    body: { message: "Bir og'iz qisqa javob ber: qo'y kuniga taxminan necha kg quruq yem yeydi?" },
  });
  check('pro text chat 200 (limitdan keyin ham)', chat3.status === 200 && !!chat3.data.reply, JSON.stringify(chat3.data).slice(0, 160));
  check('pro text: rasm limiti sarflanmadi (5)', chat3.data.remainingImages === 5, `got ${chat3.data.remainingImages}`);

  // 7. PRO: rasm tahlili limitni sarflaydi (faqat haqiqiy Claude tahlilida)
  const img = '/uploads/1785064649510-346667665.jpg';
  const chat4 = await j('POST', '/api/ai/chat', {
    token,
    body: { message: 'Bu qanday hayvon? Juda qisqa javob ber.', imageUrl: img },
  });
  check('pro image chat 200', chat4.status === 200 && !!chat4.data.reply, JSON.stringify(chat4.data).slice(0, 160));
  if (chat4.data.engine === 'claude') {
    check('pro image (claude): 4 ta qoldi', chat4.data.remainingImages === 4, `got ${chat4.data.remainingImages}`);
  } else {
    check('pro image (kb): limit sarflanmadi (5)', chat4.data.remainingImages === 5, `got ${chat4.data.remainingImages}`);
  }

  // 8. Rasm limiti tugaganda rasm 403, matn esa ishlayveradi
  await prisma.user.update({
    where: { id: uid },
    data: { aiImagesUsed: 5, aiImagesDate: tashkentToday() },
  });
  const chat5 = await j('POST', '/api/ai/chat', { token, body: { message: 'yana tahlil qil', imageUrl: img } });
  check('image limit 403 IMAGE_LIMIT', chat5.status === 403 && chat5.data.code === 'IMAGE_LIMIT', JSON.stringify(chat5.data));

  const chat6 = await j('POST', '/api/ai/chat', {
    token,
    body: { message: "Bir so'z bilan javob ber: ot necha yil yashaydi?" },
  });
  check('pro text limitda ham 200', chat6.status === 200 && !!chat6.data.reply);

  // 9. PREMIUM — hammasi cheksiz
  await j('PUT', `/api/admin/users/${uid}/plan`, { adminKey: ADMIN_KEY, body: { plan: 'PREMIUM' } });
  const acc3 = await j('GET', '/api/ai/access', { token });
  check(
    'premium: cheksiz (limitlar null)',
    acc3.data.plan === 'PREMIUM' &&
      acc3.data.remainingImages === null &&
      acc3.data.imageLimit === null &&
      acc3.data.remainingQuestions === null,
    JSON.stringify(acc3.data)
  );

  // 10. Eski qiymatlar bazada qolgan bo'lsa ham normallashtiriladi (himoya qatlami)
  await prisma.user.update({ where: { id: uid }, data: { aiPlan: 'plus' } });
  const acc4 = await j('GET', '/api/ai/access', { token });
  check("eski 'plus' → PREMIUM normalizatsiya", acc4.data.plan === 'PREMIUM', JSON.stringify(acc4.data));

  // 11. Kun almashganda rasm hisoblagichi nollanadi
  await prisma.user.update({
    where: { id: uid },
    data: { aiPlan: 'PRO', aiImagesUsed: 5, aiImagesDate: '2020-01-01' },
  });
  const acc5 = await j('GET', '/api/ai/access', { token });
  check('kunlik limit nollandi (5/5)', acc5.data.remainingImages === 5, JSON.stringify(acc5.data));

  // 12. Admin ro'yxati — yangi qiymatlar va savol hisoblagichi
  const list = await j('GET', `/api/admin/users?q=${encodeURIComponent(TEST_PHONE)}`, { adminKey: ADMIN_KEY });
  const row = (list.data.data || []).find((u) => u.id === uid);
  check(
    "admin ro'yxatida to'g'ri ko'rinadi",
    !!row && row.aiPlan === 'PRO' && row.aiImagesToday === 0 && row.aiImageLimit === 5 && typeof row.aiUsageCount === 'number',
    JSON.stringify(row)
  );

  // Tozalash
  await prisma.user.delete({ where: { id: uid } });

  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => {
  console.error('Test crash:', e);
  await prisma.user.deleteMany({ where: { phone: TEST_PHONE } }).catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
