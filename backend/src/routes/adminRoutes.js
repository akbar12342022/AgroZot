// Admin panel API — foydalanuvchilar ro'yxati va AI tariflarini boshqarish.
// Himoya: har bir so'rovda `x-admin-key` sarlavhasi .env dagi ADMIN_KEY bilan solishtiriladi.
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { getSupportUser } = require('../utils/support');
const { sendPushToUser } = require('../utils/push');

const router = express.Router();

const AI_PLANS = ['STANDARD', 'PRO', 'PREMIUM'];
const PRO_DAILY_IMAGE_LIMIT = 5;

const CHAT_USER_SELECT = { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true, phone: true };

/** Suhbat juftligini bir xil tartibga keltirish (userAId < userBId) */
function orderPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/** Toshkent (UTC+5) bo'yicha bugungi sana */
function tashkentToday() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** ADMIN_KEY tekshiruvi */
function requireAdmin(req, res, next) {
  const configured = process.env.ADMIN_KEY;
  if (!configured) {
    return res.status(503).json({ error: 'Admin panel sozlanmagan (.env ga ADMIN_KEY qo\'shing)' });
  }
  if (req.headers['x-admin-key'] !== configured) {
    return res.status(401).json({ error: "Admin kaliti noto'g'ri" });
  }
  next();
}

router.use(requireAdmin);

/** GET /ping — kalit to'g'riligini tekshirish (login ekrani uchun) */
router.get('/ping', (req, res) => {
  res.json({ ok: true });
});

/**
 * GET /users?q=...
 * Foydalanuvchilar ro'yxati (ism/telefon bo'yicha qidiruv bilan).
 */
router.get('/users', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where = q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        phone: true,
        aiPlan: true,
        aiUsageCount: true,
        isVerified: true,
        aiImagesUsed: true,
        aiImagesDate: true,
        surveyRole: true,
        surveyInterests: true,
        surveySource: true,
        createdAt: true,
        _count: { select: { animals: { where: { status: 'ACTIVE' } } } },
      },
    });

    const today = tashkentToday();
    res.json({
      data: users.map(({ _count, aiImagesUsed, aiImagesDate, ...u }) => ({
        ...u,
        activeAnimals: _count.animals,
        // Bugungi rasm tahlillari (kun almashgan bo'lsa 0)
        aiImagesToday: aiImagesDate === today ? aiImagesUsed : 0,
        aiImageLimit: u.aiPlan === 'PRO' ? PRO_DAILY_IMAGE_LIMIT : null,
      })),
      total: users.length,
    });
  } catch (error) {
    console.error('Admin: foydalanuvchilarni yuklashda xatolik:', error);
    res.status(500).json({ error: 'Foydalanuvchilarni yuklashda xatolik yuz berdi' });
  }
});

/**
 * PUT /users/:id/plan
 * Foydalanuvchi AI tarifini o'zgartirish. Body: { plan: 'STANDARD' | 'PRO' | 'PREMIUM' }
 */
router.put('/users/:id/plan', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Noto'g'ri ID format" });

    const plan = req.body?.plan;
    if (!AI_PLANS.includes(plan)) {
      return res
        .status(400)
        .json({ error: "Tarif faqat 'STANDARD', 'PRO' yoki 'PREMIUM' bo'lishi mumkin" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { aiPlan: plan },
      select: { id: true, firstName: true, phone: true, aiPlan: true },
    });

    res.json({ ok: true, user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }
    console.error('Admin: tarifni o\'zgartirishda xatolik:', error);
    res.status(500).json({ error: "Tarifni o'zgartirishda xatolik yuz berdi" });
  }
});

/**
 * PUT /users/:id/verified
 * Tasdiqlangan profil belgisini yoqish/o'chirish. Body: { isVerified: boolean }
 */
router.put('/users/:id/verified', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Noto'g'ri ID format" });

    const isVerified = req.body?.isVerified;
    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ error: "isVerified qiymati true yoki false bo'lishi kerak" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified },
      select: { id: true, firstName: true, isVerified: true },
    });

    res.json({ ok: true, user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }
    console.error('Admin: tasdiq belgisini o\'zgartirishda xatolik:', error);
    res.status(500).json({ error: "Tasdiq belgisini o'zgartirishda xatolik yuz berdi" });
  }
});

