// Bir martalik: eski e'lonlardagi "Toshkent" viloyat nomini yangi formatga moslash
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const r = await prisma.animal.updateMany({
    where: { region: 'Toshkent' },
    data: { region: 'Toshkent viloyati' },
  });
  console.log(`${r.count} ta e'lon yangilandi (Toshkent -> Toshkent viloyati).`);
  await prisma.$disconnect();
})();
