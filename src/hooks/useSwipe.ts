import { useRef } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, threshold = 60): SwipeHandlers {
  const startX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(delta) < threshold) return;
    // RTL: swipe right = go to previous (earlier), swipe left = go to next (later)
    if (delta > 0) onSwipeRight();
    else onSwipeLeft();
    startX.current = null;
  };

  return { onTouchStart, onTouchEnd };
}
