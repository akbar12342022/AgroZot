// Web Push obunasi — Service Worker + VAPID (Firebase o'rniga).
import { getToken, request } from './client';

/** VAPID ochiq kalitini (base64url) Uint8Array ga aylantirish */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/** Brauzer push bildirishnomalarni qo'llab-quvvatlaydimi */
export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Service Workerni ro'yxatdan o'tkazish */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.warn("[push] Service Worker ro'yxatdan o'tmadi:", e.message);
    return null;
  }
}

/**
 * Push bildirishnomalarga obuna bo'lish. Foydalanuvchi kirgach chaqiriladi.
 * Notification ruxsati so'raladi; rad etilsa yoki qo'llab-quvvatlanmasa — jimgina false.
 */
export async function subscribeToPush() {
  if (!pushSupported() || !getToken()) return false;
  try {
    const reg = await registerServiceWorker();
    if (!reg) return false;
    await navigator.serviceWorker.ready;

    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const { publicKey } = await request('/api/push/vapid');
    if (!publicKey) return false;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = sub.toJSON();
    await request('/api/push/subscribe', {
      method: 'POST',
      auth: true,
      body: { endpoint: json.endpoint, keys: json.keys },
    });
    return true;
  } catch (e) {
    console.warn("[push] Obuna bo'lmadi:", e.message);
    return false;
  }
}
