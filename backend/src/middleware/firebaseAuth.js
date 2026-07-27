// Firebase ID tokenni tekshiruvchi middleware — faqat ro'yxatdan o'tish/kirishda ishlatiladi.
// Frontend Firebase Phone Auth orqali SMS kodni tasdiqlagach, ID tokenni
// `Authorization: Bearer <idToken>` sarlavhasida yuboradi. Token haqiqiy bo'lsa,
// tasdiqlangan telefon raqam req.firebasePhone ga, UID esa req.firebaseUid ga yoziladi.
const admin = require('firebase-admin');

/**
 * Admin SDK ni bir marta ishga tushirish.
 * Token imzosini tekshirish uchun service account SHART EMAS — FIREBASE_PROJECT_ID yetarli.
 * FIREBASE_SERVICE_ACCOUNT (JSON yoki base64-JSON) berilsa, to'liq huquqli rejimda ishlaydi.
 */
function initFirebase() {
  if (admin.apps.length) return true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      json = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
    admin.initializeApp({
      credential: admin.credential.cert(json),
      projectId: json.project_id,
    });
    return true;
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    return true;
  }

  return false;
}

async function firebaseAuth(req, res, next) {
  let ready;
  try {
    ready = initFirebase();
  } catch (error) {
    console.error('Firebase Admin ishga tushmadi:', error);
    ready = false;
  }
  if (!ready) {
    console.error(
      'FIREBASE_PROJECT_ID (yoki FIREBASE_SERVICE_ACCOUNT) o\'rnatilmagan — .env faylini tekshiring.'
    );
    return res.status(500).json({ error: 'Server sozlanmagan. Administratorga murojaat qiling.' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Telefon raqamni tasdiqlash talab qilinadi.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded.phone_number) {
      return res.status(401).json({ error: 'Telefon raqam tasdiqlanmagan.' });
    }
    req.firebaseUid = decoded.uid;
    req.firebasePhone = decoded.phone_number; // E.164: +998901234567
    next();
  } catch (error) {
    console.error('Firebase ID token tekshiruvi muvaffaqiyatsiz:', error.code || error.message);
    return res
      .status(401)
      .json({ error: "Tasdiqlash muddati o'tgan yoki noto'g'ri. Qaytadan urinib ko'ring." });
  }
}

module.exports = firebaseAuth;
