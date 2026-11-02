import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface PickOption<V extends string> {
  value: V;
  title: ReactNode;
  desc?: ReactNode;
  /** 판정 꼬리표 같은 오른쪽(설명 칸에서는 제목 아래) 표시. */
  side?: ReactNode;
  disabled?: boolean;
  /** 데스크톱 숫자 단축키 표시 ([1] [2] …). */
  keyHint?: string;
}

/**
 * 고르기 칸 묶음: 역할, 기억상실 정도, 보내두기 방식, 갈림길이 모두 이 부품을 쓴다.
 * 키보드는 라디오 묶음 관례대로: 묶음 안 탭 멈춤 하나, 화살표로 옮기며 고른다.
 */
export function PickGroup<V extends string>({
  legend,
  note,
  options,
  value,
  onChange,
  row,
}: {
  legend: ReactNode;
  note?: ReactNode;
  options: PickOption<V>[];
  value: V | null;
  onChange: (v: V) => void;
  row?: boolean;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const current = options.findIndex((o) => o.value === value);
  const focusIndex = current >= 0 ? current : (enabled[0] ?? 0);

  function onKey(e: KeyboardEvent, i: number) {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const pos = enabled.indexOf(i);
    const next = enabled.at((pos + step + enabled.length) % enabled.length);
    if (next === undefined) return;
    const opt = options[next];
    if (!opt) return;
    onChange(opt.value);
    refs.current[next]?.focus();
  }

  return (
    <div className="t-picks">
      <p id={id} className="t-picks__legend">
        {legend}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="t-picks">
        {options.map((o, i) => (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            aria-disabled={o.disabled || undefined}
            tabIndex={i === focusIndex ? 0 : -1}
            className={row ? 't-pick t-pick--row' : 't-pick'}
            onClick={() => !o.disabled && onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="t-pick__lamp" aria-hidden="true" />
            <span className="t-pick__title">
              {o.keyHint && <b className="t-key-hint">[{o.keyHint}]</b>}
              {o.title}
            </span>
            {o.side && <span className="t-pick__side">{o.side}</span>}
            {o.desc && <span className="t-pick__desc">{o.desc}</span>}
          </button>
        ))}
      </div>
      {note && <p className="t-picks__note">{note}</p>}
    </div>
  );
}

export function StatTag({ label, value }: { label: string; value: number }) {
  return (
    <span className="t-tag t-pick__stat">
      {label} {value}
    </span>
  );
}
