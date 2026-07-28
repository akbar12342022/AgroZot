// Web Push (VAPID) yordamida bildirishnoma yuborish — Firebase o'rniga.
// Mijoz saytda bo'lmasa ham, brauzer Service Worker orqali push oladi.
const webpush = require('web-push');
const prisma = require('./prisma');

let configured = null; // null — hali tekshirilmagan, true/false — natija

/** VAPID kalitlarini bir marta sozlash. Kalitlar bo'lmasa push o'chirilgan bo'ladi. */
function ensureConfigured() {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    console.warn('[push] VAPID kalitlari yo\'q — bildirishnomalar o\'chirilgan (.env ni tekshiring).');
    configured = false;
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@agrozot.uz', pub, priv);
  configured = true;
  return true;
}

/** Frontendga beriladigan ochiq VAPID kaliti */
function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Foydalanuvchining barcha qurilmalariga push yuborish (best-effort).
 * payload: { title, body, url?, tag? }. Eskirgan obunalar avtomatik o'chiriladi.
 */
async function sendPushToUser(userId, payload) {
  if (!ensureConfigured() || !userId) return;
  let subs = [];
  try {
    subs = await prisma.pushSubscription.findMany({ where: { userId } });
  } catch (err) {
    console.error('[push] Obunalarni olishda xatolik:', err.message);
    return;
  }
  if (!subs.length) return;

  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data
        );
      } catch (err) {
        // 404/410 — obuna bekor qilingan yoki eskirgan, bazadan o'chiramiz
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error('[push] Yuborishda xatolik:', err.statusCode || err.message);
        }
      }
    })
  );
}

module.exports = { sendPushToUser, vapidPublicKey, ensureConfigured };
