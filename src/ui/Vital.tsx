import { ECG_PATH } from './pixelIcons';

/** 생체 신호 띠. 장식이지만 상태 글자("안정")는 읽힌다. 동작 줄이기면 멈춘다(CSS). */
export function Vital({ state = '안정' }: { state?: '안정' | '긴장' }) {
  return (
    <div className={state === '긴장' ? 't-vital t-vital--tense' : 't-vital'} role="img" aria-label={`생체 신호 ${state}`}>
      <span className="t-label">생체</span>
      <svg viewBox="0 0 300 28" preserveAspectRatio="none" aria-hidden="true">
        <g className="t-vital__track">
          <path className="t-vital__wave" d={ECG_PATH} />
        </g>
      </svg>
      <span className="t-vital__bpm">
        <span className="t-vital__beat" aria-hidden="true" />
        {state} <span className="t-vital__num" aria-hidden="true" />
      </span>
    </div>
  );
}
