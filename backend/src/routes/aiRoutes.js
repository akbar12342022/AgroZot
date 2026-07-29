const express = require('express');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const prisma = require('../utils/prisma');
const {
  findKnowledgeAnswer,
  priceAnswer,
  getMarketStats,
  pickSuggestions,
  FALLBACK_REPLY,
} = require('../utils/aiKnowledge');

const router = express.Router();

// ANTHROPIC_API_KEY bo'lsa — Claude (har qanday savol + rasm tahlili),
// bo'lmasa — ichki bilim bazasi (fallback).
const HAS_CLAUDE = !!process.env.ANTHROPIC_API_KEY;
let anthropicClient = null;
if (HAS_CLAUDE) {
  const Anthropic = require('@anthropic-ai/sdk');
  anthropicClient = new Anthropic();
}

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ═══ AI tariflar (freemium) ═══
// STANDARD — bepul: jami 3 ta savol, tez/arzon model; PRO — matn cheksiz,
// rasm kuniga 5 ta; PREMIUM — hammasi cheksiz. PRO/PREMIUM kuchli modelda ishlaydi.
const FREE_QUESTION_LIMIT = 3;
const PRO_DAILY_IMAGE_LIMIT = 5;
const ADMIN_CONTACT = process.env.ADMIN_CONTACT || 'https://t.me/afaridshop';

// Tarifga qarab model tanlash. Eslatma: eski claude-3-* modellari muomaladan
// chiqarilgan (404 qaytaradi); claude-sonnet-5 — Sonnet'ning eng yangi avlodi
// (claude-sonnet-4-5 avvalgi avlod). Model ID'lari sana qo'shimchasisiz yoziladi.
const PLAN_MODELS = {
  STANDARD: 'claude-haiku-4-5', // tez va arzon
  PRO: 'claude-sonnet-5', // eng yangi Sonnet — kuchli va samarali
  PREMIUM: 'claude-sonnet-5', // eng yangi Sonnet — kuchli va samarali
};

/** Eski qiymatlarni (none/pro/plus) yangi nomlarga keltirish — himoya qatlami */
function normalizePlan(plan) {
  const map = { none: 'STANDARD', pro: 'PRO', plus: 'PREMIUM' };
  const normalized = map[plan] || plan;
  return PLAN_MODELS[normalized] ? normalized : 'STANDARD';
}

/**
 * Amaldagi tarif — obuna muddati (aiPlanExpiresAt) o'tgan bo'lsa foydalanuvchi
 * avtomatik STANDARDga qaytariladi (bazada ham yangilanadi, keyingi so'rovlar tez).
 */
function effectivePlan(user) {
  const plan = normalizePlan(user.aiPlan);
  if (plan !== 'STANDARD' && user.aiPlanExpiresAt && new Date(user.aiPlanExpiresAt) < new Date()) {
    prisma.user
      .update({ where: { id: user.id }, data: { aiPlan: 'STANDARD', aiPlanExpiresAt: null } })
      .catch((e) => console.error('Obunani STANDARDga qaytarishda xato:', e));
    return 'STANDARD';
  }
  return plan;
}

/** Toshkent (UTC+5) bo'yicha bugungi sana — kunlik limit shu sana bo'yicha nollanadi */
function tashkentToday() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Foydalanuvchining bugungi rasm-tahlil holati (plan — normallashtirilgan tarif) */
function imageUsage(user, plan) {
  const today = tashkentToday();
  const used = user.aiImagesDate === today ? user.aiImagesUsed : 0;
  const limit = plan === 'PRO' ? PRO_DAILY_IMAGE_LIMIT : null; // null — cheksiz
  const remaining = limit === null ? null : Math.max(0, limit - used);
  return { today, used, limit, remaining };
}

/** Muvaffaqiyatli rasm tahlilidan keyin kunlik hisoblagichni oshirish */
async function consumeImageQuota(user, usage) {
  await prisma.user.update({
    where: { id: user.id },
    data: { aiImagesUsed: usage.used + 1, aiImagesDate: usage.today },
  });
}

const MEDIA_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/** /uploads/... yo'lidan rasmni xavfsiz o'qib, base64 blok tayyorlash */
function readImageBlock(imageUrl) {
  const filename = path.basename(String(imageUrl || ''));
  const ext = path.extname(filename).toLowerCase();
  const mediaType = MEDIA_TYPES[ext];
  if (!mediaType) return null;

  const filePath = path.join(UPLOADS_DIR, filename);
  if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) return null;

  const data = fs.readFileSync(filePath).toString('base64');
  return {
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data },
  };
}

/** Bozor statistikasini sistem promptga qo'shish uchun matn ko'rinishida tayyorlash */
function statsToText(stats) {
  if (!stats.length) return "Hozircha bozorda faol e'lonlar yo'q.";
  return stats
    .map(
      (s) =>
        `- ${s.categoryName} (${s.count} ta e'lon): o'rtacha ${s.avg.toLocaleString('uz')} so'm, ` +
        `diapazon ${s.min.toLocaleString('uz')}–${s.max.toLocaleString('uz')} so'm`
    )
    .join('\n');
}

