import { Component } from 'react';

/**
 * Ilova daraxtidagi har qanday render/lifecycle xatosini ushlab qoladi va oq ekran
 * o'rniga foydalanuvchiga tushunarli xabar + "Qayta yuklash" tugmasini ko'rsatadi.
 *
 * Providerlardan ham TASHQARIDA turadi (main.jsx ga qarang) — shu sabab provider
 * ichidagi xato ham (masalan <AIProvider>) butun saytni oq ekranga aylantirmaydi.
 *
 * Error Boundary faqat class komponent bo'lishi mumkin — React'da hook varianti yo'q.
 * Ataylab hech qanday tashqi kutubxonaga (framer-motion va h.k.) bog'liq emas:
 * "so'nggi himoya chizig'i" hech qachon o'zi qulamasligi kerak.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // To'liq sabab konsolda qoladi (monitoring/diagnostika uchun)
    console.error('[Chorvabozor] Ilovada ushlangan xato:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1520] px-6 text-center">
        <div className="max-w-md">
          <div className="text-5xl mb-4" role="img" aria-label="ogohlantirish">
            🐄
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Kutilmagan xatolik yuz berdi
          </h1>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
            Sahifani qayta yuklab ko'ring. Muammo takrorlansa, birozdan so'ng yana urinib
            ko'ring — ma'lumotlaringiz saqlanib qoladi.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2"
          >
            Qayta yuklash
          </button>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 max-h-48 overflow-auto rounded-lg bg-slate-100 dark:bg-slate-800/60 p-3 text-left text-xs text-red-600 dark:text-red-400">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
