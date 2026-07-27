const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');
const router = express.Router();

// E'lon yaratish uchun Zod sxemasi
const createAnimalSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3ta harfdan iborat bo'lishi kerak").max(200, "Sarlavha 200ta harfdan oshmasligi kerak"),
  category: z.string({ required_error: 'Kategoriya kiritilishi majburiy' }),
  price: z.number().positive("Narx noldan katta bo'lishi kerak"),
  description: z.string().max(2000).optional(),
  images: z.array(z.string()).max(8).optional(),
  location: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  breed: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  weight: z.string().optional(),
  vaccinated: z.boolean().optional(),
  // Kategoriyaga xos qo'shimcha maydonlar (bosh soni, yem turi, holati va h.k.)
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// Tahrirlash uchun (barcha qismlar ixtiyoriy)
const updateAnimalSchema = createAnimalSchema.partial();

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  phone: true,
  avatarUrl: true,
  isVerified: true,
  createdAt: true,
};

/**
 * GET /
 * E'lonlar ro'yxati (qidirish, filtrlash, saralash, sahifalash)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, region, district, minPrice, maxPrice, q, sort } = req.query;

    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNumber - 1) * limitNumber;

    const where = { status: 'ACTIVE' };
    if (category) where.category = category;
    if (region) where.region = region;
    if (district) where.district = district;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'cheapest') orderBy = { price: 'asc' };
    else if (sort === 'expensive') orderBy = { price: 'desc' };
    else if (sort === 'views') orderBy = { views: 'desc' };

    const [total, data] = await Promise.all([
      prisma.animal.count({ where }),
      prisma.animal.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy,
        include: { user: { select: USER_SELECT } },
      }),
    ]);

    res.json({
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('Hayvonlarni olishda xatolik:', error);
    res.status(500).json({ error: 'Hayvonlarni yuklashda xatolik yuz berdi' });
  }
});

/**
 * GET /my
 * Joriy foydalanuvchining o'z e'lonlari
 */
router.get('/my', auth, async (req, res) => {
  try {
    const data = await prisma.animal.findMany({
      where: { userId: req.userId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: USER_SELECT } },
    });

    res.json({ data });
  } catch (error) {
    console.error("Mening e'lonlarimni olishda xatolik:", error);
    res.status(500).json({ error: "E'lonlaringizni yuklashda xatolik yuz berdi" });
  }
});

/**
 * GET /:id
 * Bitta e'lon (ko'rishlar sonini oshiradi)
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Noto'g'ri ID format" });

    const animal = await prisma.animal.findUnique({
      where: { id, status: 'ACTIVE' },
      include: { user: { select: USER_SELECT } },
    });

    if (!animal) {
      return res.status(404).json({ error: 'Hayvon topilmadi' });
    }

    prisma.animal
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch((e) => console.error("Ko'rishlar sonini oshirishda xato:", e));

    res.json(animal);
  } catch (error) {
    res.status(500).json({ error: "Hayvon ma'lumotlarini yuklashda xatolik yuz berdi" });
  }
});

/**
 * POST /
 * Yangi e'lon qo'shish
 */
router.post('/', auth, async (req, res) => {
  try {
    const validatedData = createAnimalSchema.parse(req.body);

    const newAnimal = await prisma.animal.create({
      data: { ...validatedData, userId: req.userId },
    });

    res.status(201).json(newAnimal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Kiritilgan ma'lumotlarda xatolik", details: error.errors });
    }
    console.error('Yaratish xatosi:', error);
    res.status(500).json({ error: "E'lon qo'shishda xatolik yuz berdi" });
  }
});

/**
 * PUT /:id
 * E'lonni tahrirlash (faqat egasi)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = updateAnimalSchema.parse(req.body);

    const animal = await prisma.animal.findUnique({ where: { id } });

    if (!animal || animal.status === 'DELETED') {
      return res.status(404).json({ error: "E'lon topilmadi" });
    }
    if (animal.userId !== req.userId) {
      return res.status(403).json({ error: "Sizda bu e'lonni tahrirlash huquqi yo'q" });
    }

    const updatedAnimal = await prisma.animal.update({
      where: { id },
      data: validatedData,
    });

    res.json(updatedAnimal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Kiritilgan ma'lumotlarda xatolik", details: error.errors });
    }
    res.status(500).json({ error: "E'lonni tahrirlashda xatolik yuz berdi" });
  }
});

/**
 * DELETE /:id
 * E'lonni o'chirish (soft delete, faqat egasi)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const animal = await prisma.animal.findUnique({ where: { id } });

    if (!animal || animal.status === 'DELETED') {
      return res.status(404).json({ error: "E'lon topilmadi" });
    }
    if (animal.userId !== req.userId) {
      return res.status(403).json({ error: "Sizda bu e'lonni o'chirish huquqi yo'q" });
    }

    await prisma.animal.update({ where: { id }, data: { status: 'DELETED' } });

    res.json({ message: "E'lon muvaffaqiyatli o'chirildi" });
  } catch (error) {
    res.status(500).json({ error: "E'lonni o'chirishda xatolik yuz berdi" });
  }
});

module.exports = router;
