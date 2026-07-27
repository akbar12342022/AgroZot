// JWT asosidagi autentifikatsiya middleware.
// Frontend so'rovlari `Authorization: Bearer <jwt>` bilan keladi.
// Muvaffaqiyatli tekshiruvda foydalanuvchi IDsi req.userId ga yoziladi.
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Avtorizatsiya talab qilinadi. Qaytadan ro'yxatdan o'ting." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Sessiya muddati tugagan. Qaytadan kiring." });
  }
};

/** Socket.IO uchun token tekshirish — muvaffaqiyatda userId qaytaradi, aks holda null */
function verifyToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.userId || null;
  } catch {
    return null;
  }
}

module.exports = auth;
module.exports.verifyToken = verifyToken;
