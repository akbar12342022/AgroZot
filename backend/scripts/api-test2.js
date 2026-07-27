// AgroZot v2 backend to'liq test skripti (JWT auth, chat, AI, atributlar)
// Ishga tushirish: node scripts/api-test2.js
// socket.io-client frontendda o'rnatilgan nusxadan olinadi (yangi o'rnatish talab qilinmaydi)
const { io } = require('../../frontend/node_modules/socket.io-client');

const BASE = 'http://localhost:3000';
let pass = 0,
  fail = 0;

function ok(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name} ${extra}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

async function j(path, { method = 'GET', body, token, form } = {}) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, body: data };
}

(async () => {
  console.log("=== 1. Ro'yxatdan o'tish (auth) ===");
  let r = await j('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test Sardor', phone: '+998 93 111 22 33' },
  });
  const token = r.body?.token;
  ok('POST /api/auth/register', r.status === 201 && !!token, `(user id=${r.body?.user?.id})`);
  ok('Telefon normalizatsiya', r.body?.user?.phone === '+998931112233');

  r = await j('/api/auth/register', {
    method: 'POST',
    body: { name: 'Sardor Yangi', phone: '998931112233' },
  });
  ok("Qayta ro'yxat = kirish (bir xil hisob)", r.status === 201 && r.body?.user?.phone === '+998931112233');

  r = await j('/api/auth/register', { method: 'POST', body: { name: 'A', phone: '123' } });
  ok("400 noto'g'ri ma'lumotlar", r.status === 400);

  r = await j('/api/users/me');
  ok('401 tokensiz /users/me', r.status === 401);

  r = await j('/api/users/me', { token });
  ok('GET /api/users/me (JWT)', r.status === 200 && r.body?.firstName === 'Sardor Yangi');

  console.log("=== 2. E'lonlar (district + attributes) ===");
  r = await j('/api/animals?limit=5');
  ok('GET /api/animals ochiq', r.status === 200 && Array.isArray(r.body.data));

  r = await j('/api/animals', {
    method: 'POST',
    token,
    body: {
      title: "TEST Hisori qo'ylar suruvi",
      category: 'sheep',
      price: 3300000,
      region: 'Jizzax',
      district: 'Zomin',
      breed: 'Hisori',
      age: '1 yosh',
      vaccinated: true,
      attributes: { kind: "Qo'y", count: 12 },
      images: [],
    },
  });
  const newId = r.body?.id;
  ok('POST e\'lon (district+attributes)', r.status === 201 && !!newId, `(id=${newId})`);
  ok('attributes saqlandi', r.body?.attributes?.count === 12 && r.body?.district === 'Zomin');

  r = await j(`/api/animals/${newId}`);
  ok('GET bitta e\'lon', r.status === 200 && r.body?.attributes?.kind === "Qo'y");

  r = await j('/api/animals?district=Zomin');
  ok('district bo\'yicha filtr', r.status === 200 && r.body.data.some((a) => a.id === newId));

  r = await j(`/api/animals/${newId}`, { method: 'PUT', token, body: { price: 3500000 } });
  ok('PUT tahrirlash', r.status === 200 && r.body?.price === 3500000);

  // Boshqa foydalanuvchi e'lonini o'zgartirish taqiqlanishi
  const other = await j('/api/auth/register', {
    method: 'POST',
    body: { name: 'Begona User', phone: '+998 94 555 66 77' },
  });
  r = await j(`/api/animals/${newId}`, { method: 'PUT', token: other.body?.token, body: { price: 1 } });
  ok("403 begona e'lon himoyasi", r.status === 403);

  console.log('=== 3. Media yuklash ===');
  const pngBytes = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcffff3f030005fe02fea72d55c30000000049454e44ae426082',
    'hex'
  );
  const form = new FormData();
  form.append('media', new Blob([pngBytes], { type: 'image/png' }), 'test.png');
  r = await j('/api/upload/media', { method: 'POST', token, form });
  const mediaUrl = r.body?.url;
  ok('POST /api/upload/media (rasm)', r.status === 201 && r.body?.mediaType === 'IMAGE', `(${mediaUrl})`);

  const audioForm = new FormData();
  audioForm.append('media', new Blob([Buffer.from('webm-fake-data-000000')], { type: 'audio/webm' }), 'voice.webm');
  r = await j('/api/upload/media', { method: 'POST', token, form: audioForm });
  ok('POST /api/upload/media (audio)', r.status === 201 && r.body?.mediaType === 'AUDIO');

  console.log('=== 4. Jonli chat (Socket.IO) ===');
  const socketOk = await new Promise((resolve) => {
    const socket = io(BASE, { auth: { token }, transports: ['websocket'] });
    const timeout = setTimeout(() => {
      socket.disconnect();
      resolve({ error: 'timeout' });
    }, 8000);

    socket.on('connect', () => {
      socket.emit('chat:send', { type: 'TEXT', content: 'Salom chorvadorlar! (test)' }, (res) => {
        if (res?.error) {
          clearTimeout(timeout);
          socket.disconnect();
          resolve({ error: res.error });
        }
      });
    });
    socket.on('chat:new', (msg) => {
      clearTimeout(timeout);
      socket.disconnect();
      resolve({ msg });
    });
    socket.on('connect_error', (e) => {
      clearTimeout(timeout);
      resolve({ error: e.message });
    });
  });
  ok('Socket ulanish + xabar yuborish + broadcast', !!socketOk.msg, socketOk.error ? `(${socketOk.error})` : `(id=${socketOk.msg?.id})`);
  ok('Xabar user bilan keladi', socketOk.msg?.user?.firstName === 'Sardor Yangi');

  const noAuthSocket = await new Promise((resolve) => {
    const s = io(BASE, { auth: {}, transports: ['websocket'] });
    const t = setTimeout(() => {
      s.disconnect();
      resolve('timeout');
    }, 5000);
    s.on('connect', () => {
      clearTimeout(t);
      s.disconnect();
      resolve('connected');
    });
    s.on('connect_error', () => {
      clearTimeout(t);
      resolve('rejected');
    });
  });
  ok('Tokensiz socket rad etiladi', noAuthSocket === 'rejected');

  r = await j('/api/chat/messages', { token });
  ok('GET /api/chat/messages', r.status === 200 && r.body.data.some((m) => m.content?.includes('test')));

  // Media xabar yuborish (socket orqali)
  const mediaMsg = await new Promise((resolve) => {
    const socket = io(BASE, { auth: { token }, transports: ['websocket'] });
    const timeout = setTimeout(() => {
      socket.disconnect();
      resolve(null);
    }, 8000);
    socket.on('connect', () => {
      socket.emit('chat:send', { type: 'IMAGE', mediaUrl }, (res) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(res);
      });
    });
  });
  ok('Rasmli xabar yuborildi', mediaMsg?.ok === true);

  console.log('=== 5. AI yordamchi ===');
  r = await j('/api/ai/status');
  ok('GET /api/ai/status', r.status === 200 && ['claude', 'kb'].includes(r.body?.engine), `(engine=${r.body?.engine})`);

  r = await j('/api/ai/chat', { method: 'POST', token, body: { message: 'Salom' } });
  ok('AI salomlashuv', r.status === 200 && r.body.reply.length > 10);

  r = await j('/api/ai/chat', { method: 'POST', token, body: { message: "Qo'y narxi qancha?" } });
  ok('AI narx statistikasi', r.status === 200 && r.body.reply.includes("O'rtacha"));

  r = await j('/api/ai/chat', {
    method: 'POST',
    token,
    body: { message: 'Bu hayvon qancha turadi?', imageUrl: mediaUrl },
  });
  ok('AI rasm bilan (javob qaytaradi)', r.status === 200 && r.body.reply.length > 10, `(engine=${r.body?.engine})`);

  r = await j('/api/ai/chat', { method: 'POST', body: { message: 'salom' } });
  ok('401 tokensiz AI', r.status === 401);

  console.log('=== 6. Tozalash ===');
  r = await j(`/api/animals/${newId}`, { method: 'DELETE', token });
  ok("Test e'lonini o'chirish", r.status === 200);

  console.log('\n========================================');
  console.log(`NATIJA: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error('Test skript xatosi:', e);
  process.exit(2);
});
