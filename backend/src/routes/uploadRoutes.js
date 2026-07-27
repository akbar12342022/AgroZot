const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

const router = express.Router();

// Fayllar saqlanadigan papka
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MEDIA_TYPES = [
  ...IMAGE_TYPES,
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
];

const imageUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat JPG, PNG yoki WEBP formatdagi rasm yuklash mumkin'));
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 8 }, // 10 MB, maksimal 8 ta
});

const mediaUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (MEDIA_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Bu fayl turi qo'llab-quvvatlanmaydi (rasm, video yoki audio yuboring)"));
  },
  limits: { fileSize: 30 * 1024 * 1024, files: 1 }, // 30 MB
});

/**
 * POST /
 * E'lon rasmlarini yuklash (multipart/form-data, "images" maydoni, maks. 8 ta)
 */
router.post('/', auth, imageUpload.array('images', 8), (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: 'Hech qanday rasm yuklanmadi' });
  }
  const urls = files.map((f) => `/uploads/${f.filename}`);
  res.status(201).json({ urls });
});

/**
 * POST /media
 * Chat/AI uchun bitta media fayl yuklash ("media" maydoni: rasm, video yoki audio)
 */
router.post('/media', auth, mediaUpload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fayl yuklanmadi' });
  }
  const mime = req.file.mimetype;
  const mediaType = mime.startsWith('image/') ? 'IMAGE' : mime.startsWith('video/') ? 'VIDEO' : 'AUDIO';
  res.status(201).json({ url: `/uploads/${req.file.filename}`, mediaType, mime });
});

// Multer xatolarini ushlash
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fayl hajmi juda katta (rasm 10 MB, video/audio 30 MB gacha)' });
  }
  res.status(400).json({ error: err.message || 'Fayl yuklashda xatolik yuz berdi' });
});

module.exports = router;
