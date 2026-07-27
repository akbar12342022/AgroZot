// AI tarif tizimi uchun end-to-end test.
// Ishga tushirish: backend papkasida `node scripts/test-ai-plans.js` (server yoniq bo'lsin).
require('dotenv').config();
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

  // 1. Ro'yxatdan o'tish — yangi foydalanuvchi 'none' bilan boshlaydi
  const reg = await j('POST', '/api/auth/register', {
    body: { name: 'Tarif Test', phone: TEST_PHONE },
  });
  check('register 201', reg.status === 201, JSON.stringify(reg.data));
  check("register aiPlan 'none'", reg.data.user?.aiPlan === 'none');
  const token = reg.data.token;
  const uid = reg.data.user?.id;

  // 2. /access — tarif yo'q
  const acc1 = await j('GET', '/api/ai/access', { token });
  check("access plan 'none' + contact", acc1.data.plan === 'none' && !!acc1.data.contact);

  // 3. Tarifsiz chat bloklanadi
  const chat1 = await j('POST', '/api/ai/chat', { token, body: { message: 'salom' } });
  check('chat 403 NO_PLAN', chat1.status === 403 && chat1.data.code === 'NO_PLAN', JSON.stringify(chat1.data));

  // 4. Admin autentifikatsiyasi
  const bad = await j('GET', '/api/admin/ping', { adminKey: 'notogri-kalit' });
  check("wrong admin key 401", bad.status === 401);
  const ping = await j('GET', '/api/admin/ping', { adminKey: ADMIN_KEY });
  check('admin ping ok', ping.status === 200 && ping.data.ok === true);

  const badPlan = await j('PUT', `/api/admin/users/${uid}/plan`, {
    adminKey: ADMIN_KEY,
    body: { plan: 'vip' },
  });
  check("invalid plan 'vip' 400", badPlan.status === 400);

  // 5. Pro tarifga o'tkazish
  const setPro = await j('PUT', `/api/admin/users/${uid}/plan`, {
    adminKey: ADMIN_KEY,
    body: { plan: 'pro' },
  });
  check("admin set 'pro'", setPro.status === 200 && setPro.data.user?.aiPlan === 'pro');

  const acc2 = await j('GET', '/api/ai/access', { token });
  check('access pro: 5/5 qoldi', acc2.data.plan === 'pro' && acc2.data.remainingImages === 5, JSON.stringify(acc2.data));

  // 6. Pro: matnli chat ishlaydi (limit sarflanmaydi)
  const chat2 = await j('POST', '/api/ai/chat', {
    token,
    body: { message: "Bir og'iz qisqa javob ber: qo'y kuniga taxminan necha kg quruq yem yeydi?" },
  });
  check('pro text chat 200', chat2.status === 200 && !!chat2.data.reply, JSON.stringify(chat2.data).slice(0, 160));
  check('pro text: limit sarflanmadi (5)', chat2.data.remainingImages === 5, `got ${chat2.data.remainingImages}`);

  // 7. Pro: rasm tahlili limitni sarflaydi (faqat haqiqiy Claude tahlilida;
  //    KB rejimida tahlil bo'lmaydi — limit ham sarflanmasligi kerak)
  const img = '/uploads/1785064649510-346667665.jpg';
  const chat3 = await j('POST', '/api/ai/chat', {
    token,
    body: { message: 'Bu qanday hayvon? Juda qisqa javob ber.', imageUrl: img },
  });
  check('pro image chat 200', chat3.status === 200 && !!chat3.data.reply, JSON.stringify(chat3.data).slice(0, 160));
  if (chat3.data.engine === 'claude') {
    check('pro image (claude): 4 ta qoldi', chat3.data.remainingImages === 4, `got ${chat3.data.remainingImages}`);
  } else {
    check('pro image (kb): limit sarflanmadi (5)', chat3.data.remainingImages === 5, `got ${chat3.data.remainingImages}`);
  }

  // 8. Limit tugaganda rasm 403, matn esa ishlayveradi
  await prisma.user.update({
    where: { id: uid },
    data: { aiImagesUsed: 5, aiImagesDate: tashkentToday() },
  });
  const chat4 = await j('POST', '/api/ai/chat', { token, body: { message: 'yana tahlil qil', imageUrl: img } });
  check('image limit 403 IMAGE_LIMIT', chat4.status === 403 && chat4.data.code === 'IMAGE_LIMIT', JSON.stringify(chat4.data));

  const chat5 = await j('POST', '/api/ai/chat', {
    token,
    body: { message: "Bir so'z bilan javob ber: sigir sut beradimi?" },
  });
  check('pro text limitda ham 200', chat5.status === 200 && !!chat5.data.reply);

  // 9. Plus — hammasi cheksiz
  await j('PUT', `/api/admin/users/${uid}/plan`, { adminKey: ADMIN_KEY, body: { plan: 'plus' } });
  const acc3 = await j('GET', '/api/ai/access', { token });
  check(
    'plus: cheksiz (limit null)',
    acc3.data.plan === 'plus' && acc3.data.remainingImages === null && acc3.data.imageLimit === null,
    JSON.stringify(acc3.data)
  );

  // 10. Kun almashganda hisoblagich nollanadi
  await prisma.user.update({
    where: { id: uid },
    data: { aiPlan: 'pro', aiImagesUsed: 5, aiImagesDate: '2020-01-01' },
  });
  const acc4 = await j('GET', '/api/ai/access', { token });
  check('kunlik limit nollandi (5/5)', acc4.data.remainingImages === 5, JSON.stringify(acc4.data));

  // 11. Admin ro'yxati
  const list = await j('GET', `/api/admin/users?q=${encodeURIComponent(TEST_PHONE)}`, { adminKey: ADMIN_KEY });
  const row = (list.data.data || []).find((u) => u.id === uid);
  check(
    "admin ro'yxatida to'g'ri ko'rinadi",
    !!row && row.aiPlan === 'pro' && row.aiImagesToday === 0 && row.aiImageLimit === 5,
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
