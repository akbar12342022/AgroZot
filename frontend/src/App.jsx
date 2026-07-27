import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bot, Send, Trash2, Loader2, WifiOff, ImagePlus, X, Lock, Sparkles } from 'lucide-react';

// Komponentlar
import ListingCard from './components/ListingCard';
import DetailModal from './components/DetailModal';
import RegionDropdown from './components/RegionDropdown';
import BottomNav from './components/BottomNav';
import ListingSkeleton from './components/ListingSkeleton';
import EmptyState from './components/EmptyState';
import SortMenu from './components/SortMenu';
import PostForm from './components/PostForm';
import ProfileTab from './components/ProfileTab';
import ChatTab from './components/ChatTab';
import Toast from './components/Toast';
import RegisterScreen from './components/RegisterScreen';
import OnboardingSurvey from './components/OnboardingSurvey';
import WelcomeSplash from './components/WelcomeSplash';
import PricingModal from './components/PricingModal';
import AdminPanel from './components/AdminPanel';
import BrandLogo from './components/BrandLogo';

// Hooklar, API va ma'lumotlar
import { useAnimals } from './hooks/useAnimals';
import { useBookmarks } from './hooks/useBookmarks';
import { CATEGORIES, CHAT_HISTORY, ALL_REGIONS_LABEL } from './constants/data';
import { aiChat, aiAccess } from './api/animals';
import { uploadMedia, openDirectChat } from './api/chat';
import { resolveImageUrl } from './api/client';
import { isLoggedIn, currentUser, logout } from './api/auth';

const CHAT_STORAGE_KEY = 'agrozot_ai_chat';
const DEFAULT_SUGGESTIONS = [
  'Sigir emlash jadvali qanday?',
  'Qoramol narxi qancha?',
  'Mastit qanday davolanadi?',
  'Sut miqdorini qanday oshiraman?',
];

let toastCounter = 0;

