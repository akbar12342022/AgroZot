import { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

/** Sekundlarni m:ss ko'rinishida chiqarish */
function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Telegram uslubidagi ovozli xabar pleyeri: Play/Pause tugmasi, bosib
 * o'tkazsa bo'ladigan progress chizig'i va vaqt ko'rsatkichi.
 * isOwn — o'z xabari (yashil pufakcha ichida oq elementlar).
 */
export default function VoiceMessagePlayer({ src, isOwn = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // MediaRecorder webm fayllarida duration ba'zan Infinity bo'ladi — majburlab hisoblaymiz
    const fixDuration = () => {
      if (a.duration === Infinity || isNaN(a.duration)) {
        a.currentTime = 1e101;
        a.ontimeupdate = () => {
          a.ontimeupdate = null;
          a.currentTime = 0;
          if (isFinite(a.duration)) setDuration(a.duration);
        };
      } else {
        setDuration(a.duration);
      }
    };

    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    a.addEventListener('loadedmetadata', fixDuration);
    a.addEventListener('durationchange', fixDuration);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    return () => {
      a.removeEventListener('loadedmetadata', fixDuration);
      a.removeEventListener('durationchange', fixDuration);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, [src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  };

  const pct = duration ? (current / duration) * 100 : 0;
  const btn = isOwn ? 'bg-white text-brand-green' : 'bg-brand-green text-white';
  const track = isOwn ? 'bg-white/25' : 'bg-slate-200';
  const fill = isOwn ? 'bg-white' : 'bg-brand-green';
  const txt = isOwn ? 'text-white/80' : 'text-slate-500';
  // Ijro paytida o'tgan vaqt, aks holda umumiy davomiylik
  const timeLabel = playing || current > 0 ? fmt(current) : fmt(duration);

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 min-w-[190px] max-w-[240px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${btn} transition-transform active:scale-90`}
        aria-label={playing ? 'Pauza' : 'Ijro'}
      >
        {playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" className="ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div onClick={seek} className={`relative h-1.5 rounded-full cursor-pointer ${track}`}>
          <div className={`absolute inset-y-0 left-0 rounded-full ${fill}`} style={{ width: `${pct}%` }} />
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${fill} shadow`}
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className={`text-[10px] mt-1 tabular-nums ${txt}`}>{timeLabel}</div>
      </div>
    </div>
  );
}
