import AIOnboarding from './AIOnboarding';
import PremiumAIModal from './PremiumAIModal';

/**
 * Chorva AI ildiz komponenti — onboarding (salomlashuv) va Premium paywall modali.
 *
 * MUHIM: ilgari bu yerda suzuvchi AILauncher + AIChat overlay ham bor edi. Pastki
 * navigatsiyada "AI Yordam" bo'limi bo'lgani uchun ikkita AI kirish nuqtasi chalkashlik
 * tug'dirardi — suzuvchi widget va overlay chat butunlay olib tashlandi. AI chat faqat
 * pastki navbar orqali ochiladi (App.jsx, activeTab === 'ai').
 *
 * PremiumAIModal esa chat emas — DetailModal ichidagi "AI tahlil" (AIAnalyze) bepul
 * limiti tugaganda openPaywall() orqali ochiladigan obuna oynasi, shuning uchun qoladi.
 *
 * enabled — salomlashuv modali ko'rinishi mumkin bo'lgan payt. App.jsx buni FAQAT
 *           foydalanuvchi shu sessiyada ro'yxatdan o'tgach (justRegistered) va splash
 *           tugagach true qiladi. Bir marta ko'rsatilgani localStorage'dagi
 *           `hasSeenOnboarding` kaliti orqali eslab qolinadi (AIContext).
 */
export default function AIRoot({ enabled = false }) {
  return (
    <>
      <AIOnboarding enabled={enabled} />
      <PremiumAIModal />
    </>
  );
}
