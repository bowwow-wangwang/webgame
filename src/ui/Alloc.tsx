import { BALANCE } from '../config/balance';
import { STAT_ORDER, statLabel, statMeaning, type Role, type StatKey, type Stats } from '../types/domain';

/**
 * 능력치 나누기. 화면은 범위만 지키게 돕고, 합계와 상한은 등록할 때 서버가 다시 검사한다.
 * columns=2면 PC처럼 두 단으로 나눈다.
 */
export function Alloc({
  stats,
  role,
  onChange,
  columns = 1,
}: {
  stats: Stats;
  role: Role | null;
  onChange: (s: Stats) => void;
  columns?: 1 | 2;
}) {
  const { statBase, statPool, statCapAtCreation } = BALANCE;
  const used = STAT_ORDER.reduce((s, k) => s + (stats[k] - statBase), 0);
  const left = statPool - used;

  function set(k: StatKey, d: number) {
    const v = stats[k] + d;
    if (v < statBase || v > statCapAtCreation) return;
    if (d > 0 && left <= 0) return;
    onChange({ ...stats, [k]: v });
  }

  function row(k: StatKey) {
    const v = stats[k];
    const label = statLabel(k, role ?? undefined);
    const canDown = v > statBase;
    const canUp = v < statCapAtCreation && left > 0;
    return (
      <div className="t-alloc__row" role="group" aria-label={`${label} ${v}`} key={k}>
        <span className="t-alloc__name">
          {label}
          <small>{statMeaning(k, role ?? undefined)}</small>
        </span>
        <button className="t-btn t-btn--outline" type="button" aria-label={`${label} 1 낮추기`} disabled={!canDown} onClick={() => set(k, -1)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') set(k, 1);
          }}>
          −
        </button>
        <output className="t-alloc__val">{v}</output>
        <button className="t-btn t-btn--outline" type="button" aria-label={`${label} 1 올리기`} disabled={!canUp} onClick={() => set(k, 1)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') set(k, -1);
          }}>
          +
        </button>
        <span className="t-alloc__bar" style={{ ['--v' as string]: v }} aria-hidden="true" />
      </div>
    );
  }

  const scale = (
    <p className="t-alloc__scale" aria-hidden="true">
      <span style={{ left: 0 }}>0</span>
      <span style={{ left: `${statBase}%` }}>기본 {statBase}</span>
      <span style={{ left: `${statCapAtCreation}%` }}>상한 {statCapAtCreation}</span>
      <span style={{ left: '100%' }}>100</span>
    </p>
  );

  const half = Math.ceil(STAT_ORDER.length / 2);
  return (
    <div className="t-alloc">
      <div className="t-alloc__left" role="status">
        <span>남은 포인트</span>
        <span>
          <b>{left}</b> / {statPool}
        </span>
      </div>
      {columns === 2 ? (
        <div className="app-alloc-cols">
          <div className="t-alloc">
            {scale}
            {STAT_ORDER.slice(0, half).map(row)}
          </div>
          <div className="t-alloc">
            {scale}
            {STAT_ORDER.slice(half).map(row)}
          </div>
        </div>
      ) : (
        <>
          {scale}
          {STAT_ORDER.map(row)}
        </>
      )}
    </div>
  );
}

export function initialStats(): Stats {
  return Object.fromEntries(STAT_ORDER.map((k) => [k, BALANCE.statBase])) as Stats;
}

export function pointsLeft(stats: Stats): number {
  return BALANCE.statPool - STAT_ORDER.reduce((s, k) => s + (stats[k] - BALANCE.statBase), 0);
}
