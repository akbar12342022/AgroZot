// "Qo'llab-quvvatlash (Admin)" maxsus akkaunti.
// Admin shikoyatga javob berganda xabar shu akkauntdan foydalanuvchiga boradi.
const prisma = require('./prisma');

const SUPPORT_PHONE = '+998000000000';
const SUPPORT_NAME = "Qo'llab-quvvatlash (Admin)";

let cachedId = null;

/**
 * Qo'llab-quvvatlash akkauntini topadi yoki yaratadi. Natija keshlanadi —
 * har safar bazaga bormaslik uchun, lekin o'chirilgan bo'lsa qayta yaratadi.
 */
async function getSupportUser() {
  if (cachedId) {
    const existing = await prisma.user.findUnique({ where: { id: cachedId } });
    if (existing) return existing;
    cachedId = null;
  }
  const user = await prisma.user.upsert({
    where: { phone: SUPPORT_PHONE },
    update: { isSupport: true, isVerified: true, firstName: SUPPORT_NAME },
    create: { phone: SUPPORT_PHONE, firstName: SUPPORT_NAME, isSupport: true, isVerified: true },
  });
  cachedId = user.id;
  return user;
}

module.exports = { getSupportUser, SUPPORT_PHONE, SUPPORT_NAME };
