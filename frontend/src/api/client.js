export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Production buildda API manzili localhost bo'lib qolsa, sabab darhol konsolda ko'rinsin
if (import.meta.env.PROD && /localhost|127\.0\.0\.1/.test(API_URL)) {
  console.error(
    `[AgroZot] VITE_API_URL xato: "${API_URL}". Netlify'da Site configuration → ` +
      "Environment variables bo'limiga backend'ning ochiq HTTPS manzilini qo'shib, qayta deploy qiling."
  );
}

const TOKEN_KEY = 'agrozot_token';
const USER_KEY = 'agrozot_user';

// ─── Sessiya (token + foydalanuvchi) ───
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* localStorage mavjud emas */
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
};

/** Backenddan kelgan nisbiy fayl yo'llarini (/uploads/...) to'liq URL ga aylantirish */
export function resolveImageUrl(src) {
  if (!src) return null;
  if (src.startsWith('/uploads')) return `${API_URL}${src}`;
  return src;
}

/**
 * Umumiy so'rov funksiyasi.
 * auth=true bo'lsa JWT token headerga qo'shiladi.
 * isForm=true bo'lsa body FormData sifatida yuboriladi.
 * headers orqali qo'shimcha sarlavhalar berish mumkin (masalan, admin kaliti).
 * 401 kelsa sessiya tozalanib, ro'yxatdan o'tish ekraniga qaytariladi.
 * Xatolikda Error obyektiga server bergan `code` va HTTP `status` biriktiriladi.
 */
export async function request(
  path,
  { method = 'GET', body, auth = false, isForm = false, headers: extraHeaders } = {}
) {
  const headers = { ...(extraHeaders || {}) };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    // Asl sabab (CORS, DNS, mixed-content va h.k.) konsolda ko'rinadi
    console.error(`[AgroZot] API so'rovi uzildi: ${method} ${API_URL}${path}`, error);
    throw new Error("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && auth) {
    clearSession();
    window.dispatchEvent(new Event('agrozot:logout'));
  }

  if (!res.ok) {
    const err = new Error(data.error || `Server xatosi (${res.status})`);
    err.code = data.code || null;
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
