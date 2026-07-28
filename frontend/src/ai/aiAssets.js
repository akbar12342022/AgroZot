// Chorva AI personaji — mood rasmlari (shaffof PNG, /public/assets/ai/)
export const AI_MOODS = ['idle', 'hello', 'talking', 'success', 'sad'];

export const aiSrc = (mood) => `/assets/ai/${AI_MOODS.includes(mood) ? mood : 'idle'}.png`;

/** Barcha mood rasmlarini oldindan yuklab qo'yish (crossfade "yalt" etmasligi uchun) */
export function preloadAI() {
  if (typeof window === 'undefined') return;
  AI_MOODS.forEach((m) => {
    const img = new Image();
    img.src = aiSrc(m);
  });
}
