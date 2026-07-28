import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { preloadAI } from './aiAssets';

const FREE_LIMIT = 3;
const KEY_FREE = 'chorva_ai_free';
const KEY_SUB = 'chorva_ai_sub';
const KEY_ONB = 'chorva_ai_onboarded';
const KEY_TYPE = 'chorva_ai_type';

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

const AIContext = createContext(null);
export const useAI = () => useContext(AIContext);

/**
 * Chorva AI global holati — bepul so'rovlar limiti (3 ta), obuna holati,
 * onboarding va modal koordinatsiyasi. Barchasi localStorage'da saqlanadi.
 */
export function AIProvider({ children }) {
  const [freeLeft, setFreeLeft] = useState(() => {
    const n = parseInt(read(KEY_FREE, String(FREE_LIMIT)), 10);
    return Number.isFinite(n) ? Math.max(0, n) : FREE_LIMIT;
  });
  const [isSubscribed, setIsSubscribed] = useState(() => read(KEY_SUB, '0') === '1');
  const [onboarded, setOnboarded] = useState(() => read(KEY_ONB, '0') === '1');
  const [userType, setUserType] = useState(() => read(KEY_TYPE, ''));

  // Modal / effekt holatlari (saqlanmaydi)
  const [chatOpen, setChatOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  // Har bir holatni localStorage'ga saqlash.
  // MUHIM: useEffect callback'i faqat cleanup funksiyasini yoki `undefined` qaytarishi
  // mumkin. Shuning uchun blok tanadan `{ ... }` foydalanamiz — implicit return YO'Q.
  // Ilgari oxirgi effekt `() => userType && write(...)` ko'rinishida edi: userType bo'sh
  // ('') bo'lganda `'' && ...` bo'sh satr ('') qaytarardi. React uni cleanup deb bilib,
  // keyingi ishga tushishda `''()` deb chaqirishga urinardi →
  // "destroy is not a function" → <AIProvider> qulaydi → butun sayt oq ekran.
  useEffect(() => {
    write(KEY_FREE, String(freeLeft));
  }, [freeLeft]);
  useEffect(() => {
    write(KEY_SUB, isSubscribed ? '1' : '0');
  }, [isSubscribed]);
  useEffect(() => {
    write(KEY_ONB, onboarded ? '1' : '0');
  }, [onboarded]);
  useEffect(() => {
    if (userType) write(KEY_TYPE, userType);
  }, [userType]);

  useEffect(() => {
    preloadAI();
  }, []);

  const hasQuota = isSubscribed || freeLeft > 0;

  // So'rovni "sarflash": ruxsat bo'lsa true qaytaradi va limitni kamaytiradi.
  // Ruxsat bo'lmasa false — chaqiruvchi (sad + paywall) mantiqini o'zi boshqaradi.
  const consume = useCallback(() => {
    if (isSubscribed) return true;
    if (freeLeft > 0) {
      setFreeLeft((n) => Math.max(0, n - 1));
      return true;
    }
    return false;
  }, [isSubscribed, freeLeft]);

  const subscribe = useCallback(() => {
    setIsSubscribed(true);
    setPaywallOpen(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 1100);
  }, []);

  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const completeOnboarding = useCallback((type) => {
    if (type) setUserType(type);
    setOnboarded(true);
  }, []);

  // Dev/qayta test uchun — hammasini boshlang'ich holatga qaytarish
  const resetAI = useCallback(() => {
    setFreeLeft(FREE_LIMIT);
    setIsSubscribed(false);
    setOnboarded(false);
    setUserType('');
  }, []);

  const value = useMemo(
    () => ({
      FREE_LIMIT,
      freeLeft,
      isSubscribed,
      hasQuota,
      onboarded,
      userType,
      chatOpen,
      paywallOpen,
      flash,
      consume,
      subscribe,
      openChat,
      closeChat,
      openPaywall,
      closePaywall,
      completeOnboarding,
      resetAI,
    }),
    [
      freeLeft,
      isSubscribed,
      hasQuota,
      onboarded,
      userType,
      chatOpen,
      paywallOpen,
      flash,
      consume,
      subscribe,
      openChat,
      closeChat,
      openPaywall,
      closePaywall,
      completeOnboarding,
      resetAI,
    ]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}
