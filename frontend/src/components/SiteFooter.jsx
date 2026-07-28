import { useState } from 'react';
import { Send, ShieldCheck, Phone, Mail, X } from 'lucide-react';
import { InstagramIcon, YoutubeIcon } from './icons';

// Havolalar ochadigan ma'lumot oynasi matnlari (rasmiy ko'rinish uchun)
const INFO = {
  about: {
    title: 'Biz haqimizda',
    body: [
      "Chorvabozor — O'zbekistondagi chorvadorlar, fermerlar va yem-hashak sotuvchilarini bir joyda birlashtiruvchi zamonaviy onlayn bozor.",
      "Bizning maqsadimiz — hayvon va qishloq xo'jaligi mahsulotlari oldi-sotdisini xavfsiz, tez va ishonchli qilish. Har bir sotuvchi profili tekshiriladi va tasdiqlangan sotuvchilar maxsus belgi bilan ajratiladi.",
      "Platforma orqali e'lon joylashingiz, sotuvchilar bilan bevosita bog'lanishingiz hamda AI yordamchidan veterinariya va bozor narxlari bo'yicha maslahat olishingiz mumkin.",
    ],
  },
  privacy: {
    title: 'Maxfiylik siyosati',
    body: [
      "Sizning shaxsiy ma'lumotlaringiz (ism, telefon raqami, joylashuv) faqat platformadan foydalanish va sotuvchi–xaridor aloqasini ta'minlash uchun ishlatiladi.",
      "Ma'lumotlaringiz uchinchi shaxslarga sotilmaydi va reklama maqsadida oshkor qilinmaydi. Telefon raqamingiz faqat siz e'lon joylaganingizda yoki suhbatga rozilik berganingizda ko'rinadi.",
      "Hisobingizni istalgan vaqtda o'chirishingiz mumkin — bunda barcha shaxsiy ma'lumotlaringiz tizimdan olib tashlanadi.",
    ],
  },
  terms: {
    title: 'Foydalanish shartlari',
    body: [
      "Chorvabozor'dan foydalanish orqali siz haqiqiy va aniq ma'lumot joylashga rozilik bildirasiz. Soxta e'lonlar, aldov yoki noqonuniy hayvon savdosi qat'iyan taqiqlanadi.",
      "Har bir foydalanuvchi o'z e'loni mazmuni va bitim shartlari uchun shaxsan javobgardir. Chorvabozor vositachi platforma bo'lib, tomonlar o'rtasidagi to'lov va yetkazib berishga aralashmaydi.",
      "Qoidalarni buzgan hisoblar ogohlantirishsiz bloklanishi mumkin.",
    ],
  },
  support: {
    title: "Qo'llab-quvvatlash xizmati",
    body: [
      "Savol, taklif yoki muammo yuzasidan bizning qo'llab-quvvatlash jamoamizga murojaat qiling — ish kunlari 9:00 dan 18:00 gacha javob beramiz.",
      "Telegram: @chorvabozor_support",
      "Telefon: +998 71 200 00 00",
      "Email: yordam@chorvabozor.uz",
    ],
  },
};

const SOCIALS = [
  { key: 'tg', label: 'Telegram', href: 'https://t.me/chorvabozor', Icon: Send },
  { key: 'ig', label: 'Instagram', href: 'https://instagram.com/chorvabozor', Icon: InstagramIcon },
  { key: 'yt', label: 'YouTube', href: 'https://youtube.com/@chorvabozor', Icon: YoutubeIcon },
];

function FooterLink({ children, onClick }) {
  return (
    <li>
      <button onClick={onClick} className="footer-link text-[13px] text-left">
        {children}
      </button>
    </li>
  );
}

export default function SiteFooter() {
  const [info, setInfo] = useState(null); // INFO kaliti

  const data = info ? INFO[info] : null;

  return (
    <footer className="site-footer mt-2">
      <div className="px-6 pt-10 pb-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-9">
          {/* Brend bloki */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-[#FFFFFF] ring-1 ring-black/[0.07] flex items-center justify-center shrink-0">
                <img src="/assets/logo-clean.png" alt="Chorvabozor" className="w-8 h-8 object-contain" />
              </span>
              <div className="leading-none">
                <p className="text-lg font-extrabold text-white">Chorvabozor</p>
                <p className="text-[10px] uppercase tracking-wider text-emerald-300/90 font-semibold mt-1">
                  zamonaviy chorva bozori
                </p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-white/65">
              Tasdiqlangan sotuvchilar bilan xavfsiz oldi-sotdi — hayvon, yem-hashak va jihozlar bir
              joyda.
            </p>

            {/* Ijtimoiy tarmoqlar */}
            <div className="flex items-center gap-2.5 mt-5">
              {SOCIALS.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="footer-social w-9 h-9 rounded-xl flex items-center justify-center text-white"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Havolalar ustunlari */}
          <div className="flex gap-10 sm:gap-16">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3.5">
                Kompaniya
              </h4>
              <ul className="space-y-2.5">
                <FooterLink onClick={() => setInfo('about')}>Biz haqimizda</FooterLink>
                <FooterLink onClick={() => setInfo('support')}>Aloqa</FooterLink>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3.5">
                Yordam
              </h4>
              <ul className="space-y-2.5">
                <FooterLink onClick={() => setInfo('support')}>Qo'llab-quvvatlash xizmati</FooterLink>
                <FooterLink onClick={() => setInfo('privacy')}>Maxfiylik siyosati</FooterLink>
                <FooterLink onClick={() => setInfo('terms')}>Foydalanish shartlari</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* Ishonch qatori */}
        <div className="mt-8 flex items-center gap-2 text-[12px] text-emerald-300/90 font-medium">
          <ShieldCheck size={15} />
          Tasdiqlangan sotuvchilar · Xavfsiz muloqot · O'zbekiston bo'ylab
        </div>

        {/* Ajratuvchi + pastki qator */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-[12px] text-white/55">
            © 2026 Chorvabozor. Barcha huquqlar himoyalangan.
          </p>
          <p className="text-[12px] text-white/45">O'zbekistonda ishlab chiqilgan 🇺🇿</p>
        </div>
      </div>

      {/* Ma'lumot oynasi */}
      {data && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setInfo(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full sm:max-w-lg max-h-[85dvh] overflow-y-auto scrollbar-hide bg-white rounded-t-3xl sm:rounded-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-brand">{data.title}</h3>
              <button
                onClick={() => setInfo(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                aria-label="Yopish"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-3">
              {data.body.map((para, i) => {
                const isContact = /^(Telegram|Telefon|Email):/.test(para);
                return (
                  <p
                    key={i}
                    className={`text-[13.5px] leading-relaxed ${
                      isContact ? 'font-semibold text-brand-green-dark flex items-center gap-2' : 'text-slate-600'
                    }`}
                  >
                    {isContact && /Telefon/.test(para) && <Phone size={14} className="shrink-0" />}
                    {isContact && /Email/.test(para) && <Mail size={14} className="shrink-0" />}
                    {isContact && /Telegram/.test(para) && <Send size={14} className="shrink-0" />}
                    {para}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