/**
 * DELETE /users/:id
 * Foydalanuvchini butunlay o'chirish — e'lonlari, xabarlari va suhbatlari bilan birga.
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Noto'g'ri ID format" });

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    // Tartib muhim: avval xabarlar, so'ng suhbatlar (qolgan sherik xabarlari
    // chatId cascade orqali ketadi), e'lonlar va oxirida foydalanuvchining o'zi.
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { userId: id } }),
      prisma.chat.deleteMany({ where: { OR: [{ userAId: id }, { userBId: id }] } }),
      prisma.animal.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ ok: true });
  } catch (error) {
    console.error("Admin: foydalanuvchini o'chirishda xatolik:", error);
    res.status(500).json({ error: "Foydalanuvchini o'chirishda xatolik yuz berdi" });
  }
});

// ─────────────────────────── Shikoyatlar (Report) ───────────────────────────

/**
 * GET /reports?status=OPEN|RESOLVED
 * Kelgan shikoyatlar ro'yxati (yangisi birinchi), yuboruvchi ma'lumoti bilan.
 */
router.get('/reports', async (req, res) => {
  try {
    const status = req.query.status;
    const where = status === 'OPEN' || status === 'RESOLVED' ? { status } : {};
    const reports = await prisma.report.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 200,
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true },
        },
      },
    });
    const openCount = await prisma.report.count({ where: { status: 'OPEN' } });
    res.json({ data: reports, openCount });
  } catch (error) {
    console.error('Admin: shikoyatlarni yuklashda xatolik:', error);
    res.status(500).json({ error: 'Shikoyatlarni yuklashda xatolik yuz berdi' });
  }
});

const replySchema = z.object({
  reply: z
    .string({ required_error: 'Javob matni kiritilishi shart' })
    .trim()
    .min(1, "Javob bo'sh bo'lmasin")
    .max(2000, 'Javob 2000 belgidan oshmasin'),
});

/**
 * POST /reports/:id/reply
 * Shikoyatga javob berish. Javob "Qo'llab-quvvatlash (Admin)" akkauntidan
 * foydalanuvchining shaxsiy chatiga xabar bo'lib boradi (Socket.IO + push).
 * Shikoyat RESOLVED holatiga o'tadi.
 */
router.post('/reports/:id/reply', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Noto'g'ri ID format" });
    const { reply } = replySchema.parse(req.body);

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ error: 'Shikoyat topilmadi' });

    const support = await getSupportUser();
    const reporterId = report.reporterId;
    if (reporterId === support.id) {
      return res.status(400).json({ error: "Support akkauntining o'ziga javob berib bo'lmaydi" });
    }

    // Support ↔ foydalanuvchi shaxsiy suhbatini topish yoki yaratish
    const [userAId, userBId] = orderPair(support.id, reporterId);
    let chat = await prisma.chat.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
    if (!chat) {
      try {
        chat = await prisma.chat.create({ data: { userAId, userBId } });
      } catch (e) {
        if (e.code !== 'P2002') throw e;
        chat = await prisma.chat.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
      }
    }

    const message = await prisma.message.create({
      data: { type: 'TEXT', content: reply, userId: support.id, chatId: chat.id },
      include: { user: { select: CHAT_USER_SELECT } },
    });
    await prisma.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });
    await prisma.report.update({ where: { id }, data: { adminReply: reply, status: 'RESOLVED' } });

    // Darhol yetkazish (mijoz onlayn bo'lsa)
    const io = req.app.get('io');
    if (io) io.to(`user:${reporterId}`).to(`user:${support.id}`).emit('dm:new', message);

    // Push (mijoz saytda bo'lmasa ham brauzer orqali)
    sendPushToUser(reporterId, {
      title: "Qo'llab-quvvatlash (Admin)",
      body: reply.slice(0, 120),
      url: '/',
      tag: `support-${chat.id}`,
    }).catch(() => {});

    res.json({ ok: true, chatId: chat.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || "Javob noto'g'ri" });
    }
    console.error('Admin: shikoyatga javob berishda xatolik:', error);
    res.status(500).json({ error: 'Javob yuborishda xatolik yuz berdi' });
  }
});

module.exports = router;
