import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessagesSquare,
  Send,
  Paperclip,
  Mic,
  X,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Check,
  CheckCheck,
  Trash2,
  Video,
  Play,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchChatHistory,
  fetchMyChats,
  fetchDirectMessages,
  connectChat,
  uploadMedia,
} from '../api/chat';
import { resolveImageUrl } from '../api/client';
import { VerifiedBadge } from './icons';
import { useI18n } from '../i18n.js';
import EmptyState from './EmptyState';

/** Xabar vaqtini qisqa ko'rinishda chiqarish */
function msgTime(date) {
  const d = new Date(date);
  const now = new Date();
  const hm = d.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return hm;
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} ${hm}`;
}

/** Foydalanuvchining ko'rinadigan ismi */
function userName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Foydalanuvchi';
}

/** Suhbatlar ro'yxatida oxirgi xabar matni */
function lastMessagePreview(m, t) {
  if (!m) return t('chat.startChat');
  if (m.type === 'IMAGE') return t('chat.msgImage');
  if (m.type === 'VIDEO') return t('chat.msgVideo');
  if (m.type === 'AUDIO') return t('chat.msgAudio');
  if (m.type === 'VIDEO_NOTE') return t('chat.msgVideoNote');
  return m.content || '';
}

/** Dumaloq avatar (rasm bo'lsa rasm, bo'lmasa bosh harf) */
function Avatar({ user, size = 'w-11 h-11', text = 'text-sm' }) {
  const src = resolveImageUrl(user?.avatarUrl);
  if (src) {
    return <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div
      className={`${size} shrink-0 rounded-full bg-gradient-to-br from-brand-green to-brand flex items-center justify-center text-white ${text} font-bold`}
    >
      {(user?.firstName || 'F').charAt(0).toUpperCase()}
    </div>
  );
}

/** Yuborilgan/o'qilgan belgilari: ✓ — bazaga yozildi, ✓✓ — sherik o'qidi */
function Ticks({ msg, isDm }) {
  if (isDm && msg.readAt) {
    return <CheckCheck size={13} className="inline-block shrink-0 text-[#7DD3FC]" />;
  }
  return <Check size={13} className="inline-block shrink-0 opacity-80" />;
}

/** Telegram uslubidagi dumaloq video xabar — bosganda ijro/pauza */
function VideoNotePlayer({ src }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative block w-44 h-44 md:w-52 md:h-52 shrink-0 rounded-full overflow-hidden border-2 border-brand-green/40 shadow-lg bg-black focus:outline-none"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="w-full h-full rounded-full aspect-square object-cover"
      />
      {!playing && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * Bitta xabar pufakchasi. O'z xabarini uzoq bosish (yoki sichqonchada ustiga
 * borib chelakchani bosish) — hamma uchun o'chirish oynasini ochadi.
 */
function MessageBubble({ msg, isOwn, showName, isDm, onRequestDelete }) {
  const media = resolveImageUrl(msg.mediaUrl);
  const pressTimer = useRef(null);

  const startPress = () => {
    if (!isOwn) return;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => onRequestDelete(msg), 500);
  };
  const cancelPress = () => clearTimeout(pressTimer.current);

  const timeRow = (
    <span className="inline-flex items-center gap-1">
      {msgTime(msg.createdAt)}
      {isOwn && <Ticks msg={msg} isDm={isDm} />}
    </span>
  );

  // Dumaloq video xabar — rangli pufakchasiz, alohida ko'rinish
  if (msg.type === 'VIDEO_NOTE' && media) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div
          className="relative group"
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          onContextMenu={(e) => {
            if (isOwn) {
              e.preventDefault();
              onRequestDelete(msg);
            }
          }}
        >
          {!isOwn && showName && (
            <p className="text-[10px] font-bold text-brand-sky mb-1 flex items-center gap-1">
              {msg.user?.firstName || 'Foydalanuvchi'}
              {msg.user?.isVerified && <VerifiedBadge size={11} />}
            </p>
          )}
          <VideoNotePlayer src={media} />
          <span
            className={`absolute bottom-1.5 ${isOwn ? 'left-1.5' : 'right-1.5'} px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-[9px] text-white flex items-center gap-1 pointer-events-none`}
          >
            {timeRow}
          </span>
          {isOwn && (
            <button
              onClick={() => onRequestDelete(msg)}
              title="O'chirish"
              className="absolute -left-8 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="relative group max-w-[80%] md:max-w-[65%]">
        {isOwn && (
          <button
            onClick={() => onRequestDelete(msg)}
            title="O'chirish"
            className="absolute -left-9 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          >
            <Trash2 size={12} />
          </button>
        )}
        <div
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          onContextMenu={(e) => {
            if (isOwn) {
              e.preventDefault();
              onRequestDelete(msg);
            }
          }}
          className={`rounded-2xl overflow-hidden select-none md:select-text ${
            isOwn
              ? 'bg-brand-green text-white rounded-br-sm'
              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
          }`}
        >
          {!isOwn && showName && (
            <p className="text-[10px] font-bold text-brand-sky px-3 pt-2 flex items-center gap-1">
              {msg.user?.firstName || 'Foydalanuvchi'}
              {msg.user?.isVerified && <VerifiedBadge size={11} />}
            </p>
          )}

          {msg.type === 'IMAGE' && media && (
            <a href={media} target="_blank" rel="noopener noreferrer">
              <img src={media} alt="" className="max-h-56 w-full object-cover" loading="lazy" />
            </a>
          )}
          {msg.type === 'VIDEO' && media && (
            <video src={media} controls preload="metadata" className="max-h-64 w-full bg-black" />
          )}
          {msg.type === 'AUDIO' && media && (
            <div className="px-3 pt-2 min-w-[200px] max-w-full">
              <audio src={media} controls preload="metadata" className="w-full h-10 max-w-full" />
            </div>
          )}

          {msg.content && (
            <p className="text-xs leading-relaxed px-3 pt-1.5 whitespace-pre-wrap break-words">
              {msg.content}
            </p>
          )}

          <p
            className={`text-[9px] px-3 pb-1.5 pt-0.5 text-right ${
              isOwn ? 'text-white/70' : 'text-slate-500'
            }`}
          >
            {timeRow}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Xabarlar bo'limi: suhbatlar ro'yxati, umumiy xona va 1-ga-1 shaxsiy suhbatlar.
 * Telegram uslubidagi imkoniyatlar: ✓/✓✓ holatlari, hamma uchun o'chirish,
 * ovozli va dumaloq video xabarlar.
 */
export default function ChatTab({ me, showToast, initialChat, onInitialChatConsumed }) {
  const { t } = useI18n();

  // view: {type:'list'} | {type:'global'} | {type:'dm', chat}
  const [view, setView] = useState(() =>
    initialChat ? { type: 'dm', chat: initialChat } : { type: 'list' }
  );
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(() => !!initialChat);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(0);
  const [input, setInput] = useState('');
  const [sendingMedia, setSendingMedia] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // hamma uchun o'chiriladigan xabar
  const [deleting, setDeleting] = useState(false);

  // Ovozli xabar
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);

  // Dumaloq video xabar
  const [videoRecording, setVideoRecording] = useState(false);
  const [videoSecs, setVideoSecs] = useState(0);

  const socketRef = useRef(null);
  const viewRef = useRef(view);
  const meIdRef = useRef(me?.id);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const recordCancelledRef = useRef(false);
  const videoRecorderRef = useRef(null);
  const videoStreamRef = useRef(null);
  const videoTimerRef = useRef(null);
  const videoCancelledRef = useRef(false);
  const videoPreviewRef = useRef(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    meIdRef.current = me?.id;
  }, [me]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // E'londan kelgan suhbat useState boshlang'ich qiymatida ochildi — parent holatini tozalash
  useEffect(() => {
    if (initialChat) onInitialChatConsumed?.();
  }, [initialChat, onInitialChatConsumed]);

  const refreshChats = useCallback(() => {
    fetchMyChats()
      .then((res) => setChats(res.data || []))
      .catch(() => {
        /* keyinroq yana urinamiz */
      });
  }, []);

  // ── Socket ulanishi (komponent mount bo'lganda bir marta) ──
  useEffect(() => {
    const socket = connectChat();
    socketRef.current = socket;

    socket.on('chat:new', (msg) => {
      if (viewRef.current.type === 'global') {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    });

    socket.on('dm:new', (msg) => {
      const v = viewRef.current;
      if (v.type === 'dm' && v.chat.id === msg.chatId) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        // Suhbat ochiq — sherik xabarini darhol o'qilgan deb belgilaymiz
        if (msg.userId !== meIdRef.current) {
          socket.emit('chat:read', { chatId: msg.chatId });
        }
      }
      // Suhbatlar ro'yxati: oxirgi xabar + tepaga ko'tarish
      setChats((prev) => {
        const existing = prev.find((c) => c.id === msg.chatId);
        if (existing) {
          const updated = { ...existing, lastMessage: msg, updatedAt: msg.createdAt };
          return [updated, ...prev.filter((c) => c.id !== msg.chatId)];
        }
        if (msg.userId === meIdRef.current) return prev;
        return [
          { id: msg.chatId, partner: msg.user, lastMessage: msg, updatedAt: msg.createdAt },
          ...prev,
        ];
      });
    });

    // Sherik suhbatni ochdi — bizning xabarlar ✓✓ bo'ladi
    socket.on('dm:read', ({ chatId, at }) => {
      const v = viewRef.current;
      if (v.type === 'dm' && v.chat.id === chatId) {
        setMessages((prev) =>
          prev.map((m) => (m.userId === meIdRef.current && !m.readAt ? { ...m, readAt: at } : m))
        );
      }
    });

    // Xabar hamma uchun o'chirildi
    socket.on('chat:deleted', ({ id }) => {
      if (viewRef.current.type === 'global') {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    });
    socket.on('dm:deleted', ({ id, chatId }) => {
      const v = viewRef.current;
      if (v.type === 'dm' && v.chat.id === chatId) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
      // Ro'yxatdagi oxirgi xabar o'zgargan bo'lishi mumkin
      setChats((prev) => {
        const entry = prev.find((c) => c.id === chatId);
        if (entry?.lastMessage?.id === id) refreshChats();
        return prev;
      });
    });

    socket.on('chat:online', (count) => setOnline(count));
    socket.on('connect_error', () => setError("Chat serveriga ulanib bo'lmadi"));
    socket.on('connect', () => setError(null));

    return () => {
      socket.disconnect();
      clearInterval(recordTimerRef.current);
      clearInterval(videoTimerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recordCancelledRef.current = true;
        recorderRef.current.stop();
      }
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        videoCancelledRef.current = true;
        videoRecorderRef.current.stop();
      }
      videoStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Suhbatlar ro'yxatini yuklash ──
  useEffect(() => {
    let mounted = true;
    fetchMyChats()
      .then((res) => {
        if (!mounted) return;
        setChats((prev) => {
          const fresh = res.data || [];
          const freshIds = new Set(fresh.map((c) => c.id));
          return [...prev.filter((c) => !freshIds.has(c.id)), ...fresh];
        });
      })
      .catch(() => {
        /* ro'yxat keyinroq qayta so'raladi */
      })
      .finally(() => mounted && setChatsLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // ── Xona o'zgarganda tarixni yuklash (loading holati openRoom/backToList da o'rnatiladi) ──
  useEffect(() => {
    if (view.type === 'list') return;
    let mounted = true;

    const req = view.type === 'global' ? fetchChatHistory() : fetchDirectMessages(view.chat.id);

    req
      .then((res) => {
        if (!mounted) return;
        setMessages(res.data || []);
        setLoading(false);
        setTimeout(() => scrollToBottom(false), 60);
        // Shaxsiy suhbat ochildi — sherik xabarlarini o'qilgan deb belgilash
        if (view.type === 'dm') {
          const hasUnread = (res.data || []).some(
            (m) => m.userId !== meIdRef.current && !m.readAt
          );
          if (hasUnread) socketRef.current?.emit('chat:read', { chatId: view.chat.id });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [view, scrollToBottom]);

  // Yangi xabarda pastga tushish
  useEffect(() => {
    if (!loading && view.type !== 'list') scrollToBottom();
  }, [messages, loading, view.type, scrollToBottom]);

  const emitMessage = (payload) =>
    new Promise((resolve) => {
      const chatId = viewRef.current.type === 'dm' ? viewRef.current.chat.id : undefined;
      socketRef.current?.emit('chat:send', { ...payload, chatId }, (res) => resolve(res || {}));
    });

  const sendText = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const res = await emitMessage({ type: 'TEXT', content: text });
    if (res.error) showToast(res.error, 'error');
  };

  // Rasm/video yuborish (type: null — upload aniqlagan turi ishlatiladi)
  const handleFile = async (file, forcedType = null) => {
    if (!file) return;
    setSendingMedia(true);
    try {
      const { url, mediaType } = await uploadMedia(file);
      const res = await emitMessage({ type: forcedType || mediaType, mediaUrl: url });
      if (res.error) showToast(res.error, 'error');
    } catch (err) {
      showToast(err.message || 'Fayl yuborilmadi', 'error');
    } finally {
      setSendingMedia(false);
    }
  };

  // ── Ovozli xabar yozish ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      recordCancelledRef.current = false;

      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        clearInterval(recordTimerRef.current);
        setRecording(false);
        setRecordSecs(0);
        if (recordCancelledRef.current || !chunks.length) return;

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 1000) return; // juda qisqa yozuv
        const file = new File([blob], `ovoz-${Date.now()}.webm`, { type: blob.type });
        await handleFile(file);
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSecs((s) => {
          if (s >= 119) {
            recorder.stop(); // maksimal 2 daqiqa
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      showToast('Mikrofonga ruxsat berilmadi', 'error');
    }
  };

  const stopRecording = (cancel = false) => {
    recordCancelledRef.current = cancel;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  // ── Dumaloq video xabar yozish ──
  const startVideoNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: true,
      });
      videoStreamRef.current = stream;

      const mime = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((m) =>
        MediaRecorder.isTypeSupported(m)
      );
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      videoCancelledRef.current = false;

      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        videoStreamRef.current = null;
        clearInterval(videoTimerRef.current);
        setVideoRecording(false);
        setVideoSecs(0);
        if (videoCancelledRef.current || !chunks.length) return;

        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        if (blob.size < 2000) return;
        const ext = (recorder.mimeType || '').includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `video-xabar-${Date.now()}.${ext}`, { type: blob.type });
        await handleFile(file, 'VIDEO_NOTE');
      };

      recorder.start();
      videoRecorderRef.current = recorder;
      setVideoRecording(true);
      setVideoSecs(0);
      videoTimerRef.current = setInterval(() => {
        setVideoSecs((s) => {
          if (s >= 59) {
            recorder.stop(); // maksimal 1 daqiqa
            return s;
          }
          return s + 1;
        });
      }, 1000);

      // Jonli ko'rinish (modal render bo'lgach ulaymiz)
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      showToast('Kameraga ruxsat berilmadi', 'error');
    }
  };

  const stopVideoNote = (cancel = false) => {
    videoCancelledRef.current = cancel;
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
    }
  };

  // ── Xabarni hamma uchun o'chirish ──
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const res = await new Promise((resolve) => {
      socketRef.current?.emit('chat:delete', { messageId: deleteTarget.id }, (r) =>
        resolve(r || {})
      );
    });
    setDeleting(false);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  // Xonaga kirish/chiqishda xabarlar holatini shu yerda tozalaymiz
  const openRoom = (nextView) => {
    setMessages([]);
    setError(null);
    setLoading(true);
    setView(nextView);
  };
  const openChat = (chat) => openRoom({ type: 'dm', chat });
  const backToList = () => {
    setInput('');
    setLoading(false);
    setView({ type: 'list' });
  };

  // ═══ Suhbatlar ro'yxati ═══
  if (view.type === 'list') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 shrink-0">
          <h2 className="font-bold text-base text-brand">{t('chat.title')}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{t('chat.subtitle')}</p>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
          {/* Umumiy xona */}
          <button
            onClick={() => openRoom({ type: 'global' })}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left border-b border-slate-100"
          >
            <div className="w-11 h-11 shrink-0 rounded-full bg-brand-green/10 border border-brand-green/40 flex items-center justify-center text-brand-green-dark">
              <MessagesSquare size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand">{t('chat.globalRoom')}</p>
              <p className="text-[11px] text-brand-green-dark flex items-center gap-1 mt-0.5">
                <Users size={10} /> {online} {t('chat.online')} — {t('chat.globalOpen')}
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </button>

          {/* Shaxsiy suhbatlar */}
          <p className="px-4 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t('chat.private')}
          </p>

          {chatsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="text-brand-green-dark animate-spin" />
            </div>
          ) : chats.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title={t('chat.noPrivate')}
              subtitle={t('chat.noPrivateHint')}
            />
          ) : (
            chats.map((c) => (
              <button
                key={c.id}
                onClick={() => openChat(c)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              >
                <Avatar user={c.partner} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand truncate flex items-center gap-1">
                    {userName(c.partner)}
                    {c.partner?.isVerified && <VerifiedBadge size={13} />}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {c.lastMessage?.userId === me?.id ? t('chat.you') : ''}
                    {lastMessagePreview(c.lastMessage, t)}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {c.lastMessage ? msgTime(c.lastMessage.createdAt) : ''}
                </span>
              </button>
            ))
          )}
          {error && (
            <p className="mx-4 my-3 text-center text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ═══ Xona (umumiy yoki shaxsiy) ═══
  const isDm = view.type === 'dm';
  const partner = isDm ? view.chat.partner : null;

  return (
    <div className="flex flex-col h-full">
      {/* Sarlavha */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-slate-200 shrink-0">
        <button
          onClick={backToList}
          aria-label="Orqaga"
          className="w-9 h-9 shrink-0 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        {isDm ? (
          <Avatar user={partner} size="w-10 h-10" />
        ) : (
          <div className="w-10 h-10 shrink-0 rounded-full bg-brand-green/10 border border-brand-green/40 flex items-center justify-center text-brand-green-dark">
            <MessagesSquare size={19} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm text-brand truncate flex items-center gap-1">
            {isDm ? userName(partner) : t('chat.globalRoom')}
            {isDm && partner?.isVerified && <VerifiedBadge size={13} />}
          </h2>
          <p className="text-[11px] text-brand-green-dark flex items-center gap-1.5">
            {isDm ? (
              t('chat.privateChat')
            ) : (
              <>
                <Users size={11} /> {online} {t('chat.online')}
              </>
            )}
          </p>
        </div>

        {isDm && partner?.phone && (
          <a
            href={`tel:${partner.phone}`}
            title={t('chat.call')}
            className="w-9 h-9 shrink-0 rounded-lg bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green-dark hover:bg-brand-green/20 transition-colors"
          >
            <Phone size={15} />
          </a>
        )}
      </div>

      {/* Xabarlar (scrollbar yashirilgan, scroll ishlayveradi) */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide py-4 px-4 md:px-12 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="text-brand-green-dark animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          isDm ? (
            <EmptyState
              icon={MessageCircle}
              title={t('chat.dmEmpty')}
              subtitle={`${userName(partner)} — ${t('chat.startChat')}`}
            />
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title={t('chat.globalEmpty')}
              subtitle={t('chat.globalEmptyHint')}
            />
          )
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              isOwn={m.userId === me?.id}
              showName={!isDm}
              isDm={isDm}
              onRequestDelete={setDeleteTarget}
            />
          ))
        )}
        {error && !loading && (
          <p className="text-center text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Kiritish paneli */}
      <div className="p-3 border-t border-slate-200 shrink-0">
        {recording ? (
          <div className="flex items-center gap-3 bg-white border border-red-200 rounded-xl px-4 py-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm text-brand font-medium flex-1 min-w-0 truncate">
              {t('chat.recording')} {String(Math.floor(recordSecs / 60)).padStart(1, '0')}:
              {String(recordSecs % 60).padStart(2, '0')}
            </span>
            <button
              onClick={() => stopRecording(true)}
              title={t('chat.cancel')}
              className="w-9 h-9 shrink-0 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
            >
              <X size={16} />
            </button>
            <button
              onClick={() => stopRecording(false)}
              title={t('chat.send')}
              className="w-9 h-9 shrink-0 rounded-lg bg-brand-green hover:bg-brand-green-dark flex items-center justify-center text-white transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingMedia}
              title={t('chat.attach')}
              className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-green hover:border-brand-green/40 transition-colors disabled:opacity-50"
            >
              {sendingMedia ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendText()}
              onFocus={() => setTimeout(() => scrollToBottom(), 300)}
              placeholder={t('chat.inputPlaceholder')}
              maxLength={2000}
              className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-brand placeholder:text-slate-400 focus:outline-none focus:border-brand-green transition-colors"
            />

            {input.trim() ? (
              <button
                onClick={sendText}
                title={t('chat.send')}
                className="w-10 h-10 shrink-0 rounded-xl bg-brand-green hover:bg-brand-green-dark flex items-center justify-center text-white transition-colors active:scale-95"
              >
                <Send size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={startVideoNote}
                  title={t('chat.videoNote')}
                  className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-green hover:border-brand-green/40 transition-colors"
                >
                  <Video size={16} />
                </button>
                <button
                  onClick={startRecording}
                  title={t('chat.voice')}
                  className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-brand-green hover:border-brand-green/40 transition-colors"
                >
                  <Mic size={16} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Dumaloq video yozish oynasi ── */}
      {videoRecording && (
        <div className="fixed inset-0 z-[250] bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="relative">
            <video
              ref={videoPreviewRef}
              muted
              playsInline
              autoPlay
              style={{ transform: 'scaleX(-1)' }}
              className="w-64 h-64 rounded-full aspect-square object-cover border-4 border-brand-green shadow-2xl bg-black"
            />
            <span className="absolute top-2 right-4 w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse border-2 border-white" />
          </div>

          <p className="text-white font-semibold text-lg mt-5 tabular-nums">
            0:{String(videoSecs).padStart(2, '0')} <span className="text-white/50 text-sm">/ 1:00</span>
          </p>
          <p className="text-white/60 text-xs mt-1">{t('chat.videoNoteHint')}</p>

          <div className="flex items-center gap-6 mt-7 pb-[env(safe-area-inset-bottom,0px)]">
            <button
              onClick={() => stopVideoNote(true)}
              title={t('chat.cancel')}
              className="w-14 h-14 rounded-full bg-red-500/15 border border-red-400/50 flex items-center justify-center text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <X size={22} />
            </button>
            <button
              onClick={() => stopVideoNote(false)}
              title={t('chat.send')}
              className="w-16 h-16 rounded-full bg-brand-green hover:bg-brand-green-dark flex items-center justify-center text-white shadow-lg shadow-brand-green/40 transition-colors active:scale-95"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ── Xabarni o'chirish tasdiqi ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[240] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
                <AlertTriangle size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-brand">{t('chat.deleteTitle')}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {isDm ? t('chat.deleteBody') : t('chat.deleteBodyGlobal')}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {t('chat.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t('chat.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
