import { request } from './client';

/**
 * Shikoyat / murojaat yuborish. Admin panelida ko'rinadi; admin javob berganda
 * javob "Qo'llab-quvvatlash (Admin)" nomidan foydalanuvchi chatiga keladi.
 * targetType: 'ANIMAL' | 'USER' | 'OTHER'.
 */
export const submitReport = (reason, targetType = 'OTHER', targetId) =>
  request('/api/reports', {
    method: 'POST',
    auth: true,
    body: { reason, targetType, ...(targetId ? { targetId } : {}) },
  });
