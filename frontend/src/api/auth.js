import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import { request, saveSession, clearSession, getToken, getStoredUser } from './client';

// ─── Firebase Phone Auth (SMS orqali raqamni tasdiqlash) ───
// Oqim: sendSmsCode(raqam) → SMS keladi → confirmSmsAndRegister(kod, ism, survey)
// Kod tasdiqlangach Firebase ID token backendga yuboriladi; backend raqamni
// tokendan olib, bazada topadi/yaratadi va o'zining JWT sessiyasini qaytaradi.

let recaptchaVerifier = null;

/** Ko'rinmas reCAPTCHA — Firebase telefon autentifikatsiyasining majburiy talabi.
 *  containerId — sahifada doim mavjud bo'lgan bo'sh div (RegisterScreen ichida). */
function getRecaptcha(containerId = 'recaptcha-container') {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, { size: 'invisible' });
  }
  return recaptchaVerifier;
}

/** Xatolikdan so'ng reCAPTCHA ni qayta yaratish uchun tozalash */
export function resetRecaptcha() {
  try {
    recaptchaVerifier?.clear();
  } catch {
    /* ignore */
  }
  recaptchaVerifier = null;
}

/** Firebase xato kodlarini foydalanuvchiga tushunarli matnga o'girish */
export function firebaseErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-phone-number':
      return "Telefon raqam noto'g'ri. Masalan: +998 90 123 45 67";
    case 'auth/too-many-requests':
      return "Juda ko'p urinish bo'ldi. Birozdan so'ng qayta urinib ko'ring.";
    case 'auth/invalid-verification-code':
      return "Kod noto'g'ri. SMS dagi 6 xonali kodni tekshirib, qayta kiriting.";
    case 'auth/code-expired':
      return "Kod muddati tugadi. Yangi kod so'rang.";
    case 'auth/network-request-failed':
      return "Internet aloqasi uzildi. Qayta urinib ko'ring.";
    case 'auth/billing-not-enabled':
    case 'auth/quota-exceeded':
      return 'SMS yuborish vaqtincha ishlamayapti. Administratorga murojaat qiling.';
    default:
      return null;
  }
}

/**
 * 1-qadam: raqamga tasdiqlash SMS kodini yuborish.
 * phoneE164 — xalqaro formatda (+998901234567).
 * Qaytgan confirmation obyekti 2-qadamda kerak bo'ladi.
 */
export async function sendSmsCode(phoneE164) {
  // Raqam ichidagi bo'sh joylar Firebase'da "invalid-phone-number" xatosiga olib keladi
  const formattedPhone = phoneE164.replace(/\s+/g, '');
  firebaseAuth.useDeviceLanguage();
  try {
    return await signInWithPhoneNumber(firebaseAuth, formattedPhone, getRecaptcha());
  } catch (error) {
    console.error('SMS kod yuborishda xatolik:', error);
    // reCAPTCHA sessiyasi kuygan bo'lishi mumkin — keyingi urinish uchun yangilaymiz
    resetRecaptcha();
    throw new Error(firebaseErrorMessage(error) || "SMS yuborib bo'lmadi. Qayta urinib ko'ring.");
  }
}

/**
 * 2-qadam: SMS kodni tasdiqlash va backendda ro'yxatdan o'tish/kirish.
 * Tasdiqlangan Firebase ID token Authorization sarlavhasida yuboriladi —
 * telefon raqam backendga alohida yuborilmaydi (tokenning ichida).
 */
export async function confirmSmsAndRegister(confirmation, code, name, survey) {
  let idToken;
  try {
    const credential = await confirmation.confirm(code);
    idToken = await credential.user.getIdToken();
  } catch (error) {
    console.error('SMS kodni tasdiqlashda xatolik:', error);
    throw new Error(firebaseErrorMessage(error) || "Kodni tasdiqlab bo'lmadi. Qayta urinib ko'ring.");
  }

  const data = await request('/api/auth/register', {
    method: 'POST',
    body: { name, ...(survey ? { survey } : {}) },
    headers: { Authorization: `Bearer ${idToken}` },
  });
  saveSession(data.token, data.user);
  return data.user;
}

// ─── Sessiya yordamchilari (o'zgarishsiz) ───
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
