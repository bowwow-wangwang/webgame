import { useSyncExternalStore } from 'react';
import { DESKTOP_MIN_WIDTH } from '../config/layout';

const query = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;

function subscribe(cb: () => void) {
  const m = window.matchMedia(query);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}

/** 넓은 화면이면 PC 배치를 쓴다. 기기 종류가 아니라 폭으로 정한다 (태블릿 가로, 창 크기 조절). */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export type Platform = 'ios' | 'android' | 'pc';
export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'pc';
}
