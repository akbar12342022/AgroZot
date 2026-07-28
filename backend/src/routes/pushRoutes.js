// Web Push obunalari — frontend Service Worker orqali obuna bo'ladi.
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const { vapidPublicKey } = require('../utils/push');

const router = express.Router();

/** GET /vapid — ochiq VAPID kaliti (frontend obuna uchun ishlatadi) */
router.get('/vapid', (req, res) => {
  res.json({ publicKey: vapidPublicKey() });
});

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

/** POST /subscribe — qurilma push obunasini saqlash (yoki yangilash) */
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = subSchema.parse(req.body);
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Obuna ma'lumoti noto'g'ri" });
    }
    console.error('Push obunasini saqlashda xatolik:', error);
    res.status(500).json({ error: 'Obuna saqlanmadi' });
  }
});

/** POST /unsubscribe — obunani o'chirish (endpoint bo'yicha) */
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const endpoint = req.body?.endpoint;
    if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Obunani o'chirishda xatolik" });
  }
});

module.exports = router;
