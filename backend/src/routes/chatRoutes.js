const express = require('express');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const router = express.Router();

const USER_SELECT = { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true, phone: true };

/** Juftlikni bir xil tartibga keltirish (userAId < userBId) */
function orderPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/** Suhbatni frontend kutadigan shaklga keltirish (sherik + oxirgi xabar) */
function shapeChat(chat, myId) {
  return {
    id: chat.id,
    partner: chat.userAId === myId ? chat.userB : chat.userA,
    lastMessage: chat.messages?.[0] || null,
    updatedAt: chat.updatedAt,
    createdAt: chat.createdAt,
  };
}

/**
 * GET /messages
 * Umumiy xona tarixi (chatId = null). ?before=<id> bilan eskiroq xabarlar.
 */
router.get('/messages', auth, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 60));
    const before = parseInt(req.query.before);

    const where = { chatId: null };
    if (!isNaN(before)) where.id = { lt: before };

    const rows = await prisma.message.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit,
      include: { user: { select: USER_SELECT } },
    });

    // Eng eskisi birinchi bo'lib ko'rsatiladi
    res.json({ data: rows.reverse(), hasMore: rows.length === limit });
  } catch (error) {
    console.error('Chat tarixini olishda xatolik:', error);
    res.status(500).json({ error: 'Xabarlarni yuklashda xatolik yuz berdi' });
  }
});

/**
 * POST /direct
 * Sotuvchi bilan 1-ga-1 suhbatni ochish yoki mavjudini qaytarish. Body: { userId }
 */
router.post('/direct', auth, async (req, res) => {
  try {
    const targetId = parseInt(req.body?.userId);
    if (isNaN(targetId)) return res.status(400).json({ error: "Noto'g'ri foydalanuvchi ID" });
    if (targetId === req.userId) {
      return res.status(400).json({ error: "O'zingiz bilan suhbat ochib bo'lmaydi" });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const [userAId, userBId] = orderPair(req.userId, targetId);
    const include = {
      userA: { select: USER_SELECT },
      userB: { select: USER_SELECT },
      messages: { orderBy: { id: 'desc' }, take: 1 },
    };

    let chat = await prisma.chat.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
      include,
    });
    if (!chat) {
      try {
        chat = await prisma.chat.create({ data: { userAId, userBId }, include });
      } catch (e) {
        // Parallel so'rovda allaqachon yaratilgan bo'lishi mumkin (unique constraint)
        if (e.code !== 'P2002') throw e;
        chat = await prisma.chat.findUnique({
          where: { userAId_userBId: { userAId, userBId } },
          include,
        });
      }
    }

    res.json(shapeChat(chat, req.userId));
  } catch (error) {
    console.error('Shaxsiy suhbatni ochishda xatolik:', error);
    res.status(500).json({ error: 'Suhbatni ochishda xatolik yuz berdi' });
  }
});

/**
 * GET /chats
 * Mening shaxsiy suhbatlarim (oxirgi xabari bilan, yangisi birinchi).
 */
router.get('/chats', auth, async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        userA: { select: USER_SELECT },
        userB: { select: USER_SELECT },
        messages: { orderBy: { id: 'desc' }, take: 1 },
      },
    });

    res.json({ data: chats.map((c) => shapeChat(c, req.userId)) });
  } catch (error) {
    console.error('Suhbatlar ro\'yxatini olishda xatolik:', error);
    res.status(500).json({ error: 'Suhbatlarni yuklashda xatolik yuz berdi' });
  }
});

/**
 * GET /chats/:id/messages
 * Shaxsiy suhbat tarixi (faqat ishtirokchilar uchun). ?before=<id> qo'llab-quvvatlanadi.
 */
router.get('/chats/:id/messages', auth, async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    if (isNaN(chatId)) return res.status(400).json({ error: "Noto'g'ri suhbat ID" });

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || (chat.userAId !== req.userId && chat.userBId !== req.userId)) {
      return res.status(404).json({ error: 'Suhbat topilmadi' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 60));
    const before = parseInt(req.query.before);
    const where = { chatId };
    if (!isNaN(before)) where.id = { lt: before };

    const rows = await prisma.message.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit,
      include: { user: { select: USER_SELECT } },
    });

    res.json({ data: rows.reverse(), hasMore: rows.length === limit });
  } catch (error) {
    console.error('Shaxsiy suhbat tarixini olishda xatolik:', error);
    res.status(500).json({ error: 'Xabarlarni yuklashda xatolik yuz berdi' });
  }
});

/**
 * GET /online
 * Onlayn foydalanuvchilar soni (Socket.IO dan olinadi)
 */
router.get('/online', (req, res) => {
  const io = req.app.get('io');
  res.json({ online: io ? io.engine.clientsCount : 0 });
});

module.exports = router;
