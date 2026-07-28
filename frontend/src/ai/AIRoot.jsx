import { useAI } from './AIContext';
import AIOnboarding from './AIOnboarding';
import AILauncher from './AILauncher';
import AIChat from './AIChat';
import PremiumAIModal from './PremiumAIModal';

/**
 * Barcha Chorva AI overlaylarini bir joyda yig'adi. Ilova ildizida bir marta mount qilinadi.
 *
 * enabled — onboarding personaji (salom) ko'rinishi uchun (splash tugagach yoki kirmagan
 *           foydalanuvchida darhol true).
 * authed  — suzuvchi chat launcher + chat + paywall FAQAT tizimga kirgan foydalanuvchi
 *           uchun. Sabab: (1) `/api/ai/chat` auth:true — kirmagan mehmon so'rovi 401 qaytarib,
 *           ro'yxatdan o'tish jarayonini buzardi; (2) launcher pastki navigatsiya ustiga
 *           joylashgan, u esa faqat asosiy ilovada bor. Onboarding SALOMI esa hammaga chiqadi.
 */
export default function AIRoot({ enabled = true, authed = true }) {
  const { flash } = useAI();
  return (
    <>
      {/* Salomlashuvchi personaj — LOGIN HOLATIDAN QAT'I NAZAR hammaga */}
      <AIOnboarding enabled={enabled} />

      {/* Chat tajribasi — faqat kirgan foydalanuvchi uchun */}
      {authed && (
        <>
          <AILauncher />
          <AIChat />
          <PremiumAIModal />
          {/* Obuna bo'lgandagi yashil chaqnash */}
          {flash && <div className="ai-flash fixed inset-0 z-[400] pointer-events-none" />}
        </>
      )}
    </>
  );
}
