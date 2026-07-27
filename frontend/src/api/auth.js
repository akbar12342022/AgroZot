import { request, saveSession, clearSession, getToken, getStoredUser } from './client';

/**
 * Ro'yxatdan o'tish / kirish (ism + telefon).
 * survey — onboarding so'rovnomasi javoblari ({role, interests, source}), ixtiyoriy.
 */
export async function register(name, phone, survey) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: { name, phone, ...(survey ? { survey } : {}) },
  });
  saveSession(data.token, data.user);
  return data.user;
}

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
