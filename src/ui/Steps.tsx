/** 단계 표시. 모바일은 "3 / 5 능력치" + 칸 막대, PC는 세로 목록(끝난 단계는 눌러 돌아간다). */
export function Steps({
  names,
  current,
  side,
  savedAt,
  onGo,
}: {
  names: readonly string[];
  current: number;
  side?: boolean;
  savedAt?: string | null;
  onGo?: (step: number) => void;
}) {
  const items = names.map((n, i) => {
    const step = i + 1;
    const done = step < current;
    const now = step === current;
    const state = now ? ', 지금 단계' : done ? ', 끝남' : '';
    const inner = (
      <>
        <span className="t-steps__n">{step}</span>
        <span>{n}</span>
        <span className="t-steps__state">{state}</span>
      </>
    );
    return (
      <li key={n} aria-current={now ? 'step' : undefined} data-done={done ? '' : undefined}>
        {side && done && onGo ? (
          <button type="button" className="t-steps__go" onClick={() => onGo(step)}>
            {inner}
          </button>
        ) : (
          inner
        )}
      </li>
    );
  });

  if (side) {
    return (
      <nav className="t-steps t-steps--side" aria-label="만드는 단계">
        <ol className="t-steps__bar">{items}</ol>
      </nav>
    );
  }
  return (
    <nav className="t-steps" aria-label="만드는 단계">
      <p className="t-steps__now" style={{ margin: 0 }}>
        <span>
          <b>
            {current} / {names.length}
          </b>{' '}
          {names[current - 1]}
        </span>
        {savedAt && <span className="t-saved">임시저장 {formatTime(savedAt)}</span>}
      </p>
      <ol className="t-steps__bar">{items}</ol>
    </nav>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' });
}