function buildSystemPrompt(marketStatsText) {
  return (
    `Sen "AgroZot AI" — O'zbekistondagi chorvachilik marketplace'ining aqlli yordamchisisan.\n\n` +
    `QOIDALAR:\n` +
    `- Har doim o'zbek tilida (lotin alifbosida), sodda va tushunarli javob ber.\n` +
    `- Har qanday savolga yordam ber, lekin asosiy ixtisosing: chorvachilik, veterinariya, ` +
    `ozuqlantirish, hayvon parvarishi va bozor narxlari.\n` +
    `- Javoblar aniq va amaliy bo'lsin. Kerak bo'lsa raqamlangan ro'yxat ishlat. Emoji ishlatma.\n` +
    `- Kasallik og'ir ko'rinsa, albatta veterinarga murojaat qilishni tavsiya qil.\n` +
    `- Dori dozalarini taxmin qilma — "veterinar bilan aniqlashtiring" degin.\n\n` +
    `RASM TAHLILI: Foydalanuvchi hayvon rasmini yuborsa:\n` +
    `1) Hayvon turini va ko'rinib turgan zot belgilarini aniqla.\n` +
    `2) Tashqi ko'rinishiga qarab TAXMINIY tirik vazn diapazonini ayt (masalan: "taxminan 350-420 kg").\n` +
    `3) Quyidagi joriy bozor statistikasidan foydalanib TAXMINIY narx diapazonini so'mda ayt.\n` +
    `4) Holatiga oid ko'rinadigan kuzatuvlar bo'lsa ayt (ozg'in/semiz, jun holati va h.k.).\n` +
    `5) Doim shuni eslatib o't: bu faqat rasmga asoslangan taxmin, aniq baho uchun jonli ko'rik kerak.\n\n` +
    `AGROZOT BOZORIDAGI JORIY NARXLAR (real e'lonlardan):\n${marketStatsText}\n\n` +
    `Narx haqidagi savollarga shu statistikaga tayanib javob ber.`
  );
}

/** Frontenddan kelgan suhbat tarixini xavfsiz Claude formatiga o'tkazish */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

async function askClaude({ message, history, imageUrl, model }) {
  const stats = await getMarketStats();
  const system = buildSystemPrompt(statsToText(stats));

  const content = [];
  if (imageUrl) {
    const imageBlock = readImageBlock(imageUrl);
    if (imageBlock) content.push(imageBlock);
  }
  content.push({
    type: 'text',
    text:
      message ||
      "Bu rasmni tahlil qilib ber: qanday hayvon, taxminiy vazni va bozor narxi qancha bo'lishi mumkin?",
  });

  const messages = [...sanitizeHistory(history), { role: 'user', content }];

  const response = await anthropicClient.messages.create({
    model,
    // Sonnet 5 da thinking ham max_tokens hisobiga kiradi — javob kesilib
    // qolmasligi uchun kengroq chegara (chegara ≠ sarf, faqat yuqori qopqoq)
    max_tokens: 4000,
    // Adaptive thinking Sonnet 5 va Opus'da ishlaydi; Haiku 4.5 uni qabul
    // qilmaydi (400 qaytaradi) — shuning uchun Haiku'da yuborilmaydi
    ...(model.startsWith('claude-haiku') ? {} : { thinking: { type: 'adaptive' } }),
    system,
    messages,
  });

  if (response.stop_reason === 'refusal') {
    return "Kechirasiz, bu savolga javob bera olmayman. Chorvachilikka oid boshqa savol bering.";
  }

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return text || "Javob tayyorlashda muammo yuz berdi. Qayta urinib ko'ring.";
}

/** Fallback: ichki bilim bazasi bilan javob berish */
async function askKnowledgeBase(message, hasImage) {
  if (hasImage) {
    return {
      reply:
        "Rasmni ko'rish uchun to'liq AI rejimi kerak. Hozircha faqat matnli savollarga " +
        "javob bera olaman.\n\nTo'liq AI rejimini yoqish uchun administrator backend/.env " +
        "fayliga ANTHROPIC_API_KEY qo'shishi kerak.",
      suggestions: pickSuggestions(),
    };
  }

  const priceReply = await priceAnswer(message);
  if (priceReply) return { reply: priceReply, suggestions: pickSuggestions() };

  const known = findKnowledgeAnswer(message);
  if (known) return { reply: known, suggestions: pickSuggestions() };

  return { reply: FALLBACK_REPLY, suggestions: pickSuggestions() };
}

