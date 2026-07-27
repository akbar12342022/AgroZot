import { request, saveSession, clearSession, getToken, getStoredUser } from './client';

// ─── Oddiy kirish (SMS tasdiqlashsiz) ───
// Oqim: registerUser(ism, raqam, survey) → backend raqam bo'yicha foydalanuvchini
// topadi/yaratadi va JWT sessiya qaytaradi → sessiya localStorage'da saqlanadi.

/**
 * Ro'yxatdan o'tish / kirish — ism va telefon raqam bilan, darhol.
 * phone — istalgan ko'rinishda bo'lishi mumkin (+998 90 123 45 67);
 * yuborishdan oldin bo'sh joylardan tozalanadi, backend uni +998XXXXXXXXX
 * formatiga keltiradi. survey — onboarding javoblari (ixtiyoriy).
 */
export async function registerUser(name, phone, survey) {
  const formattedPhone = phone.replace(/\s+/g, '');
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: { name, phone: formattedPhone, ...(survey ? { survey } : {}) },
  });
  saveSession(data.token, data.user);
  return data.user;
}

// ─── Sessiya yordamchilari ───
export const logout = () => clearSession();
export const isLoggedIn = () => !!getToken();
export const currentUser = () => getStoredUser();

/** Saqlangan foydalanuvchi ma'lumotini qisman yangilash (masalan, yangi avatar) */
export function patchStoredUser(patch) {
  const user = getStoredUser();
  if (!user) return null;
  const updated = { ...user, ...patch };
  saveSession(getToken(), updated);
  return updated;
}