/** Asosiy ilova (ro'yxatdan o'tgandan keyin ko'rinadi) */
function MainApp({ user, onLogout, showToast, toast }) {
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState(ALL_REGIONS_LABEL);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [editItem, setEditItem] = useState(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [pendingChat, setPendingChat] = useState(null); // e'londan ochilgan shaxsiy suhbat

  // ── AI chat holati ──
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* buzilgan ma'lumot */
    }
    return CHAT_HISTORY;
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [pendingImage, setPendingImage] = useState(null); // {url, preview}
  const [uploadingAiImage, setUploadingAiImage] = useState(false);
  const chatEndRef = useRef(null);
  const aiImageInputRef = useRef(null);

  // ── AI tarif holati ──
  const [aiAccessInfo, setAiAccessInfo] = useState(null); // {plan, imageLimit, remainingImages, contact}
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    let alive = true;
    aiAccess()
      .then((info) => {
        if (alive) setAiAccessInfo(info);
      })
      .catch(() => {
        /* yuklanmasa — server baribir har so'rovda tekshiradi */
      });
    return () => {
      alive = false;
    };
  }, []);

  const { toggleBookmark, isBookmarked, savedItems } = useBookmarks();

  const { animals, loading, loadingMore, error, total, hasMore, loadMore, refetch } = useAnimals({
    category: activeCategory,
    region: selectedRegion,
    search: searchQuery,
    sort,
  });

  // AI suhbatini saqlash
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* localStorage to'la */
    }
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiThinking, activeTab]);

  // AI uchun rasm tanlash
  const handleAiImage = async (file) => {
    if (!file) return;
    setUploadingAiImage(true);
    try {
      const { url } = await uploadMedia(file);
      setPendingImage({ url, preview: resolveImageUrl(url) });
    } catch (err) {
      showToast(err.message || 'Rasm yuklanmadi', 'error');
    } finally {
      setUploadingAiImage(false);
    }
  };

  // AI ga savol yuborish
  const sendMessage = async (text) => {
    const userMsg = (text ?? chatInput).trim();
    const imageUrl = pendingImage?.url;
    if ((!userMsg && !imageUrl) || isAiThinking) return;

    // Suhbat tarixi (API uchun rol formatida)
    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text || '' }))
      .filter((m) => m.content);

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, imageUrl: pendingImage?.preview || null },
    ]);
    setChatInput('');
    setPendingImage(null);
    setIsAiThinking(true);

    try {
      const data = await aiChat({ message: userMsg, history, imageUrl });
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        setSuggestions(data.suggestions);
      }
      // Serverdan kelgan tarif holatini yangilab borish (qolgan rasm limiti)
      if (data.plan) {
        setAiAccessInfo((prev) => ({
          ...(prev || {}),
          plan: data.plan,
          imageLimit: data.imageLimit ?? null,
          remainingImages: data.remainingImages ?? null,
          questionLimit: data.questionLimit ?? null,
          remainingQuestions: data.remainingQuestions ?? null,
        }));
      }
    } catch (err) {
      if (err.code === 'LIMIT_REACHED') {
        setAiAccessInfo((prev) => ({
          ...(prev || {}),
          plan: 'STANDARD',
          remainingQuestions: 0,
          contact: err.data?.contact || prev?.contact,
        }));
        setShowPricing(true);
      } else if (err.code === 'IMAGE_LIMIT') {
        setAiAccessInfo((prev) => (prev ? { ...prev, remainingImages: 0 } : prev));
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: err.message || "AI yordamchiga ulanib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.",
          error: true,
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const clearChat = () => {
    setMessages(CHAT_HISTORY);
    setSuggestions(DEFAULT_SUGGESTIONS);
    setPendingImage(null);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  // STANDARD (bepul) tarifda 3 ta savol tugagach AI bo'limi yopiladi
  const aiLocked =
    aiAccessInfo?.plan === 'STANDARD' && aiAccessInfo?.remainingQuestions === 0;

  const handleTabChange = (tab) => {
    // Bepul savollari tugagan foydalanuvchi AI bo'limini ochsa — tariflar oynasi
    if (tab === 'ai' && aiLocked) {
      setShowPricing(true);
      return;
    }
    if (editItem) setEditItem(null);
    setActiveTab(tab);
  };

  // AI bo'limida turganda limit tugab qolsa ham oyna ochiq turadi
  const pricingOpen = showPricing || (activeTab === 'ai' && aiLocked);
  const closePricing = () => {
    setShowPricing(false);
    if (activeTab === 'ai' && aiLocked) setActiveTab('home');
  };

  const isPro = aiAccessInfo?.plan === 'PRO';
  const outOfImages = isPro && aiAccessInfo?.remainingImages === 0;

  const handleEditListing = (item) => {
    setSelectedListing(null);
    setEditItem(item);
    setActiveTab('post');
  };

  // E'lon ichidagi "Xabar yozish": sotuvchi bilan suhbatni ochib, chatga o'tish
  const handleMessageSeller = async (listing) => {
    const chat = await openDirectChat(listing.userId);
    setSelectedListing(null);
    setPendingChat(chat);
    setActiveTab('chat');
  };

  return (
    <>
      <Toast toast={toast} />

      {/* ═══ Yopishqoq sarlavha (bosh sahifada) ═══ */}
      {activeTab === 'home' && (
        <div className="glass-header sticky top-0 z-30 border-b border-slate-200 shrink-0">
          {/* Navbar: logotip — mobilda markazda, md+ da chapda */}
          <div className="flex items-center justify-center md:justify-start px-4 pt-2">
            <BrandLogo />
          </div>
          <div className="px-4 pt-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                <Search size={15} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Qidirish..."
                  className="bg-transparent text-sm text-brand flex-1 focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-600 p-0.5">
                    <X size={13} />
                  </button>
                )}
              </div>
              <RegionDropdown selected={selectedRegion} onSelect={setSelectedRegion} />
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-4 pb-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-green/10 text-brand-green-dark border border-brand-green/40 chip-active'
                    : 'bg-white text-slate-500 border border-transparent hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <cat.icon size={13} className="shrink-0" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Asosiy kontent — pastki padding navbar + iOS uy indikatorini hisobga oladi ═══ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
        <AnimatePresence mode="wait">
          {/* ── Bosh sahifa ── */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse-dot" />
                  {loading ? 'Yuklanmoqda...' : error ? 'Xatolik yuz berdi' : `${total} ta e'lon topildi`}
                </div>
                <SortMenu selected={sort} onSelect={setSort} />
              </div>

              {error ? (
                <div className="pt-6">
                  <EmptyState icon={WifiOff} title="Serverga ulanib bo'lmadi" subtitle={error} />
                  <button
                    onClick={refetch}
                    className="mx-auto block px-5 py-2.5 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-brand-green-dark transition-colors active:scale-[0.98]"
                  >
                    Qayta urinish
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 p-3">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)
                    ) : animals.length > 0 ? (
                      animals.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.3 }}
                        >
                          <ListingCard
                            item={item}
                            isBookmarked={isBookmarked(item.id)}
                            onBookmark={toggleBookmark}
                            onSelect={setSelectedListing}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full">
                        <EmptyState
                          icon={Search}
                          title="E'lonlar topilmadi"
                          subtitle="Boshqa so'z bilan qidirib ko'ring yoki filtrlarni o'zgartiring"
                        />
                      </div>
                    )}
                  </div>

                  {!loading && hasMore && (
                    <div className="px-3 pb-4">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 size={15} className="animate-spin" /> Yuklanmoqda...
                          </>
                        ) : (
                          'Yana yuklash'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── Umumiy chat ── */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <ChatTab
                me={user}
                showToast={showToast}
                initialChat={pendingChat}
                onInitialChatConsumed={() => setPendingChat(null)}
              />
            </motion.div>
          )}

          {/* ── AI yordamchi: bepul limit tugagan holat ── */}
          {activeTab === 'ai' && aiLocked && (
            <motion.div
              key="ai-locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full px-8 text-center"
            >
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green-dark">
                  <Bot size={36} />
                </div>
                <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500">
                  <Lock size={14} />
                </span>
              </div>
              <h2 className="text-lg font-bold text-brand mb-2">Bepul savollaringiz tugadi</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-6">
                Davom etish — veterinariya maslahatlari, hayvon rasmidan vazn va bozor narxini
                baholash uchun Pro yoki Premium tarifini ulang.
              </p>
              <button
                onClick={() => setShowPricing(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-green to-brand text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-green/25 transition-transform active:scale-[0.98]"
              >
                <Sparkles size={16} /> Tariflarni ko'rish
              </button>
            </motion.div>
          )}

          {/* ── AI yordamchi ── */}
          {activeTab === 'ai' && !aiLocked && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
              <div className="flex items-center gap-3 p-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-brand-green/10 border border-brand-green/40 flex items-center justify-center text-brand-green-dark">
                  <Bot size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-brand flex items-center gap-1.5">
                    AgroZot AI
                    {aiAccessInfo?.plan === 'PREMIUM' && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-600 text-[9px] font-extrabold tracking-wider">
                        PREMIUM
                      </span>
                    )}
                    {isPro && (
                      <span className="px-1.5 py-0.5 rounded-md bg-brand-green/10 border border-brand-green/40 text-brand-green-dark text-[9px] font-extrabold tracking-wider">
                        PRO
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-brand-green-dark flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                    {aiAccessInfo?.plan === 'PREMIUM'
                      ? 'Cheksiz suhbat va rasm tahlili'
                      : isPro && aiAccessInfo?.remainingImages != null
                        ? `Bugun ${aiAccessInfo.remainingImages} ta rasm tahlili qoldi`
                        : aiAccessInfo?.plan === 'STANDARD' && aiAccessInfo?.remainingQuestions != null
                          ? `Bepul: ${aiAccessInfo.remainingQuestions} ta savol qoldi`
                          : 'Har qanday savolga javob beradi'}
                  </p>
                </div>
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    title="Suhbatni tozalash"
                    className="ml-auto w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors active:scale-95"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] md:max-w-[65%] rounded-2xl overflow-hidden ${
                        m.sender === 'user'
                          ? 'bg-brand-green text-white rounded-br-sm'
                          : m.error
                            ? 'bg-red-50 border border-red-200 text-red-600 rounded-bl-sm'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                      }`}
                    >
                      {m.imageUrl && <img src={m.imageUrl} alt="" className="max-h-48 w-full object-cover" />}
                      {m.text && <p className="p-3 text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex gap-1 px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Tayyor savollar */}
              {suggestions.length > 0 && !isAiThinking && !pendingImage && (
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 pb-2 pt-1">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium bg-brand-green/10 text-brand-green-dark border border-brand-green/30 hover:bg-brand-green/20 transition-colors active:scale-95 whitespace-nowrap"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Tanlangan rasm (yuborishdan oldin) */}
              {pendingImage && (
                <div className="px-3 pb-2">
                  <div className="relative inline-block">
                    <img src={pendingImage.preview} alt="" className="h-16 rounded-lg border border-brand-green/40" />
                    <button
                      onClick={() => setPendingImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white"
                    >
                      <X size={11} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Rasm tayyor — savol yozing yoki shunchaki yuboring (AI vazn va narxni baholaydi)
                  </p>
                </div>
              )}

              <div className="p-3 border-t border-slate-200 flex items-center gap-2">
                <input
                  ref={aiImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    handleAiImage(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      if (outOfImages) {
                        showToast(
                          "Bugungi rasm tahlili limiti tugadi (kuniga 5 ta). Plus tarifida cheksiz.",
                          'error'
                        );
                        return;
                      }
                      aiImageInputRef.current?.click();
                    }}
                    disabled={uploadingAiImage || isAiThinking}
                    title={
                      outOfImages
                        ? 'Bugungi rasm limiti tugadi'
                        : 'Hayvon rasmini yuborish (vazn/narx baholash)'
                    }
                    className={`w-10 h-10 rounded-xl bg-white border flex items-center justify-center transition-colors disabled:opacity-50 ${
                      outOfImages
                        ? 'border-red-500/30 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 text-slate-500 hover:text-brand-green-dark hover:border-brand-green/40'
                    }`}
                  >
                    {uploadingAiImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  </button>
                  {/* Pro tarif: qolgan kunlik rasm soni */}
                  {isPro && aiAccessInfo?.remainingImages != null && (
                    <span
                      className={`absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white pointer-events-none ${
                        outOfImages ? 'bg-red-500' : 'bg-brand-green'
                      }`}
                    >
                      {aiAccessInfo.remainingImages}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={pendingImage ? 'Rasm haqida savol (ixtiyoriy)...' : 'Istalgan savolni yozing...'}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-brand placeholder:text-slate-400 focus:outline-none focus:border-brand-green transition-colors"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isAiThinking || (!chatInput.trim() && !pendingImage)}
                  className="w-10 h-10 rounded-xl bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors active:scale-95"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── E'lon berish ── */}
          {activeTab === 'post' && (
            <motion.div
              key={editItem ? `post-edit-${editItem.id}` : 'post'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PostForm
                editItem={editItem}
                showToast={showToast}
                onCreated={refetch}
                onGoHome={() => setActiveTab('home')}
                onEditSaved={() => {
                  setEditItem(null);
                  setActiveTab('profile');
                  setProfileRefreshKey((k) => k + 1);
                  refetch();
                }}
                onCancelEdit={() => {
                  setEditItem(null);
                  setActiveTab('profile');
                }}
              />
            </motion.div>
          )}

          {/* ── Profil ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProfileTab
                savedItems={savedItems}
                refreshKey={profileRefreshKey}
                onEdit={handleEditListing}
                onOpenListing={setSelectedListing}
                onGoPost={() => {
                  setEditItem(null);
                  setActiveTab('post');
                }}
                onLogout={onLogout}
                onBookmark={toggleBookmark}
                isBookmarked={isBookmarked}
                showToast={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Batafsil oyna ═══ */}
      <AnimatePresence>
        {selectedListing && (
          <DetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            isBookmarked={isBookmarked(selectedListing.id)}
            onBookmark={toggleBookmark}
            showToast={showToast}
            onMessageSeller={handleMessageSeller}
            currentUserId={user?.id}
          />
        )}
      </AnimatePresence>

      {/* ═══ AI tariflar oynasi ═══ */}
      <AnimatePresence>
        {pricingOpen && <PricingModal contact={aiAccessInfo?.contact} onClose={closePricing} />}
      </AnimatePresence>

      {/* ═══ Pastki navigatsiya ═══ */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(() => (isLoggedIn() ? currentUser() : null));
  const [showSplash, setShowSplash] = useState(() => isLoggedIn());
  const [adminRoute, setAdminRoute] = useState(() => window.location.hash === '#admin');

  // ── Onboarding so'rovnomasi holati ──
  // Javoblar React state'da turadi va ro'yxatdan o'tishda backendga yuboriladi.
  // Kirmagan foydalanuvchiga ro'yxatdan o'tish formasi oldidan har doim so'rovnoma chiqadi.
  const [survey, setSurvey] = useState(null);
  const [surveyDone, setSurveyDone] = useState(false);

  // /#admin — admin panel marshruti
  useEffect(() => {
    const onHash = () => setAdminRoute(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Toast bildirishnomalari (App darajasida, register ekranida ham ishlashi uchun)
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((message, type = 'info') => {
    clearTimeout(toastTimer.current);
    setToast({ id: ++toastCounter, message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // 401 kelganda avtomatik chiqish — so'rovnoma ham boshidan boshlanadi
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setSurvey(null);
      setSurveyDone(false);
    };
    window.addEventListener('agrozot:logout', handler);
    return () => window.removeEventListener('agrozot:logout', handler);
  }, []);

  // So'rovnoma yakunlandi — ro'yxatdan o'tish formasi ochiladi
  const handleSurveyComplete = (answers) => {
    setSurvey(answers);
    setSurveyDone(true);
  };

  const handleRegistered = (u) => {
    setUser(u);
    setShowSplash(true);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setShowSplash(false);
    setSurvey(null);
    setSurveyDone(false);
  };

  if (adminRoute) return <AdminPanel />;

  return (
    <div className="w-full min-h-[100dvh] bg-brand-bg font-['Inter']">
      {!user ? (
        /* ═══ Ro'yxatdan o'tish — mobilda to'liq ekran, lg+ da split-screen ═══ */
        <div className="flex min-h-[100dvh]">
          {/* Chap tomon: intro video paneli (md+ ekranlarda) */}
          <div className="hidden md:flex md:w-1/2 xl:w-[55%] relative flex-col justify-end p-10 xl:p-14 border-r border-slate-200 overflow-hidden bg-brand">
            {/* Orqa fonda uzluksiz aylanadigan intro video */}
            <video
              src="/intro.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Matn o'qilishi uchun qoraytiruvchi qatlam (video toza — logosiz) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2E3A]/85 via-[#0F3D4C]/25 to-transparent pointer-events-none" />

            <div className="relative max-w-md">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
                O'zbekiston{' '}
                <span className="bg-gradient-to-r from-[#4ADE80] to-[#7DD3FC] bg-clip-text text-transparent">
                  chorvachilik
                </span>{' '}
                bozori
              </h1>
              <p className="text-sm text-slate-100/90 mt-4 leading-relaxed drop-shadow">
                Hayvon va yem-hashak oldi-sotdisi, chorvadorlar jamoasi hamda AI yordamchi — barchasi
                bitta ilovada.
              </p>
            </div>

            <p className="relative text-[11px] text-slate-200/80 tracking-widest uppercase mt-8">
              Chorva Bozori — zamonaviy savdo
            </p>
          </div>

          {/* O'ng tomon: onboarding so'rovnomasi → ro'yxatdan o'tish formasi */}
          <div className="relative flex-1 h-[100dvh] overflow-hidden flex flex-col">
            <Toast toast={toast} />
            <AnimatePresence mode="wait" initial={false}>
              {!surveyDone ? (
                <motion.div
                  key="survey"
                  exit={{ opacity: 0, x: -48, filter: 'blur(5px)' }}
                  transition={{ duration: 0.32 }}
                  className="h-full"
                >
                  <OnboardingSurvey onComplete={handleSurveyComplete} />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 48, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.32 }}
                  className="h-full"
                >
                  <RegisterScreen onSuccess={handleRegistered} survey={survey} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ═══ Asosiy ilova — mobilda to'liq ekran, md+ da markazlashgan ustun ═══ */
        <div className="relative w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto h-[100dvh] bg-brand-bg md:border-x md:border-slate-200 overflow-hidden flex flex-col">
          <AnimatePresence>
            {showSplash && (
              <WelcomeSplash key="splash" name={user.firstName} onDone={() => setShowSplash(false)} />
            )}
          </AnimatePresence>
          <MainApp user={user} onLogout={handleLogout} showToast={showToast} toast={toast} />
        </div>
      )}
    </div>
  );
}
