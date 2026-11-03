import { DAY } from '../config/balance';
import { clockKST } from '../lib/time';
import type { Condition } from '../types/domain';
import { Px } from './Px';

const CELLS = 20;

/**
 * 오염 게이지: LED 칸 20개와 숫자. 위험 구간 칸은 안전 주황으로 바뀌고, 상태는 늘 글자로 함께 적는다.
 * preview가 있으면 "지금 → 예상"을 함께 보여 준다 (휴식 고르기).
 */
export function ContaminationGauge({ c, preview, label = '오염' }: { c: Condition; preview?: number; label?: string }) {
  const v = c.contamination ?? 0;
  const shown = preview ?? v;
  const on = Math.round((shown / 100) * CELLS);
  const warnFrom = Math.round((DAY.cautionAt / 100) * CELLS);
  const state =
    c.level === 'overload'
      ? `폭주: 출동할 수 없어요${c.overloadUntil ? ` (늦어도 ${clockKST(c.overloadUntil)}에 풀려요)` : ''}. 쉬면 더 빨리 돌아와요.`
      : c.level === 'caution'
        ? `주의: 판정 -${c.penalty}. 쉬면 돌아와요.`
        : '안정';
  const aria = `${label} ${v} / 100${preview !== undefined ? `, 쉬고 나면 ${preview}` : ''}. ${state}`;
  return (
    <div className="t-gauge" role="img" aria-label={aria}>
      <div className="t-gauge__row">
        <span className="t-label" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Px name="flask" small />
          {label}
        </span>
        <span className="t-gauge__value">
          {preview !== undefined && preview !== v ? (
            <>
              {v} → {preview}
            </>
          ) : (
            v
          )}
          /100
        </span>
      </div>
      <div className="t-gauge__cells" aria-hidden="true">
        {Array.from({ length: CELLS }, (_, i) => (
          <span key={i} className={i < on ? (i >= warnFrom ? 't-gauge__cell t-gauge__cell--warn' : 't-gauge__cell t-gauge__cell--on') : 't-gauge__cell'} />
        ))}
      </div>
      <div className="t-gauge__ticks" aria-hidden="true">
        <span>0</span>
        <span>50</span>
        <span>{DAY.cautionAt}</span>
        <span>100</span>
      </div>
      <span className="t-gauge__state" style={c.level === 'calm' ? undefined : { color: 'var(--stamp)' }} aria-hidden="true">
        {c.level !== 'calm' && <Px name="warning" small />}
        {state}
      </span>
    </div>
  );
}

/** 짧은 상태 꼬리표 (오늘 한눈에, 보내두기 목록). 모양과 글자로 전한다. */
export function ConditionStatus({ c }: { c: Condition }) {
  if (c.contamination === null) return null;
  const cls = c.level === 'overload' ? 't-status t-status--danger' : c.level === 'caution' ? 't-status t-status--warn' : 't-status t-status--ok';
  const text = c.level === 'overload' ? '폭주' : c.level === 'caution' ? `오염 ${c.contamination} · 판정 -${c.penalty}` : `오염 ${c.contamination}`;
  return <span className={cls}>{text}</span>;
}
