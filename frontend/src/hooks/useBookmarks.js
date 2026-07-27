import { useState, useEffect } from 'react';

/**
 * Saqlangan e'lonlar (localStorage).
 * E'lonning to'liq nusxasi saqlanadi — shu tufayli "Saqlangan" bo'limi
 * joriy filtr/sahifaga bog'liq bo'lmaydi.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const item = localStorage.getItem('agrozot_bookmarks');
      const parsed = item ? JSON.parse(item) : {};
      // Eski format (id: true) yozuvlarini tozalash
      Object.keys(parsed).forEach((k) => {
        if (typeof parsed[k] !== 'object' || parsed[k] === null) delete parsed[k];
      });
      return parsed;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agrozot_bookmarks', JSON.stringify(bookmarks));
    } catch {
      /* localStorage to'lgan bo'lishi mumkin */
    }
  }, [bookmarks]);

  /** item — to'liq e'lon obyekti (normalize qilingan) */
  const toggleBookmark = (item) => {
    const id = typeof item === 'object' && item !== null ? item.id : item;
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else if (typeof item === 'object' && item !== null) {
        next[id] = item;
      }
      return next;
    });
  };

  const isBookmarked = (id) => !!bookmarks[id];
  const savedItems = Object.values(bookmarks);
  const savedCount = savedItems.length;

  return { bookmarks, toggleBookmark, isBookmarked, savedItems, savedCount };
}
