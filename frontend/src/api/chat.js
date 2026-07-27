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
