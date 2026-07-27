require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const prisma = require('./utils/prisma');
const { verifyToken } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const animalRoutes = require('./routes/animalRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// BigInt JSON ga o'girishdagi xatolikni oldini olish uchun
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Production frontend manzil(lar)i FRONTEND_URL orqali beriladi —
// vergul bilan bir nechtasini kiritish mumkin (masalan, Netlify + preview).
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean),
];

app.use(
  cors({
    // origin'siz so'rovlar (curl, health-check) o'tkaziladi; brauzer so'rovlari esa
    // faqat ro'yxatdagi manzillardan qabul qilinadi — rad etilganlari logga yoziladi.
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      console.warn(`CORS rad etildi: ${origin} (FRONTEND_URL ni tekshiring)`);
      callback(new Error('CORS: ruxsat etilmagan manzil'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  })
);
app.use(express.json({ limit: '2mb' }));

// API so'rovlarni cheklash (15 daqiqada 1000 ta)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Juda ko'p so'rov yuborildi. Iltimos, keyinroq qayta urinib ko'ring." },
});
app.use('/api', apiLimiter);

// Yuklangan fayllarni ochiq ko'rsatish (/uploads/...)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Marshrutlar
app.use('/api/auth', authRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Salomatlikni tekshirish
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Global xatoliklarni ushlash
app.use((err, req, res, next) => {
  console.error('Global xatolik:', err.stack);
  res.status(500).json({ error: 'Ichki server xatosi yuz berdi.' });
});

// ═══ Socket.IO — umumiy jonli chat ═══
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 1e6,
});
app.set('io', io);

const CHAT_USER_SELECT = { id: true, firstName: true, lastName: true, avatarUrl: true, isVerified: true };
const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'VIDEO_NOTE'];

/** Xabarga biriktirilgan yuklangan faylni diskdan o'chirish (best-effort) */
function unlinkMedia(mediaUrl) {
  if (!mediaUrl || !mediaUrl.startsWith('/uploads/')) return;
  const filePath = path.join(__dirname, '../uploads', path.basename(mediaUrl));
  require('fs').unlink(filePath, () => {});
}

// Ulanishda JWT tekshirish
io.use((socket, next) => {
  const userId = verifyToken(socket.handshake.auth?.token);
  if (!userId) return next(new Error('Avtorizatsiya talab qilinadi'));
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  // Shaxsiy xabarlar shu xona orqali yetkaziladi
  socket.join(`user:${socket.userId}`);
  io.emit('chat:online', io.engine.clientsCount);

  // Yangi xabar yuborish (chatId bo'lsa — shaxsiy suhbat, bo'lmasa — umumiy xona)
  socket.on('chat:send', async (payload, ack) => {
    try {
      const type = MESSAGE_TYPES.includes(payload?.type) ? payload.type : 'TEXT';
      const content =
        typeof payload?.content === 'string' ? payload.content.trim().slice(0, 2000) : null;
      const mediaUrl =
        typeof payload?.mediaUrl === 'string' && payload.mediaUrl.startsWith('/uploads/')
          ? payload.mediaUrl
          : null;

      if (type === 'TEXT' && !content) {
        return ack?.({ error: "Bo'sh xabar yuborib bo'lmaydi" });
      }
      if (type !== 'TEXT' && !mediaUrl) {
        return ack?.({ error: 'Media fayl topilmadi' });
      }

      // Shaxsiy suhbat: faqat ishtirokchi yozishi mumkin
      let chat = null;
      const chatId = parseInt(payload?.chatId);
      if (!isNaN(chatId)) {
        chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat || (chat.userAId !== socket.userId && chat.userBId !== socket.userId)) {
          return ack?.({ error: 'Suhbat topilmadi' });
        }
      }

      const message = await prisma.message.create({
        data: { type, content, mediaUrl, userId: socket.userId, chatId: chat ? chat.id : null },
        include: { user: { select: CHAT_USER_SELECT } },
      });

      if (chat) {
        // Suhbat ro'yxatida yangisi tepaga chiqishi uchun
        prisma.chat
          .update({ where: { id: chat.id }, data: { updatedAt: new Date() } })
          .catch((e) => console.error('Suhbat vaqtini yangilashda xato:', e));
        io.to(`user:${chat.userAId}`).to(`user:${chat.userBId}`).emit('dm:new', message);
      } else {
        io.emit('chat:new', message);
      }
      ack?.({ ok: true, id: message.id });
    } catch (error) {
      console.error('Chat xabarini saqlashda xatolik:', error);
      ack?.({ error: 'Xabar yuborilmadi. Qayta urinib ko\'ring.' });
    }
  });

  // Suhbatni o'qilgan deb belgilash — sherikning xabarlari ✓✓ bo'ladi
  socket.on('chat:read', async (payload, ack) => {
    try {
      const chatId = parseInt(payload?.chatId);
      if (isNaN(chatId)) return ack?.({ error: "Noto'g'ri suhbat ID" });

      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat || (chat.userAId !== socket.userId && chat.userBId !== socket.userId)) {
        return ack?.({ error: 'Suhbat topilmadi' });
      }

      const at = new Date();
      const { count } = await prisma.message.updateMany({
        where: { chatId, userId: { not: socket.userId }, readAt: null },
        data: { readAt: at },
      });

      if (count > 0) {
        const partnerId = chat.userAId === socket.userId ? chat.userBId : chat.userAId;
        io.to(`user:${partnerId}`).emit('dm:read', {
          chatId,
          readerId: socket.userId,
          at: at.toISOString(),
        });
      }
      ack?.({ ok: true, count });
    } catch (error) {
      console.error("Suhbatni o'qilgan deb belgilashda xatolik:", error);
      ack?.({ error: 'Xatolik yuz berdi' });
    }
  });

  // Xabarni hamma uchun o'chirish (faqat o'z xabarini)
  socket.on('chat:delete', async (payload, ack) => {
    try {
      const messageId = parseInt(payload?.messageId);
      if (isNaN(messageId)) return ack?.({ error: "Noto'g'ri xabar ID" });

      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message) return ack?.({ error: 'Xabar topilmadi' });
      if (message.userId !== socket.userId) {
        return ack?.({ error: "Faqat o'z xabaringizni o'chira olasiz" });
      }

      await prisma.message.delete({ where: { id: messageId } });
      unlinkMedia(message.mediaUrl);

      if (message.chatId) {
        const chat = await prisma.chat.findUnique({ where: { id: message.chatId } });
        if (chat) {
          io.to(`user:${chat.userAId}`)
            .to(`user:${chat.userBId}`)
            .emit('dm:deleted', { id: message.id, chatId: message.chatId });
        }
      } else {
        io.emit('chat:deleted', { id: message.id });
      }
      ack?.({ ok: true });
    } catch (error) {
      console.error("Xabarni o'chirishda xatolik:", error);
      ack?.({ error: "Xabar o'chirilmadi. Qayta urinib ko'ring." });
    }
  });

  socket.on('disconnect', () => {
    io.emit('chat:online', io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi (HTTP + Socket.IO).`);
});
