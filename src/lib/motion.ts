// 단말 설정의 "동작 줄이기". 기기마다 다른 선택이라 이 브라우저에만 저장한다.
export type MotionPref = 'system' | 'reduce';

const KEY = 'webgame.motion';

export function loadMotion(): MotionPref {
  try {
    return localStorage.getItem(KEY) === 'reduce' ? 'reduce' : 'system';
  } catch {
    return 'system';
  }
}

/** <html data-motion="reduce">를 붙이면 CSS가 기기 설정과 같은 규칙으로 연출을 끈다. */
export function applyMotion(pref: MotionPref) {
  if (pref === 'reduce') document.documentElement.dataset.motion = 'reduce';
  else delete document.documentElement.dataset.motion;
}

export function saveMotion(pref: MotionPref) {
  try {
    if (pref === 'reduce') localStorage.setItem(KEY, 'reduce');
    else localStorage.removeItem(KEY);
  } catch {
    // 저장하지 못해도 이번에 연 화면에는 적용된다.
  }
  applyMotion(pref);
}
