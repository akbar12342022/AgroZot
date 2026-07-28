// Foydalanuvchi shikoyatlari (Report). Yuborish — foydalanuvchi tomonidan;
// ko'rish va javob berish — admin panelda (adminRoutes.js).
const express = require('express');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const reportSchema = z.object({
  targetType: z.enum(['ANIMAL', 'USER', 'OTHER']).default('OTHER'),
  targetId: z.number().int().positive().optional(),
  reason: z
    .string({ required_error: 'Shikoyat matni kiritilishi shart' })
    .trim()
    .min(3, "Shikoyat matni kamida 3 ta belgidan iborat bo'lsin")
    .max(1000, 'Shikoyat matni 1000 belgidan oshmasin'),
});

/** POST / — foydalanuvchi shikoyat/murojaat yuboradi */
router.post('/', auth, async (req, res) => {
  try {
    const data = reportSchema.parse(req.body);
    const report = await prisma.report.create({
      data: { reporterId: req.userId, ...data },
    });
    res.status(201).json({ ok: true, id: report.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || "Ma'lumot noto'g'ri" });
    }
    console.error('Shikoyat yuborishda xatolik:', error);
    res.status(500).json({ error: 'Shikoyat yuborishda xatolik yuz berdi' });
  }
});

module.exports = router;
