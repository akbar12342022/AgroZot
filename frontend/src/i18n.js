import { createContext, useContext } from 'react';

/**
 * Yengil i18n lug'atlari va konteksti.
 * Til: 'uz' | 'ru' (localStorage: agrozot_lang).
 * Mavzu: 'light' | 'dark' — <html> elementiga .dark klassi qo'yiladi (Tailwind darkMode: 'class').
 * Provider komponenti alohida faylda: I18nProvider.jsx (fast-refresh talabi).
 */
export const LANG_KEY = 'agrozot_lang';
export const THEME_KEY = 'agrozot_theme';

export const STRINGS = {
  uz: {
    // Pastki navigatsiya
    'nav.home': 'Bosh sahifa',
    'nav.chat': 'Chat',
    'nav.post': "E'lon",
    'nav.ai': 'AI Yordam',
    'nav.profile': 'Profil',
    // Chat
    'chat.title': 'Xabarlar',
    'chat.subtitle': 'Umumiy xona va sotuvchilar bilan shaxsiy suhbatlar',
    'chat.globalRoom': 'Chorvadorlar chati',
    'chat.globalOpen': 'barcha uchun ochiq xona',
    'chat.online': 'kishi onlayn',
    'chat.private': 'Shaxsiy suhbatlar',
    'chat.privateChat': 'Shaxsiy suhbat',
    'chat.noPrivate': "Shaxsiy suhbatlar yo'q",
    'chat.noPrivateHint': 'E\'lon ichidagi "Xabar yozish" tugmasi orqali sotuvchi bilan suhbatni boshlang',
    'chat.startChat': 'Suhbatni boshlang',
    'chat.you': 'Siz: ',
    'chat.inputPlaceholder': 'Xabar yozing...',
    'chat.globalEmpty': "Hozircha xabarlar yo'q",
    'chat.globalEmptyHint': "Birinchi bo'lib salom yozing — barcha chorvadorlar ko'radi",
    'chat.dmEmpty': 'Suhbat boshlanmagan',
    'chat.recording': 'Yozilmoqda...',
    'chat.deleteTitle': "Xabarni o'chirish",
    'chat.deleteBody': "Xabar ikkala tomondan ham butunlay o'chib ketadi. Davom etasizmi?",
    'chat.deleteBodyGlobal': "Xabar umumiy xonadan barcha uchun o'chib ketadi. Davom etasizmi?",
    'chat.delete': "O'chirish",
    'chat.cancel': 'Bekor qilish',
    'chat.msgImage': '📷 Rasm',
    'chat.msgVideo': '🎬 Video',
    'chat.msgAudio': '🎤 Ovozli xabar',
    'chat.msgVideoNote': '📹 Video xabar',
    'chat.videoNote': 'Dumaloq video xabar',
    'chat.videoNoteHint': 'Yuborish uchun yashil tugmani bosing',
    'chat.call': "Qo'ng'iroq qilish",
    'chat.attach': 'Rasm yoki video yuborish',
    'chat.voice': 'Ovozli xabar yozish',
    'chat.send': 'Yuborish',
    // Profil
    'profile.title': 'Profil',
    'profile.logout': 'Chiqish',
    'profile.logoutTitle': 'Hisobdan chiqish',
    'profile.cancel': 'Bekor',
    'profile.verified': 'Tasdiqlangan profil',
    'profile.myListingsStat': "E'lonlarim",
    'profile.savedStat': 'Saqlangan',
    'profile.viewsStat': "Ko'rishlar",
    'profile.myListings': "Mening e'lonlarim",
    'profile.savedListings': "Saqlangan e'lonlar",
    'profile.noListings': "Hali e'lon bermagansiz",
    'profile.noListingsHint': "Birinchi e'loningizni joylang",
    'profile.postListing': "E'lon berish",
    'profile.noSaved': "Saqlangan e'lonlar yo'q",
    'profile.noSavedHint': "Yurak belgisini bosib e'lonlarni saqlang",
    'profile.settings': 'Sozlamalar',
    'profile.language': 'Til',
    'profile.darkMode': 'Tungi rejim',
    'profile.adminContact': "Admin bilan bog'lanish",
    'profile.adminContactHint': "Savol yoki takliflar bo'lsa — bemalol yozing yoki qo'ng'iroq qiling",
    'profile.telegramWrite': 'Telegram orqali yozish',
    'profile.avatarChange': 'Rasmni almashtirish',
    'profile.avatarSaved': 'Profil rasmi yangilandi',
    'profile.nameSaved': 'Ism saqlandi',
  },
  ru: {
    // Нижняя навигация
    'nav.home': 'Главная',
    'nav.chat': 'Чат',
    'nav.post': 'Продать',
    'nav.ai': 'AI помощь',
    'nav.profile': 'Профиль',
    // Чат
    'chat.title': 'Сообщения',
    'chat.subtitle': 'Общий чат и личные переписки с продавцами',
    'chat.globalRoom': 'Чат животноводов',
    'chat.globalOpen': 'открытая комната для всех',
    'chat.online': 'человек онлайн',
    'chat.private': 'Личные чаты',
    'chat.privateChat': 'Личный чат',
    'chat.noPrivate': 'Личных чатов пока нет',
    'chat.noPrivateHint': 'Начните диалог с продавцом через кнопку «Написать» в объявлении',
    'chat.startChat': 'Начните переписку',
    'chat.you': 'Вы: ',
    'chat.inputPlaceholder': 'Напишите сообщение...',
    'chat.globalEmpty': 'Пока нет сообщений',
    'chat.globalEmptyHint': 'Напишите первым — увидят все животноводы',
    'chat.dmEmpty': 'Диалог ещё не начат',
    'chat.recording': 'Запись...',
    'chat.deleteTitle': 'Удалить сообщение',
    'chat.deleteBody': 'Сообщение будет удалено у обеих сторон. Продолжить?',
    'chat.deleteBodyGlobal': 'Сообщение будет удалено из общего чата у всех. Продолжить?',
    'chat.delete': 'Удалить',
    'chat.cancel': 'Отмена',
    'chat.msgImage': '📷 Фото',
    'chat.msgVideo': '🎬 Видео',
    'chat.msgAudio': '🎤 Голосовое сообщение',
    'chat.msgVideoNote': '📹 Видеосообщение',
    'chat.videoNote': 'Круглое видеосообщение',
    'chat.videoNoteHint': 'Нажмите зелёную кнопку для отправки',
    'chat.call': 'Позвонить',
    'chat.attach': 'Отправить фото или видео',
    'chat.voice': 'Записать голосовое',
    'chat.send': 'Отправить',
    // Профиль
    'profile.title': 'Профиль',
    'profile.logout': 'Выйти',
    'profile.logoutTitle': 'Выйти из аккаунта',
    'profile.cancel': 'Отмена',
    'profile.verified': 'Подтверждённый профиль',
    'profile.myListingsStat': 'Объявления',
    'profile.savedStat': 'Сохранённые',
    'profile.viewsStat': 'Просмотры',
    'profile.myListings': 'Мои объявления',
    'profile.savedListings': 'Сохранённые объявления',
    'profile.noListings': 'Вы ещё не публиковали объявления',
    'profile.noListingsHint': 'Разместите первое объявление',
    'profile.postListing': 'Подать объявление',
    'profile.noSaved': 'Нет сохранённых объявлений',
    'profile.noSavedHint': 'Нажимайте на сердечко, чтобы сохранять объявления',
    'profile.settings': 'Настройки',
    'profile.language': 'Язык',
    'profile.darkMode': 'Тёмная тема',
    'profile.adminContact': 'Связаться с админом',
    'profile.adminContactHint': 'Есть вопросы или предложения — пишите или звоните',
    'profile.telegramWrite': 'Написать в Telegram',
    'profile.avatarChange': 'Сменить фото',
    'profile.avatarSaved': 'Фото профиля обновлено',
    'profile.nameSaved': 'Имя сохранено',
  },
};

export const I18nContext = createContext(null);

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Provider tashqarisida chaqirilsa — o'zbekcha zaxira
    return {
      lang: 'uz',
      setLang: () => {},
      theme: 'light',
      setTheme: () => {},
      t: (key) => STRINGS.uz[key] ?? key,
    };
  }
  return ctx;
}
