import { PlusCircle } from 'lucide-react';
import { BOTTOM_TABS } from '../constants/data';
import { useI18n } from '../i18n.js';

/** Pastki navigatsiya paneli */
export default function BottomNav({ activeTab, onTabChange, unreadTotal = 0 }) {
  const { t } = useI18n();
  const activeIndex = BOTTOM_TABS.findIndex((tab) => tab.id === activeTab);
  // Har bir tugma flex-1 bilan teng joy egallaydi — indikator markazi shu slotning o'rtasi
  const slotWidth = 100 / BOTTOM_TABS.length;

  return (
    <nav className="glass-nav absolute bottom-0 left-0 right-0 border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom,0px)] z-40">
      <div className="relative flex items-stretch">
        {/* Sirg'aluvchi faol indikator — barcha tablar (E'lon ham) ustida bir xil balandlikda va qat'iy markazda */}
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-[1px] h-[2px] w-8 -translate-x-1/2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(22,163,74,0.6)] transition-all duration-300 ease-out"
            style={{ left: `${(activeIndex + 0.5) * slotWidth}%` }}
          />
        )}

        {BOTTOM_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isPost = tab.id === 'post';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-0 flex flex-col items-center py-2 transition-colors duration-300 ${
                isPost ? '' : isActive ? 'text-brand-green' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {isPost ? (
                <div
                  className={`w-11 h-11 -mt-5 rounded-full bg-brand-green flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
                    isActive ? 'shadow-brand-green/50 scale-105' : 'shadow-brand-green/30'
                  }`}
                >
                  <PlusCircle size={22} />
                </div>
              ) : (
                <span className="relative">
                  <tab.icon size={20} />
                  {/* Chat ikonkasidagi o'qilmagan xabarlar soni (qizil badge) */}
                  {tab.id === 'chat' && unreadTotal > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white leading-none">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </span>
              )}
              <span className={`text-[10px] mt-1 truncate max-w-full ${isPost ? 'text-brand-green font-medium' : ''}`}>
                {t(`nav.${tab.id}`)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
