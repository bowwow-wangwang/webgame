import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useSession } from '../lib/session';
import { api } from '../services';
import { ROLE_LABEL, type ActiveSend, type Condition } from '../types/domain';
import { nextStep, statusLine } from '../screens/day/DayScreens';
import { Face } from '../ui/chat/Chat';
import { ConditionStatus } from '../ui/Gauge';
import { Px } from '../ui/Px';

/**
 * 오늘 한눈에: 계정의 모든 캐릭터를 한 줄씩. 진행 중이면 남은 시간, 아니면 지금 할 수 있는 일 하나.
 * 접속을 재촉하지 않는다: 끝난 일은 "결과"로만 보여 준다.
 */
export function TodayList({ compact }: { compact?: boolean }) {
  const { characters } = useSession();
  const [sends, setSends] = useState<ActiveSend[]>([]);
  const [conds, setConds] = useState<Condition[]>([]);
  useEffect(() => {
    void api.listMySends().then(setSends);
    void api.listConditions().then(setConds);
  }, [characters.length]);

  return (
    <ul className={compact ? 'app-today app-today--compact' : 'app-today'}>
      {characters.map((c) => {
        const s = [...sends].reverse().find((x) => x.characterId === c.id);
        const cond = conds.find((x) => x.characterId === c.id);
        const step = nextStep(c, s, cond);
        const running = s && new Date(s.endsAt).getTime() > Date.now();
        return (
          <li key={c.id}>
            <Link to={step.to} className="app-today__row" aria-label={`${c.name}: ${statusLine(s)}. ${step.label}`}>
              <Face p={{ id: c.id, name: c.name, role: c.role, portraitUrl: c.portraitUrl, mine: true }} size={36} />
              <span className="app-today__text">
                <span>
                  {c.name} <span className="t-muted" style={{ fontSize: 12 }}>{ROLE_LABEL[c.role]}</span>
                </span>
                <span className="t-muted app-today__line">
                  <Px name={s?.forkWaiting ? 'envelope' : running ? 'hourglass' : 'compass'} small />
                  {statusLine(s)}
                </span>
                {cond && cond.contamination !== null && !compact && <ConditionStatus c={cond} />}
              </span>
              <span className={step.tag === '보내기' ? 't-tag' : 't-tag t-tag--solid'}>{step.tag}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
