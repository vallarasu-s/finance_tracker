import { useRef, useCallback } from 'react';

/**
 * Custom hook handling horizontal touch swipe gestures between primary workspace tabs
 * while respecting inner horizontal scroll containers and open modals.
 */
export function useTabSwipe({ contentAreaRef, isModalOpen, onNextTab, onPrevTab }) {
  const touchStartPos = useRef({ x: 0, y: 0, time: 0 });
  const isHorizontalSwipe = useRef(false);
  const isSwipeCanceled = useRef(false);

  const isScrollableHorizontal = useCallback(
    (element) => {
      let curr = element;
      while (curr && curr !== document.body && curr !== contentAreaRef?.current) {
        if (
          curr.classList?.contains('fogo-main-nav-tabs') ||
          curr.classList?.contains('fogo-main-nav-tab-btn') ||
          curr.classList?.contains('fogo-main-nav-container') ||
          curr.classList?.contains('fogo-mobile-tab-indicator')
        ) {
          return false;
        }
        if (
          curr.classList?.contains('modal-overlay') ||
          curr.classList?.contains('fogo-modal') ||
          (curr.tagName === 'INPUT' && curr.type === 'range')
        ) {
          return true;
        }
        if (curr.scrollWidth > curr.clientWidth + 20) {
          const style = window.getComputedStyle(curr);
          const overflowX = style.overflowX;
          if (overflowX === 'auto' || overflowX === 'scroll') {
            return true;
          }
        }
        curr = curr.parentElement;
      }
      return false;
    },
    [contentAreaRef]
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (isModalOpen || e.touches.length !== 1) {
        isSwipeCanceled.current = true;
        return;
      }

      const touch = e.touches[0];
      if (touch.clientX < 15 || touch.clientX > window.innerWidth - 15) {
        isSwipeCanceled.current = true;
        return;
      }

      if (isScrollableHorizontal(e.target)) {
        isSwipeCanceled.current = true;
        return;
      }

      touchStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      isHorizontalSwipe.current = false;
      isSwipeCanceled.current = false;
    },
    [isModalOpen, isScrollableHorizontal]
  );

  const handleTouchMove = useCallback((e) => {
    if (isSwipeCanceled.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;

    if (!isHorizontalSwipe.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        isSwipeCanceled.current = true;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        isHorizontalSwipe.current = true;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (isSwipeCanceled.current || !isHorizontalSwipe.current || !e.changedTouches.length) {
        isHorizontalSwipe.current = false;
        isSwipeCanceled.current = false;
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const dt = Date.now() - touchStartPos.current.time;

      const isQuickSwipe = dt < 650 && Math.abs(dx) >= 40;
      const isLongSwipe = Math.abs(dx) >= 75;

      if ((isQuickSwipe || isLongSwipe) && Math.abs(dx) > Math.abs(dy) * 1.25) {
        if (dx < 0) {
          onNextTab?.();
        } else {
          onPrevTab?.();
        }
      }

      isHorizontalSwipe.current = false;
      isSwipeCanceled.current = false;
    },
    [onNextTab, onPrevTab]
  );

  const handleTouchCancel = useCallback(() => {
    isHorizontalSwipe.current = false;
    isSwipeCanceled.current = false;
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  };
}
