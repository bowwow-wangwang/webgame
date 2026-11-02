import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useSession } from '../lib/session';
import { remaining } from '../lib/time';
import { api } from '../services';
import { ROLE_LABEL, SEND_KIND_LABEL, type ActiveSend } from '../types/domain';
import { Face } from '../ui/chat/Chat';
import { Px } from '../ui/Px';

/**
 * 오늘 한눈에: 계정의 모든 캐릭터를 한 줄씩. 진행 중이면 남은 시간, 아니면 지금 할 수 있는 일 하나.
 * 접속을 재촉하지 않는다: 끝난 일은 "끝남"으로만 보여 준다.
 */
export function TodayList({ compact }: { compact?: boolean }) {
  const { characters } = useSession();
  const [sends, setSends] = useState<ActiveSend[]>([]);
  useEffect(() => {
    void api.listMySends().then(setSends);
  }, [characters.length]);

  return (
    <ul className={compact ? 'app-today app-today--compact' : 'app-today'}>
      {characters.map((c) => {
        const s = [...sends].reverse().find((x) => x.characterId === c.id);
        const running = s && new Date(s.endsAt).getTime() > Date.now();
        const line = s
          ? running
            ? `${s.targetName} ${SEND_KIND_LABEL[s.kind]} 중, ${remaining(s.endsAt)} 남음`
            : `${s.targetName} ${SEND_KIND_LABEL[s.kind]} 끝`
          : '보내 둔 일 없음';
        const tag = s ? (running ? '진행' : '끝남') : '보내기';
        return (
          <li key={c.id}>
            <Link to={running ? `/sent/${s?.id}` : `/send/${c.id}`} className="app-today__row">
              <Face p={{ id: c.id, name: c.name, role: c.role, portraitUrl: c.portraitUrl, mine: true }} size={36} />
              <span className="app-today__text">
                <span>
                  {c.name} <span className="t-muted" style={{ fontSize: 12 }}>{ROLE_LABEL[c.role]}</span>
                </span>
                <span className="t-muted app-today__line">
                  <Px name={running ? 'hourglass' : 'compass'} small />
                  {line}
                </span>
              </span>
              <span className="t-tag">{tag}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
