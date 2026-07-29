import { request } from './client';

// Admin panel so'rovlari — barcha so'rovlarga x-admin-key sarlavhasi qo'shiladi.

const withKey = (key) => ({ headers: { 'x-admin-key': key } });

/** Kalit to'g'riligini tekshirish */
export const adminPing = (key) => request('/api/admin/ping', withKey(key));

/** Foydalanuvchilar ro'yxati (qidiruv bilan) */
export const adminUsers = (key, q = '') =>
  request(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`, withKey(key));

/** Dashboard statistikasi (foydalanuvchilar, onlayn, e'lonlar, so'rovnoma tahlili) */
export const adminStats = (key) => request('/api/admin/stats', withKey(key));

/**
 * Foydalanuvchi AI tarifini/obunasini o'zgartirish.
 * days berilsa — obuna shu kundan boshlab days kunga amal qiladi.
 */
export const adminSetPlan = (key, userId, plan, days = null) =>
  request(`/api/admin/users/${userId}/plan`, {
    method: 'PUT',
    body: days ? { plan, days } : { plan },
    ...withKey(key),
  });

/** Moderatsiya: e'lonlar ro'yxati (status: 'PENDING' | 'ACTIVE' | 'REJECTED') */
export const adminAnimals = (key, status = 'PENDING') =>
  request(`/api/admin/animals?status=${status}`, withKey(key));

/** Moderatsiya: e'lonni qabul qilish (ACTIVE) yoki rad etish (REJECTED) */
export const adminSetAnimalStatus = (key, animalId, status) =>
  request(`/api/admin/animals/${animalId}/status`, {
    method: 'PUT',
    body: { status },
    ...withKey(key),
  });

/** Tasdiqlangan profil belgisini yoqish/o'chirish */
export const adminSetVerified = (key, userId, isVerified) =>
  request(`/api/admin/users/${userId}/verified`, {
    method: 'PUT',
    body: { isVerified },
    ...withKey(key),
  });

/** Foydalanuvchini butunlay o'chirish (e'lonlari va xabarlari bilan) */
export const adminDeleteUser = (key, userId) =>
  request(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    ...withKey(key),
  });

/** Kelgan shikoyatlar ro'yxati (status: 'OPEN' | 'RESOLVED' | '') */
export const adminReports = (key, status = '') =>
  request(`/api/admin/reports${status ? `?status=${status}` : ''}`, withKey(key));

/** Shikoyatga javob berish — foydalanuvchiga support chatidan xabar boradi */
export const adminReplyReport = (key, reportId, reply) =>
  request(`/api/admin/reports/${reportId}/reply`, {
    method: 'POST',
    body: { reply },
    ...withKey(key),
  });
