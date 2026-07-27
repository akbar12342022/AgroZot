// Bir martalik: mavjud e'lonlarda location qiymatini district ga ko'chirish
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.animal.findMany({
    where: { district: null, location: { not: null } },
    select: { id: true, location: true },
  });
  for (const r of rows) {
    await prisma.animal.update({ where: { id: r.id }, data: { district: r.location } });
  }
  console.log(`${rows.length} ta e'longa district qo'shildi.`);
  await prisma.$disconnect();
})();
