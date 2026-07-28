import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2, Sparkles, Crown } from 'lucide-react';
import { useAI } from './AIContext';
import AIPersona from './AIPersona';
import { getChatReply } from './aiReply';

const GREETING = {
  sender: 'ai',
  text: "Salom! Men Chorva AI — chorva sog'lig'i, ratsion, zot va bozor narxlari bo'yicha yordam beraman. Nima bilan qiziqasiz?",
};

export default function AIChat() {
  const { chatOpen, closeChat, consume, openPaywall, isSubscribed, freeLeft } = useAI();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [mood, setMood] = useState('idle');
  const endRef = useRef(null);
  const wasSubscribed = useRef(isSubscribed);

  const pushMsg = (m) => setMessages((prev) => [...prev, m]);

  useEffect(() => {
    if (chatOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking, chatOpen]);

  // Obuna bo'lgach — quvonch va suhbatni davom ettirish
  useEffect(() => {
    if (isSubscribed && !wasSubscribed.current) {
      wasSubscribed.current = true;
      setMood('success');
      pushMsg({ sender: 'ai', text: "Rahmat! Endi cheksiz suhbatlashamiz 🎉 Xo'sh, davom etamizmi?" });
      setTimeout(() => setMood('talking'), 1400);
      setTimeout(() => setMood('idle'), 3200);
    }
    wasSubscribed.current = isSubscribed;
  }, [isSubscribed]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;

    // Limit tekshiruvi
    if (!consume()) {
      setInput('');
      pushMsg({ sender: 'user', text });
      setMood('sad');
      setTimeout(() => {
        pushMsg({
          sender: 'ai',
          text:
            "Afsuski, bepul limitlaringiz tugadi 😔 Suhbatni cheksiz davom ettirish uchun Chorva AI Premiumga o'ting.",
        });
      }, 350);
      setTimeout(() => openPaywall(), 1200);
      return;
    }

    setInput('');
    pushMsg({ sender: 'user', text });
    setThinking(true);
    setMood('talking');

    const history = messages
      .slice(-10)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

    try {
      const reply = await getChatReply(text, history);
      pushMsg({ sender: 'ai', text: reply });
    } catch {
      pushMsg({ sender: 'ai', text: "Kechirasiz, javob berishda xatolik. Birozdan so'ng qayta urinib ko'ring." });
    } finally {
      setThinking(false);
      setMood('idle');
    }
  };

  const status = thinking
    ? 'Yozmoqda...'
    : mood === 'sad'
      ? 'Limit tugadi'
      : isSubscribed
        ? 'Premium — cheksiz'
        : `${freeLeft} ta bepul so'rov qoldi`;

  return (
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          className="ai-backdrop fixed inset-0 z-[290] flex items-end sm:items-center justify-center p-0 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeChat}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 80, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="ai-glass relative w-full sm:max-w-md h-[86dvh] sm:h-[640px] max-h-[860px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col"
          >
            {/* Header — personaj + holat */}
            <div className="relative flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/40 dark:border-white/10">
              <div className="shrink-0">
                <AIPersona mood={mood} height={92} shadow={false} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                  Chorva AI
                  {isSubscribed && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold">
                      <Crown size={9} /> PRO
                    </span>
                  )}
                </h3>
                <p className="text-[11.5px] text-brand-green-dark font-medium flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${mood === 'sad' ? 'bg-amber-500' : 'bg-brand-green'} ${thinking ? 'animate-pulse' : ''}`} />
                  {status}
                </p>
              </div>
              <button
                onClick={closeChat}
                aria-label="Yopish"
                className="shrink-0 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-slate-200 transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {/* Xabarlar */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-2.5">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-br from-brand-green to-brand-green-dark text-white rounded-2xl rounded-br-md'
                        : 'bg-white/85 dark:bg-white/10 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-100 rounded-2xl rounded-bl-md'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="bg-white/85 dark:bg-white/10 border border-white/60 dark:border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Kiritish */}
            <div className="px-3 py-3 border-t border-white/40 dark:border-white/10 flex items-center gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Savolingizni yozing..."
                className="flex-1 min-w-0 bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/15 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-green transition-colors"
              />
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={send}
                disabled={!input.trim() || thinking}
                className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center text-white shadow-md shadow-brand-green/30 disabled:opacity-40 transition-opacity"
              >
                {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