/**
 * POST /chat
 * AI yordamchi bilan suhbat.
 * Body: { message: string, history?: [{role, content}], imageUrl?: string }
 */
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, history, imageUrl } = req.body || {};
    const trimmed = typeof message === 'string' ? message.trim().slice(0, 2000) : '';

    if (!trimmed && !imageUrl) {
      return res.status(400).json({ error: 'Xabar matni kiritilmadi' });
    }

    // ── Tarif tekshiruvi ──
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

    const plan = effectivePlan(user);

    // STANDARD (bepul) tarif: jami FREE_QUESTION_LIMIT ta savol
    if (plan === 'STANDARD' && user.aiUsageCount >= FREE_QUESTION_LIMIT) {
      return res.status(403).json({
        success: false,
        message: 'Limit reached. Please upgrade to a paid plan.',
        error: `Bepul ${FREE_QUESTION_LIMIT} ta savol tugadi. Davom etish uchun Pro yoki Premium tarifini ulang.`,
        code: 'LIMIT_REACHED',
        plan,
        questionLimit: FREE_QUESTION_LIMIT,
        remainingQuestions: 0,
        contact: ADMIN_CONTACT,
      });
    }

    const usage = imageUsage(user, plan);
    if (imageUrl && usage.remaining !== null && usage.remaining <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Daily image limit reached.',
        error: `Bugungi rasm tahlili limiti tugadi (kuniga ${usage.limit} ta). Ertaga qayta urinib ko'ring yoki Premium tarifiga o'ting.`,
        code: 'IMAGE_LIMIT',
        imageLimit: usage.limit,
        remainingImages: 0,
        contact: ADMIN_CONTACT,
      });
    }

    /** Javobga tarif holatini qo'shish (savol/rasm ishlatilgan bo'lsa hisoblab) */
    const planInfo = (questionConsumed, imageConsumed) => {
      const imagesUsed = usage.used + (imageConsumed ? 1 : 0);
      const questionsUsed = user.aiUsageCount + (questionConsumed ? 1 : 0);
      return {
        plan,
        imageLimit: usage.limit,
        remainingImages: usage.limit === null ? null : Math.max(0, usage.limit - imagesUsed),
        questionLimit: plan === 'STANDARD' ? FREE_QUESTION_LIMIT : null,
        remainingQuestions:
          plan === 'STANDARD' ? Math.max(0, FREE_QUESTION_LIMIT - questionsUsed) : null,
      };
    };

    if (HAS_CLAUDE) {
      try {
        // Model tarifga qarab tanlanadi: STANDARD — tez/arzon, PRO/PREMIUM — kuchli
        const reply = await askClaude({
          message: trimmed,
          history,
          imageUrl,
          model: PLAN_MODELS[plan],
        });
        // Hisoblagichlar faqat muvaffaqiyatli javobdan keyin oshiriladi
        if (imageUrl) await consumeImageQuota(user, usage);
        await prisma.user.update({
          where: { id: user.id },
          data: { aiUsageCount: { increment: 1 } },
        });
        return res.json({
          success: true,
          reply,
          suggestions: pickSuggestions(),
          engine: 'claude',
          ...planInfo(true, !!imageUrl),
        });
      } catch (error) {
        console.error('Claude xatosi, bilim bazasiga o\'tildi:', error.message);
        const fallback = await askKnowledgeBase(trimmed, !!imageUrl);
        return res.json({ success: true, ...fallback, engine: 'kb', ...planInfo(false, false) });
      }
    }

    const result = await askKnowledgeBase(trimmed, !!imageUrl);
    res.json({ success: true, ...result, engine: 'kb', ...planInfo(false, false) });
  } catch (error) {
    console.error('AI chat xatosi:', error);
    res.status(500).json({ error: 'AI yordamchida xatolik yuz berdi' });
  }
});

/**
 * GET /access
 * Joriy foydalanuvchining AI tarifi va bugungi limitlari.
 * Frontend AI bo'limini ochishdan oldin shu orqali tekshiradi.
 */
router.get('/access', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

    const plan = effectivePlan(user);
    const usage = imageUsage(user, plan);
    res.json({
      plan,
      imageLimit: usage.limit,
      imagesUsedToday: usage.used,
      remainingImages: usage.remaining,
      questionLimit: plan === 'STANDARD' ? FREE_QUESTION_LIMIT : null,
      questionsUsed: user.aiUsageCount,
      remainingQuestions:
        plan === 'STANDARD' ? Math.max(0, FREE_QUESTION_LIMIT - user.aiUsageCount) : null,
      contact: ADMIN_CONTACT,
      engine: HAS_CLAUDE ? 'claude' : 'kb',
      vision: HAS_CLAUDE,
    });
  } catch (error) {
    console.error('AI access xatosi:', error);
    res.status(500).json({ error: "Tarif ma'lumotlarini yuklashda xatolik" });
  }
});

/**
 * GET /status
 * AI rejimi holati (frontend interfeysni moslashtirishi uchun)
 */
router.get('/status', (req, res) => {
  res.json({ engine: HAS_CLAUDE ? 'claude' : 'kb', vision: HAS_CLAUDE });
});

module.exports = router;
