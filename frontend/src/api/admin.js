import { request } from './client';

// Admin panel so'rovlari — barcha so'rovlarga x-admin-key sarlavhasi qo'shiladi.

const withKey = (key) => ({ headers: { 'x-admin-key': key } });

/** Kalit to'g'riligini tekshirish */
export const adminPing = (key) => request('/api/admin/ping', withKey(key));

/** Foydalanuvchilar ro'yxati (qidiruv bilan) */
export const adminUsers = (key, q = '') =>
  request(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`, withKey(key));

/** Foydalanuvchi AI tarifini o'zgartirish */
export const adminSetPlan = (key, userId, plan) =>
  request(`/api/admin/users/${userId}/plan`, {
    method: 'PUT',
    body: { plan },
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
