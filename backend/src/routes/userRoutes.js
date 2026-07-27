const express = require('express');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const router = express.Router();

/**
 * GET /me
 * Joriy foydalanuvchi profili va statistikasi
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const [activeCount, viewsAgg] = await Promise.all([
      prisma.animal.count({ where: { userId: user.id, status: 'ACTIVE' } }),
      prisma.animal.aggregate({
        where: { userId: user.id, status: { not: 'DELETED' } },
        _sum: { views: true },
      }),
    ]);

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      aiPlan: user.aiPlan,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      stats: {
        activeAnimals: activeCount,
        totalViews: viewsAgg._sum.views || 0,
      },
    });
  } catch (error) {
    console.error('Profilni yuklashda xatolik:', error);
    res.status(500).json({ error: "Profil ma'lumotlarini yuklashda xatolik yuz berdi" });
  }
});

/**
 * PUT /me
 * Profilni yangilash (ism va/yoki avatar). Body: { firstName?, avatarUrl? }
 */
router.put('/me', auth, async (req, res) => {
  try {
    const { firstName, avatarUrl } = req.body || {};
    const data = {};

    if (firstName !== undefined) {
      if (!firstName || String(firstName).trim().length < 2) {
        return res.status(400).json({ error: "Ism kamida 2 ta harfdan iborat bo'lsin" });
      }
      data.firstName = String(firstName).trim().slice(0, 60);
    }

    if (avatarUrl !== undefined) {
      // Faqat o'zimizning yuklash xizmatidan kelgan fayllar (yoki null — o'chirish)
      if (avatarUrl !== null && !(typeof avatarUrl === 'string' && avatarUrl.startsWith('/uploads/'))) {
        return res.status(400).json({ error: "Avatar rasmi noto'g'ri formatda" });
      }
      data.avatarUrl = avatarUrl;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "O'zgartirish uchun ma'lumot berilmadi" });
    }

    const user = await prisma.user.update({ where: { id: req.userId }, data });

    res.json({ message: 'Profil yangilandi', firstName: user.firstName, avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error('Profilni yangilashda xatolik:', error);
    res.status(500).json({ error: 'Profilni yangilashda xatolik yuz berdi' });
  }
});

/**
 * GET /:id
 * Boshqa foydalanuvchi profili (ochiq ma'lumotlar)
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Noto'g'ri ID format" });

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        phone: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { animals: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const { _count, ...userData } = user;
    res.json({ ...userData, activeAnimalsCount: _count.animals });
  } catch (error) {
    console.error('Foydalanuvchini yuklashda xatolik:', error);
    res.status(500).json({ error: "Foydalanuvchi ma'lumotlarini yuklashda xatolik yuz berdi" });
  }
});

module.exports = router;
