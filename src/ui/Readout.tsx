import type { CSSProperties } from 'react';
import { GRADE_LABEL, type Roll } from '../types/domain';
import { Px } from './Px';

const VERDICT_CLASS: Record<Roll['grade'], string> = {
  crit: 't-readout__verdict t-roll-verdict t-readout__verdict--extreme',
  extreme: 't-readout__verdict t-roll-verdict t-readout__verdict--extreme',
  hard: 't-readout__verdict t-roll-verdict t-readout__verdict--hard',
  success: 't-readout__verdict t-roll-verdict',
  fail: 't-readout__verdict t-roll-verdict t-readout__verdict--fail',
  fumble: 't-readout__verdict t-roll-verdict t-readout__verdict--fail',
};

/**
 * 판정 굴림: 계기 바늘이 서버가 굴린 값을 재러 갔다가 멈춘다 (0.9초 안). 숫자는 바늘이 선 자리를 읽는다.
 * 연출은 보여 주기만 한다. 동작 줄이기면 CSS가 처음부터 결과만 보인다.
 */
export function RollReadout({ roll, quip, replayKey }: { roll: Roll; quip?: string | null; replayKey?: string }) {
  const { value, target, grade } = roll;
  const extreme = Math.floor(target / 5);
  const hard = Math.floor(target / 2);
  // 바늘이 멈춘 칸: 극단 / 어려운 / 성공 / 실패.
  const zone = value <= extreme ? 0 : value <= hard ? 1 : value <= target ? 2 : 3;
  const cls = ['t-readout', 't-readout--roll', grade === 'crit' ? 't-readout--crit' : '', grade === 'fumble' ? 't-readout--fumble' : ''].filter(Boolean).join(' ');
  const seg = (i: number, width: number, bg: string) => (
    <span className={zone === i ? 't-scale__hit' : undefined} style={{ width: `${width}%`, background: bg }} />
  );
  const label = `${roll.statLabel} 판정 ${value} / ${target} ${GRADE_LABEL[grade]}${roll.penalty ? ` (오염으로 -${roll.penalty})` : ''}`;
  return (
    <section key={replayKey} className={cls} style={{ '--roll': value } as CSSProperties} aria-label={label}>
      {grade === 'crit' && <span className="t-readout__flash" aria-hidden="true" />}
      <span className="t-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Px name="dice" small />
        {roll.statLabel} 판정 D100
        {roll.penalty > 0 && <span className="t-muted"> · 오염 -{roll.penalty}</span>}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }} aria-hidden="true">
        <span className="t-readout__num t-roll" />
        <span className="t-readout__of">/{target}</span>
        <span className={VERDICT_CLASS[grade]}>
          <span className="t-tune__bars">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="t-tune__text">{GRADE_LABEL[grade]}</span>
        </span>
      </div>
      <div className="t-scale" aria-hidden="true">
        <div className="t-scale__bar">
          {seg(0, extreme, 'var(--ink)')}
          {seg(1, hard - extreme, 'var(--ink-muted)')}
          {seg(2, target - hard, 'var(--line)')}
          {zone === 3 && <span className="t-scale__hit" style={{ width: `${100 - target}%`, background: 'transparent' }} />}
        </div>
        <div className="t-scale__ticks" />
        {grade === 'crit' && (
          <svg className="t-crit-wave" viewBox="0 0 300 36" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength={1} d="M0 18 Q9.4 2 18.8 18 T37.5 18 T56.3 18 T75 18 T93.8 18 T112.5 18 T131.3 18 T150 18 T168.8 18 T187.5 18 T206.3 18 T225 18 T243.8 18 T262.5 18 T281.3 18 T300 18" />
          </svg>
        )}
        <span className="t-scale__needle t-roll-needle" />
      </div>
      <div className="t-gauge__ticks" aria-hidden="true">
        <span>극단 {extreme}</span>
        <span>어려운 {hard}</span>
        <span>성공 {target}</span>
        <span>100</span>
      </div>
      {quip && <p className="t-readout__quip">{quip}</p>}
    </section>
  );
}
