// src/middleware/telegramAuth.js
const crypto = require('crypto');

// Dev rejimida ishlatiladigan test foydalanuvchisi (brauzerda Telegramsiz sinash uchun)
const DEV_USER = {
  id: 999999999,
  first_name: 'Chorvador',
  last_name: '',
  username: 'dev_chorvador',
};

/**
 * Telegram Mini App initData ni tekshirish.
 * Muvaffaqiyatli bo'lsa user obyektini, aks holda null qaytaradi.
 */
function validateInitData(initData, botToken) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    // Ma'lumotlarni alfavit bo'yicha tartiblash va "\n" bilan birlashtirish
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) return null;

    const userJson = params.get('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

/**
 * Auth middleware. Frontend so'rovlari `Authorization: Bearer <initData>` bilan keladi.
 * Haqiqiy Telegram ichida — initData tekshiriladi.
 * DEV_AUTH=true bo'lsa (lokal ishlab chiqish) — test foydalanuvchisi bilan ishlaydi.
 */
const telegramAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const initData = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (initData && initData !== 'dev' && process.env.BOT_TOKEN) {
      const user = validateInitData(initData, process.env.BOT_TOKEN);
      if (user) {
        req.user = user;
        return next();
      }
    }

    if (process.env.DEV_AUTH === 'true') {
      req.user = DEV_USER;
      return next();
    }

    return res.status(401).json({ error: "Avtorizatsiya talab qilinadi. Ilovani Telegram orqali oching." });
  } catch (error) {
    console.error('Auth middleware xatosi:', error);
    return res.status(500).json({ error: 'Server xatosi (Auth)' });
  }
};

module.exports = telegramAuth;
