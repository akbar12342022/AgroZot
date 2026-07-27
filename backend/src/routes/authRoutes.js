const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const firebaseAuth = require('../middleware/firebaseAuth');

const router = express.Router();

// Onboarding so'rovnomasida ruxsat etilgan qiymatlar
const SURVEY_ROLES = ['farmer', 'buyer', 'butcher', 'curious'];
const SURVEY_INTERESTS = ['cattle', 'sheep', 'horse', 'rabbit', 'poultry'];
const SURVEY_SOURCES = ['instagram', 'telegram', 'youtube', 'friends'];

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Ism kiritilishi shart' })
    .trim()
    .min(2, "Ism kamida 2 ta harfdan iborat bo'lsin")
    .max(60, 'Ism 60 ta belgidan oshmasin'),
  survey: z
    .object({
      role: z.string().trim().max(40).nullish(),
      interests: z.array(z.string().trim().max(40)).max(10).optional(),
      source: z.string().trim().max(40).nullish(),
    })
    .optional(),
});

/**
 * So'rovnoma javoblarini bazaga yozish uchun tozalash.
 * Noma'lum qiymatlar xatoga sabab bo'lmaydi — shunchaki tashlab yuboriladi.
 */
function sanitizeSurvey(survey) {
  if (!survey) return null;
  const role = SURVEY_ROLES.includes(survey.role) ? survey.role : null;
  const interests = (survey.interests || []).filter((i) => SURVEY_INTERESTS.includes(i));
  const source = SURVEY_SOURCES.includes(survey.source) ? survey.source : null;
  if (!role && interests.length === 0 && !source) return null;
  return { surveyRole: role, surveyInterests: interests, surveySource: source };
}

/** Telefon raqamni yagona formatga keltirish: +998XXXXXXXXX */
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
  return null;
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '90d' });
}

function publicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    aiPlan: user.aiPlan,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

/**
 * POST /register
 * Ro'yxatdan o'tish / kirish — Firebase Phone Auth bilan tasdiqlangan raqam orqali.
 * Telefon raqam so'rov tanasidan EMAS, tekshirilgan Firebase ID tokendan olinadi
 * (firebaseAuth middleware → req.firebasePhone). Raqam avval ro'yxatdan o'tgan
 * bo'lsa, o'sha hisobga kiritadi.
 */
router.post('/register', firebaseAuth, async (req, res) => {
  try {
    const { name, survey } = registerSchema.parse(req.body);

    // Firebase E.164 formatida beradi (+998901234567) — bazadagi format bilan bir xil.
    // O'zbekiston raqamlari normalizatsiyadan o'tadi, boshqalari asl holida saqlanadi.
    const normalizedPhone = normalizePhone(req.firebasePhone) || req.firebasePhone;

    // So'rovnoma javobsiz kelgan kirishda avvalgi javoblar o'chirilmaydi
    const surveyData = sanitizeSurvey(survey);

    const user = await prisma.user.upsert({
      where: { phone: normalizedPhone },
      update: { firstName: name, ...(surveyData || {}) },
      create: { firstName: name, phone: normalizedPhone, ...(surveyData || {}) },
    });

    res.status(201).json({
      token: signToken(user.id),
      user: publicUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || "Ma'lumotlar noto'g'ri" });
    }
    console.error("Ro'yxatdan o'tishda xatolik:", error);
    res.status(500).json({ error: "Ro'yxatdan o'tishda xatolik yuz berdi" });
  }
});

module.exports = router;
