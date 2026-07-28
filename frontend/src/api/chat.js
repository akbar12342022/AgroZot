import { io } from 'socket.io-client';
import { API_URL, getToken, request } from './client';

/** Umumiy xona tarixini olish */
export const fetchChatHistory = (before) =>
  request(`/api/chat/messages${before ? `?before=${before}` : ''}`, { auth: true });

/** Sotuvchi bilan 1-ga-1 suhbatni ochish (mavjud bo'lsa — o'shani qaytaradi) */
export const openDirectChat = (userId) =>
  request('/api/chat/direct', { method: 'POST', body: { userId }, auth: true });

/** Mening shaxsiy suhbatlarim ro'yxati */
export const fetchMyChats = () => request('/api/chat/chats', { auth: true });

/** Shaxsiy suhbat tarixini olish */
export const fetchDirectMessages = (chatId, before) =>
  request(`/api/chat/chats/${chatId}/messages${before ? `?before=${before}` : ''}`, { auth: true });

/** Jami o'qilmagan xabarlar soni (navbar badge uchun) */
export const fetchUnreadTotal = () => request('/api/chat/unread-total', { auth: true });

/** Socket.IO ulanishini ochish (JWT bilan) */
export function connectChat() {
  return io(API_URL, {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
  });
}

/** Chat/AI uchun bitta media fayl yuklash — { url, mediaType } qaytaradi */
export function uploadMedia(file) {
  const form = new FormData();
  form.append('media', file);
  return request('/api/upload/media', { method: 'POST', body: form, auth: true, isForm: true });
}

/**
 * Media faylni yuklash progress bilan (0-100%). fetch upload progressni bermaydi,
 * shuning uchun XHR ishlatiladi. onProgress(percent) — yuklash jarayonida chaqiriladi.
 */
export function uploadMediaWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('media', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/upload/media`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || `Yuklash xatosi (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring."));
    xhr.send(form);
  });
}
