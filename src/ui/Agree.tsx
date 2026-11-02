import { useId, type ReactNode } from 'react';

/** 확인 칸: 네모 안 체크 + 글 + (있으면) 오른쪽 읽기 링크. 필수는 글자로 적는다. */
export function Agree({
  checked,
  onChange,
  children,
  required,
  all,
  readLabel,
  onRead,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  required?: boolean;
  all?: boolean;
  readLabel?: string;
  onRead?: () => void;
}) {
  const id = useId();
  return (
    <div className={all ? 't-agree t-agree--all' : 't-agree'}>
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        {children}
        {required && <span className="t-agree__req">필수</span>}
      </label>
      {onRead && (
        <button type="button" className="t-btn t-btn--ghost" onClick={onRead}>
          읽기<span className="t-sr"> {readLabel}</span>
        </button>
      )}
    </div>
  );
}
