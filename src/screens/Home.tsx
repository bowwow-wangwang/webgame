import { Link } from 'react-router';
import { BALANCE } from '../config/balance';
import { useSession } from '../lib/session';
import { useIsDesktop } from '../lib/useIsDesktop';
import { Frame, ScreenHeader } from '../shell/Frame';
import { TodayList } from '../shell/Today';
import { ChatLog, Composer } from '../ui/chat/Chat';
import { Loading } from '../ui/Loading';
import { InboxList, PlaceCard, useRooms } from './talk/TalkScreens';
import { useRoom } from './talk/useRoom';

/**
 * M-11 · P-03 상황판. 홈의 중심은 대화다: 내게 온 말과 모여 있는 곳을 가장 크게,
 * 진행 중인 일은 오늘 한눈에로 작게 둔다.
 */
export function HomeScreen() {
  const desktop = useIsDesktop();
  const { characters } = useSession();
  const { rooms, inbox } = useRooms();
  const places = (rooms ?? []).filter((r) => r.kind === 'place').sort((a, b) => b.staying.length - a.staying.length);
  const busiest = places[0];
  const room = useRoom(desktop ? busiest?.id : undefined);

  if (!rooms) return <Frame plate="상황판" ingame><Loading text="오늘의 기록을 불러오는 중" /></Frame>;

  const more = characters.length < BALANCE.maxCharactersPerAccount && (
    <Link className="t-btn t-btn--ghost" to="/create/1" style={{ alignSelf: 'flex-start' }}>
      캐릭터 더 만들기 ({characters.length} / {BALANCE.maxCharactersPerAccount})
    </Link>
  );

  if (desktop && busiest) {
    return (
      <>
        <Frame
          plate="상황판"
          ingame
          flush
          header={
            <ScreenHeader
              title={busiest.name}
              sub="CH.01 상황판 · 지금 가장 많이 모인 곳"
              right={
                <Link className="t-btn t-btn--outline" to={`/place/${busiest.id}`}>
                  채널 크게 열기
                </Link>
              }
            />
          }
          right={
            <div className="app-side">
              <section aria-labelledby="in-h" className="app-sec">
                <h2 id="in-h" className="t-label app-sec__head">
                  <span>내게 온 말 {inbox.length || ''}</span>
                  <Link to="/talk">모두 보기</Link>
                </h2>
                <InboxList items={inbox} limit={3} />
              </section>
              <section aria-labelledby="else-h" className="app-sec">
                <h2 id="else-h" className="t-label">
                  다른 곳
                </h2>
                {places.slice(1).map((p) => (
                  <PlaceCard key={p.id} room={p} />
                ))}
              </section>
              {more}
            </div>
          }
          bar={
            <Composer
              speaker={room.speaker}
              roomName={busiest.name}
              owner={room.owner}
              onOwner={room.setOwner}
              onSwitch={room.openSpeakerSheet}
              onSend={room.send}
              canSwitch={room.mine.length > 1}
            />
          }
          scrollLabel="상황판"
          keys={[['[C]', '말하는 캐릭터'], ['[Enter]', '보내기']]}
        >
          <ChatLog messages={room.messages} onAction={(a) => void room.act(a)} canTalk />
        </Frame>
        {room.sheets}
      </>
    );
  }

  return (
    <Frame plate="상황판" ingame header={<ScreenHeader title="상황판" sub="CH.01" />} scrollLabel="상황판">
      <section aria-labelledby="in-h" className="app-sec">
        <h2 id="in-h" className="t-label app-sec__head">
          <span>내게 온 말 {inbox.length || ''}</span>
          <Link to="/talk">모두 보기</Link>
        </h2>
        <InboxList items={inbox} limit={2} />
      </section>
      <section aria-labelledby="pl-h" className="app-sec">
        <h2 id="pl-h" className="t-label">
          지금 모여 있는 곳
        </h2>
        {busiest && <PlaceCard room={busiest} big />}
        <div className="app-cards2">
          {places.slice(1, 3).map((p) => (
            <PlaceCard key={p.id} room={p} />
          ))}
        </div>
      </section>
      <section aria-labelledby="today-h" className="app-sec">
        <h2 id="today-h" className="t-label">
          오늘 한눈에
        </h2>
        <TodayList />
        {more}
      </section>
    </Frame>
  );
}
