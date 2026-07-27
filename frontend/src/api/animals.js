import { request } from './client';

/** Bo'sh/keraksiz parametrlarni olib tashlash */
function cleanParams(params) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  });
  return out;
}

/** E'lonlar ro'yxati (filtrlash, qidirish, saralash, sahifalash) */
export function fetchAnimals({ category, region, district, search, sort, page = 1, limit = 10 } = {}) {
  const params = cleanParams({
    category: category === 'all' ? undefined : category,
    region: region === 'Barcha hududlar' ? undefined : region,
    district,
    q: search,
    sort: sort === 'newest' ? undefined : sort,
    page,
    limit,
  });
  const query = new URLSearchParams(params).toString();
  return request(`/api/animals?${query}`);
}

/** Bitta e'lon */
export const fetchAnimalById = (id) => request(`/api/animals/${id}`);

/** Mening e'lonlarim */
export const fetchMyAnimals = () => request('/api/animals/my', { auth: true });

/** Yangi e'lon yaratish */
export const createAnimal = (data) =>
  request('/api/animals', { method: 'POST', body: data, auth: true });

/** E'lonni tahrirlash */
export const updateAnimal = (id, data) =>
  request(`/api/animals/${id}`, { method: 'PUT', body: data, auth: true });

/** E'lonni o'chirish */
export const deleteAnimal = (id) =>
  request(`/api/animals/${id}`, { method: 'DELETE', auth: true });

/** Joriy foydalanuvchi profili */
export const fetchMe = () => request('/api/users/me', { auth: true });

/** Profil ismini yangilash */
export const updateMyName = (firstName) =>
  request('/api/users/me', { method: 'PUT', body: { firstName }, auth: true });

/** Profil avatarini yangilash (avval /api/upload/media orqali yuklanadi) */
export const updateMyAvatar = (avatarUrl) =>
  request('/api/users/me', { method: 'PUT', body: { avatarUrl }, auth: true });

/** AI yordamchi bilan suhbat (tarix va rasm bilan) */
export const aiChat = ({ message, history, imageUrl }) =>
  request('/api/ai/chat', { method: 'POST', body: { message, history, imageUrl }, auth: true });

/** AI rejimi holati */
export const aiStatus = () => request('/api/ai/status');

/** Joriy foydalanuvchining AI tarifi va bugungi limitlari */
export const aiAccess = () => request('/api/ai/access', { auth: true });

/** E'lon rasmlarini yuklash — { urls: [...] } qaytaradi */
export function uploadImages(files) {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  return request('/api/upload', { method: 'POST', body: form, auth: true, isForm: true });
}
