// Firebase ilovasini ishga tushirish.
// Kalitlar kodda emas — frontend/.env dagi VITE_FIREBASE_* o'zgaruvchilaridan olinadi.
// Auth komponentlarda:  import { auth } from '../firebase';
// Firestore uchun:      import { db } from '../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "[AgroZot] Firebase sozlamalari topilmadi. frontend/.env fayliga VITE_FIREBASE_* " +
      "o'zgaruvchilarini qo'shing (Netlify'da esa Environment variables bo'limiga) va qayta build qiling."
  );
}

export const app = initializeApp(firebaseConfig);

// Autentifikatsiya va Firestore — komponentlar shulardan foydalanadi
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics ba'zi muhitlarda (masalan, Telegram webview) ishlamaydi — avval tekshiramiz
export let analytics = null;
if (firebaseConfig.measurementId) {
  analyticsSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(app);
    })
    .catch(() => {});
}
