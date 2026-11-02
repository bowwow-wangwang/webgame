import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useIsDesktop } from '../../lib/useIsDesktop';
import { ago, clockKST } from '../../lib/time';
import { api } from '../../services';
import { Frame, ScreenHeader } from '../../shell/Frame';
import { ROLE_LABEL, type InboxItem, type Room } from '../../types/domain';
import { ChatLog, Composer, Face } from '../../ui/chat/Chat';
import { Loading } from '../../ui/Loading';
import { useToast } from '../../ui/Toast';
import { useRoom } from './useRoom';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  useEffect(() => {
    void Promise.all([api.listRooms(), api.listInbox()]).then(([r, i]) => {
      setRooms(r);
      setInbox(i);
    });
  }, []);
  return { rooms, inbox };
}

/** 내게 온 말: 누가, 어디서, 내 어느 캐릭터에게. 답장을 재촉하는 표시는 두지 않는다. */
export function InboxList({ items, limit }: { items: InboxItem[]; limit?: number }) {
  if (!items.length) return <p className="t-field__help" style={{ margin: 0 }}>아직 내 캐릭터에게 온 말이 없어요.</p>;
  return (
    <ul className="app-list">
      {items.slice(0, limit).map((i) => (
        <li key={i.id}>
          <Link to={i.roomId.startsWith('dm-') ? `/dm/${i.roomId}` : `/place/${i.roomId}`} className="t-chat__msg app-inbox">
            <Face p={i.from} />
            <span style={{ minWidth: 0 }}>
              <span className="t-chat__head">
                <span className="t-chat__name">{i.from.name}</span>
                <span className="t-chat__time">{ago(i.at)}</span>
              </span>
              <span className="t-muted" style={{ display: 'block', fontSize: 12 }}>
                {i.where} {i.to.name}에게
              </span>
              <span className="t-chat__text app-ellipsis" style={{ display: 'block' }}>
                {i.preview}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 장소 채널 카드: 감시 화면 사진 위에 이름, 머무는 사람, 마지막 한 줄. */
export function PlaceCard({ room, big }: { room: Room; big?: boolean }) {
  const faces = room.staying.slice(0, 4);
  if (!big) {
    return (
      <Link className="t-feedcard" to={`/place/${room.id}`} style={{ height: 112 }}>
        {room.imageUrl && <img src={room.imageUrl} alt={room.imageAlt ?? ''} />}
        <span className="t-feed__rec">{room.cam}</span>
        <span className="t-feedcard__body t-feedcard__body--bar">
          <span className="t-pixel app-ellipsis" style={{ fontSize: 14 }}>
            {room.name}
          </span>
          <span className="t-muted app-ellipsis" style={{ fontSize: 12 }}>
            {room.todayLine ?? `머무는 중 ${room.staying.length}`}
          </span>
        </span>
      </Link>
    );
  }
  return (
    <Link className="t-feedcard" to={`/place/${room.id}`} style={{ height: 168 }}>
      {room.imageUrl && <img src={room.imageUrl} alt={room.imageAlt ?? ''} />}
      <span className="t-feed__rec">REC {room.cam}</span>
      <span className="t-feedcard__body">
        <span className="t-pixel t-glow" style={{ fontSize: 16 }}>
          {room.name}
        </span>
        <span className="t-faces">
          {faces.map((s) => (s.persona.portraitUrl ? <img key={s.persona.id} src={s.persona.portraitUrl} alt="" /> : null))}
          <span>머무는 중 {room.staying.length}</span>
        </span>
        {room.lastLine && (
          <span className="app-ellipsis" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--reading)' }}>
            {room.lastLine.name} {room.lastLine.text}
          </span>
        )}
      </span>
    </Link>
  );
}

/** 통신 (CH.02): 내게 온 말, 장소 채널, 1:1 대화. */
export function TalkScreen() {
  const { rooms, inbox } = useRooms();
  if (!rooms) return <Frame plate="통신" ingame><Loading text="무전 채널을 맞추는 중" /></Frame>;
  const places = rooms.filter((r) => r.kind === 'place');
  const dms = rooms.filter((r) => r.kind === 'dm');
  return (
    <Frame plate="통신" ingame header={<ScreenHeader title="통신" sub="CH.02" />} scrollLabel="통신" deskClass="app-desk--narrow">
      <section aria-labelledby="in-h" className="app-sec">
        <h2 id="in-h" className="t-label">
          내게 온 말 {inbox.length || ''}
        </h2>
        <InboxList items={inbox} />
      </section>
      <section aria-labelledby="pl-h" className="app-sec">
        <h2 id="pl-h" className="t-label">
          장소 채널
        </h2>
        <ul className="app-list">
          {places.map((r) => (
            <li key={r.id}>
              <Link className="t-btn t-btn--row" to={`/place/${r.id}`}>
                <span className="app-ellipsis">{r.name}</span>
                <span className="t-btn__count">머무는 중 {r.staying.length}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="t-field__help" style={{ margin: 0 }}>
          사람이 늘면 장소 채널이 하나씩 더 열려요.
        </p>
      </section>
      <section aria-labelledby="dm-h" className="app-sec">
        <h2 id="dm-h" className="t-label">
          1:1 대화
        </h2>
        {dms.length ? (
          <ul className="app-list">
            {dms.map((r) => (
              <li key={r.id}>
                <Link className="t-btn t-btn--row" to={`/dm/${r.id}`}>
                  <span className="app-ellipsis">{r.name}</span>
                  <span className="t-btn__count">{r.lastLine ? ago(r.lastLine.at) : ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-field__help" style={{ margin: 0 }}>
            장소 채널에서 다른 캐릭터의 말 옆 "더 보기"를 누르면 1:1로 말을 걸 수 있어요.
          </p>
        )}
      </section>
    </Frame>
  );
}

/** 머무는 중: 보내두기로 그 장소에 있는 캐릭터. 주인이 없어도 말을 걸어 두면 돌아와 답한다. */
function StayingList({ room, onTalk }: { room: Room; onTalk: (id: string) => void }) {
  return (
    <ul className="app-list">
      {room.staying.map((s) => (
        <li key={s.persona.id} className="app-staying">
          <Face p={s.persona} size={36} />
          <span className="app-staying__text">
            <span>
              {s.persona.name} {s.newToMe && <span className="t-tag">처음 만남</span>}
            </span>
            <span className="t-muted" style={{ fontSize: 12 }}>
              {ROLE_LABEL[s.persona.role]} · {s.status}
            </span>
          </span>
          <button type="button" className="t-btn t-btn--outline" onClick={() => onTalk(s.persona.id)}>
            말 걸기<span className="t-sr"> {s.persona.name}에게</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function useSpeakerKey(open: () => void) {
  useEffect(() => {
    // PC 단축키 [C]: 글을 쓰는 중이 아닐 때만 말하는 캐릭터 바꾸기를 연다.
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) open();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
}

/** 대화방 하나를 그린다 (장소 채널과 1:1이 같이 쓴다). */
export function RoomScreen({ roomId, kind }: { roomId: string; kind: 'place' | 'dm' }) {
  const desktop = useIsDesktop();
  const toast = useToast();
  const nav = useNavigate();
  const r = useRoom(roomId);
  const { rooms } = useRooms();
  useSpeakerKey(r.openSpeakerSheet);

  if (r.room === null) return <Navigate to="/talk" replace />;
  if (!r.room) return <Frame plate="통신" ingame mobileNav={false}><Loading text="무전 채널을 맞추는 중" /></Frame>;
  const room = r.room;

  async function talkTo(otherId: string) {
    if (!r.speaker) return;
    const res = await api.openDm(r.speaker.id, otherId);
    if (!res.ok) return toast({ kind: 'danger', text: res.message });
    nav(`/dm/${res.value}`);
  }

  const them = room.members?.find((m) => !m.mine);
  const title = kind === 'dm' ? (them?.name ?? '1:1 대화') : room.name;
  const sub = kind === 'dm' ? `1:1 · ${room.members?.find((m) => m.mine)?.name ?? ''}` : 'CH.02 장소 채널';

  const banner =
    kind === 'place' ? (
      <div className="t-banner" style={{ height: desktop ? 200 : 176, flexShrink: 0 }}>
        {room.imageUrl && <img src={room.imageUrl} alt={room.imageAlt ?? ''} />}
        <span className="t-banner__corner" style={{ left: 10 }}>
          <span className="t-feed__rec" style={{ position: 'static' }}>
            REC {room.cam}
          </span>
        </span>
        <span className="t-banner__corner" style={{ right: 10 }}>
          {clockKST(new Date())}
        </span>
        <div className="t-banner__text">
          {room.todayLine && <span className="t-label" style={{ color: 'var(--ink)' }}>{room.todayLine}</span>}
          <span className="t-label" style={{ color: 'var(--ink)' }}>
            머무는 중 {room.staying.length}
          </span>
          {!desktop && (
            <div className="app-staytags">
              {room.staying.slice(0, 3).map((s) => (
                <button key={s.persona.id} type="button" className="t-tag t-tag--on-photo app-staytag" onClick={() => void talkTo(s.persona.id)}>
                  <Face p={s.persona} size={28} />
                  {s.persona.name} {s.status}
                  <span className="t-sr">, 1:1로 말 걸기</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : null;

  let right: ReactNode = undefined;
  if (desktop) {
    const others = (rooms ?? []).filter((x) => x.kind === 'place' && x.id !== room.id);
    right = (
      <div className="app-side">
        {kind === 'place' ? (
          <section aria-labelledby="stay-h" className="app-sec">
            <h2 id="stay-h" className="t-label">
              머무는 중 {room.staying.length}
            </h2>
            <StayingList room={room} onTalk={(id) => void talkTo(id)} />
          </section>
        ) : (
          them && (
            <section aria-labelledby="them-h" className="app-sec">
              <h2 id="them-h" className="t-label">
                대화 상대
              </h2>
              <div className="app-staying">
                <Face p={them} size={44} />
                <span className="app-staying__text">
                  <span style={{ fontWeight: 700 }}>{them.name}</span>
                  <span className="t-muted" style={{ fontSize: 12 }}>
                    {ROLE_LABEL[them.role]}
                  </span>
                </span>
              </div>
              <p className="t-field__help" style={{ margin: 0 }}>
                판독지와 관계 신청은 다음 작업 묶음에서 열려요.
              </p>
            </section>
          )
        )}
        {others.length > 0 && (
          <section aria-labelledby="else-h" className="app-sec">
            <h2 id="else-h" className="t-label">
              다른 곳
            </h2>
            {others.map((o) => (
              <PlaceCard key={o.id} room={o} />
            ))}
          </section>
        )}
      </div>
    );
  }

  return (
    <>
      <Frame
        plate={kind === 'place' ? room.cam ?? '통신' : '1:1'}
        ingame
        mobileNav={false}
        flush
        header={<ScreenHeader title={title} sub={sub} back={{ to: '/talk', label: '통신으로 돌아가기' }} />}
        right={right}
        bar={
          <Composer
            speaker={r.speaker}
            roomName={title}
            owner={r.owner}
            onOwner={r.setOwner}
            onSwitch={r.openSpeakerSheet}
            onSend={r.send}
            canSwitch={r.mine.length > 1}
          />
        }
        scrollLabel="대화 내용"
        keys={[['[C]', '말하는 캐릭터'], ['[Enter]', '보내기'], ['[Shift+Enter]', '줄바꿈']]}
      >
        {banner}
        <ChatLog messages={r.messages} onAction={(a) => void r.act(a)} canTalk={kind === 'place'} />
      </Frame>
      {r.sheets}
    </>
  );
}

export function PlaceScreen() {
  const { id } = useParams();
  return id ? <RoomScreen key={id} roomId={id} kind="place" /> : <Navigate to="/talk" replace />;
}

export function DmScreen() {
  const { id } = useParams();
  return id ? <RoomScreen key={id} roomId={id} kind="dm" /> : <Navigate to="/talk" replace />;
}
