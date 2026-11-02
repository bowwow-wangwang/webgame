import { Link } from 'react-router';
import { BALANCE } from '../config/balance';
import { useSession } from '../lib/session';
import { Frame, ScreenHeader } from '../shell/Frame';
import { ROLE_LABEL } from '../types/domain';

/** M-11 상황판의 자리. 이번 단계는 처음 온 사람 흐름이 끝나는 곳까지만 있고, 오늘 한눈에와 장소 채널은 다음 묶음에서 채운다. */
export function HomeScreen() {
  const { characters } = useSession();
  return (
    <Frame plate="상황판" ingame header={<ScreenHeader title="상황판" sub="CH.01" />} scrollLabel="상황판">
      <section aria-labelledby="today-h" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 id="today-h" className="t-label">
          오늘 한눈에
        </h2>
        {characters.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 52, padding: '6px 12px', border: '1px solid var(--line-strong)' }}>
            <span>
              {c.name} <span className="t-muted" style={{ fontSize: 12 }}>{ROLE_LABEL[c.role]}</span>
            </span>
            <Link className="t-btn t-btn--outline" to={`/send/${c.id}`}>
              보내두기<span className="t-sr"> {c.name}</span>
            </Link>
          </div>
        ))}
        {characters.length < BALANCE.maxCharactersPerAccount && (
          <Link className="t-btn t-btn--ghost" to="/create/1" style={{ alignSelf: 'flex-start' }}>
            캐릭터 더 만들기 ({characters.length} / {BALANCE.maxCharactersPerAccount})
          </Link>
        )}
      </section>
      <Pending what="상황판의 나머지(진행 중, 모여 있는 곳, 내게 온 말)" />
    </Frame>
  );
}

function Pending({ what }: { what: string }) {
  return (
    <div className="t-empty" style={{ border: '1px solid var(--line)' }}>
      <svg className="t-empty__line" viewBox="0 0 260 28" aria-hidden="true">
        <path d="M0 14 H260" />
      </svg>
      <p className="t-empty__title">아직 열리지 않은 칸이에요</p>
      <p className="t-empty__text">다음 작업 묶음에서 만들어요: {what}.</p>
    </div>
  );
}

/** 다음 묶음에서 만들 화면의 자리 (장소 채널, 기록, 단말 설정). 메뉴가 끊기지 않게 둔다. */
export function PendingScreen({ title, ch, what }: { title: string; ch: string; what: string }) {
  return (
    <Frame plate={title} ingame header={<ScreenHeader title={title} sub={ch} back={{ to: '/home', label: '상황판으로' }} />} scrollLabel={title}>
      <Pending what={what} />
    </Frame>
  );
}
