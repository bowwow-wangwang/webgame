// 대화 가짜 서비스. 다른 플레이어의 캐릭터와 대사는 모두 [대괄호] 자리로 둔다.
// 시스템은 다른 사람 캐릭터의 말을 지어내지 않는다 (CLAUDE.md 설계 원칙 1).
import { BALANCE, TEXT_LIMITS } from '../config/balance';
import { josa } from '../lib/josa';
import portraitA from '../assets/sample/portrait-a.webp';
import portraitB from '../assets/sample/portrait-b.webp';
import imgLounge from '../assets/sample/feed-lounge.webp';
import imgMess from '../assets/sample/feed-mess.webp';
import imgCamp from '../assets/sample/feed-camp.webp';
import type { InboxItem, Message, Persona, Result, Room, StayStatus } from '../types/domain';
import { mockStore } from './mock';
import type { GameService, TalkKeys } from './types';

type TalkService = Pick<GameService, TalkKeys>;

const wait = <T,>(v: T, ms = 160) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

// 다른 계정의 캐릭터 (테스트용 자리).
const OTHERS: Persona[] = [
  { id: 'oA', name: '[캐릭터 A]', role: 'ability', portraitUrl: portraitA, mine: false },
  { id: 'oB', name: '[캐릭터 B]', role: 'staff', portraitUrl: portraitB, mine: false },
  { id: 'oC', name: '[캐릭터 C]', role: 'free', portraitUrl: null, mine: false },
  { id: 'oD', name: '[캐릭터 D]', role: 'ability', portraitUrl: portraitB, mine: false },
  { id: 'oE', name: '[캐릭터 E]', role: 'ability', portraitUrl: portraitA, mine: false },
  { id: 'oF', name: '[캐릭터 F]', role: 'staff', portraitUrl: portraitB, mine: false },
];
const other = (id: string) => OTHERS.find((o) => o.id === id) as Persona;
// 하루 한 바퀴(mockDay)가 같은 곳에 있던 캐릭터를 고를 때 쓴다.
export const mockOthers = OTHERS;

interface PlaceDef {
  id: string;
  name: string;
  cam: string;
  imageUrl: string;
  imageAlt: string;
  todayLine?: string;
  staying: [string, StayStatus][];
}
const PLACES: PlaceDef[] = [
  { id: 'lounge', name: '재단 기숙사 휴게실', cam: 'CAM 03', imageUrl: imgLounge, imageAlt: '휴게실 감시 화면: 창가에 낡은 소파 하나', staying: [['oA', '쉬는 중'], ['oB', '근무 중'], ['oC', '쉬는 중'], ['oD', '쉬는 중']] },
  { id: 'mess', name: '식당', cam: 'CAM 05', imageUrl: imgMess, imageAlt: '재단 식당 감시 화면', todayLine: '오늘 메뉴: 있는 것 다 넣은 수프', staying: [['oB', '근무 중']] },
  { id: 'camp', name: '새벽뜰 모닥불 곁', cam: '새벽뜰', imageUrl: imgCamp, imageAlt: '정착지 새벽뜰 모닥불 감시 화면', staying: [['oE', '다녀오는 중'], ['oF', '쉬는 중']] },
];

interface TalkStore {
  messages: Message[];
  dms: { id: string; a: string; b: string }[];
  blocked: string[];
  lastSpeaker: Record<string, string>;
  talkedWith: string[];
  seededFor: string | null;
}
const KEY = 'webgame.mock.talk.v1';
function load(): TalkStore {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as TalkStore;
  } catch {
    // 새로 시작
  }
  return { messages: [], dms: [], blocked: [], lastSpeaker: {}, talkedWith: [], seededFor: null };
}
const t = load();
const save = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // 저장하지 못해도 이번 창에서는 쓸 수 있다
  }
};

function myPersonas(): Persona[] {
  return mockStore.mine().map((c) => ({ id: c.id, name: c.name, role: c.role, portraitUrl: c.portraitUrl, mine: true }));
}
function persona(id: string): Persona | null {
  return myPersonas().find((p) => p.id === id) ?? OTHERS.find((o) => o.id === id) ?? null;
}

/** 처음 열 때 테스트용 대화를 깐다. 내 캐릭터가 생기면 "내게 온 말"도 하나씩 만든다. */
function seed() {
  const mine = myPersonas();
  const key = mine.map((m) => m.id).join(',');
  if (t.seededFor === key) return;
  const fresh = t.messages.length === 0;
  if (fresh) {
    const lounge = (kind: Message['kind'], text: string, min: number, sp?: string): Message => ({ id: uid(), roomId: 'lounge', kind, text, at: ago(min), speaker: sp ? other(sp) : undefined });
    t.messages.push(
      lounge('event', '구석의 고장 난 라디오가 저절로 켜졌다. 잡음 사이로 옛 방송 음악이 조금 흘렀다.', 37),
      lounge('say', '[캐릭터 A의 대사. 플레이어가 쓴 문장 그대로]', 34, 'oA'),
      lounge('say', '[캐릭터 B의 대사]', 21, 'oB'),
      lounge('owner', '[오너끼리 하는 말]', 20, 'oB'),
      lounge('system', `${josa('[캐릭터 C]', '이/가')} 4시간 휴식을 시작했다`, 18),
      { id: uid(), roomId: 'mess', kind: 'say', text: '[캐릭터 B의 대사]', at: ago(50), speaker: other('oB') },
      { id: uid(), roomId: 'camp', kind: 'say', text: '[캐릭터 E의 대사]', at: ago(64), speaker: other('oE') },
    );
  }
  const first = mine[0];
  if (first && !t.dms.some((d) => d.a === 'oF' || d.b === 'oF')) {
    // 다른 사람이 내 캐릭터에게 말을 걸어 둔 상태 (비동기 대화).
    t.messages.push({ id: uid(), roomId: 'lounge', kind: 'say', text: `[캐릭터 E가 ${first.name}에게 건넨 말]`, at: ago(2), speaker: other('oE') });
    const dm = { id: `dm-${uid()}`, a: 'oF', b: first.id };
    t.dms.push(dm);
    t.messages.push({ id: uid(), roomId: dm.id, kind: 'say', text: `[캐릭터 F가 ${first.name}에게 보낸 1:1 대사]`, at: ago(12), speaker: other('oF') });
  }
  t.seededFor = key;
  save();
}

function visible(m: Message) {
  return !m.speaker || !t.blocked.includes(m.speaker.id);
}

function lastLineOf(roomId: string) {
  const m = [...t.messages].reverse().find((x) => x.roomId === roomId && (x.kind === 'say' || x.kind === 'owner') && visible(x));
  return m && m.speaker ? { name: m.speaker.name, text: m.text, at: m.at } : undefined;
}

function placeRoom(p: PlaceDef): Room {
  const mineIds = new Set(myPersonas().map((x) => x.id));
  return {
    id: p.id,
    kind: 'place',
    name: p.name,
    cam: p.cam,
    imageUrl: p.imageUrl,
    imageAlt: p.imageAlt,
    todayLine: p.todayLine,
    staying: p.staying
      .filter(([id]) => !t.blocked.includes(id))
      .map(([id, status]) => ({ persona: other(id), status, newToMe: !t.talkedWith.includes(id) && !mineIds.has(id) }))
      // 아직 대화해 본 적 없는 사람을 앞에 둔다 (교류가 아는 사람끼리만 몰리지 않게).
      .sort((x, y) => Number(y.newToMe) - Number(x.newToMe)),
    lastLine: lastLineOf(p.id),
  };
}

function dmRoom(d: { id: string; a: string; b: string }): Room | null {
  const a = persona(d.a);
  const b = persona(d.b);
  if (!a || !b) return null;
  const me = a.mine ? a : b;
  const them = a.mine ? b : a;
  return { id: d.id, kind: 'dm', name: `${them.name} · ${me.name}`, staying: [], members: [me, them], lastLine: lastLineOf(d.id) };
}

const CONTACT = /(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})|(https?:\/\/)|(www\.)|(@[a-z0-9_]{3,})|(오픈\s?채팅|카톡\s?아이디|디스코드\s?아이디)/i;

export const mockTalk: TalkService = {
  async listRooms() {
    seed();
    const rooms = [...PLACES.map(placeRoom), ...t.dms.map(dmRoom).filter((r): r is Room => r !== null)];
    return wait(rooms);
  },
  async getRoom(id) {
    seed();
    const p = PLACES.find((x) => x.id === id);
    if (p) return wait(placeRoom(p));
    const d = t.dms.find((x) => x.id === id);
    return wait(d ? dmRoom(d) : null);
  },
  async listMessages(roomId) {
    seed();
    return wait(t.messages.filter((m) => m.roomId === roomId && visible(m)));
  },
  async sendMessage({ roomId, speakerId, text, owner }): Promise<Result<Message>> {
    const sp = myPersonas().find((p) => p.id === speakerId);
    if (!sp) return wait({ ok: false, message: '내 캐릭터로만 말할 수 있어요.' });
    const body = text.trim();
    if (!body) return wait({ ok: false, message: '보낼 말을 적어 주세요.' });
    if ([...body].length > TEXT_LIMITS.message) return wait({ ok: false, message: `한 번에 ${TEXT_LIMITS.message}자까지 보낼 수 있어요.` });
    // 실제로는 서버가 금칙어 목록(DB)과 연락처 모양을 함께 검사한다. 어떤 말이 걸렸는지는 알려 주지 않는다.
    if (CONTACT.test(body)) return wait({ ok: false, message: '연락처나 주소는 보낼 수 없어요. 쓴 글은 그대로 있어요.' });
    const now = Date.now();
    const m: Message = {
      id: uid(),
      roomId,
      kind: owner ? 'owner' : 'say',
      speaker: sp,
      text: body,
      at: new Date(now).toISOString(),
      editableUntil: new Date(now + BALANCE.messageFixMinutes * 60_000).toISOString(),
    };
    t.messages.push(m);
    const room = t.dms.find((d) => d.id === roomId);
    if (room) for (const id of [room.a, room.b]) if (!t.talkedWith.includes(id)) t.talkedWith.push(id);
    t.lastSpeaker[roomId] = speakerId;
    save();
    return wait({ ok: true, value: m }, 220);
  },
  async changeSpeaker(messageId, speakerId) {
    const m = t.messages.find((x) => x.id === messageId);
    const sp = myPersonas().find((p) => p.id === speakerId);
    if (!m || !sp || !m.speaker?.mine) return wait({ ok: false, message: '바꿀 수 없는 말이에요.' });
    if (!m.editableUntil || new Date(m.editableUntil) < new Date()) return wait({ ok: false, message: `보낸 지 ${BALANCE.messageFixMinutes}분이 지나 바꿀 수 없어요.` });
    m.speaker = sp;
    t.lastSpeaker[m.roomId] = speakerId;
    save();
    return wait({ ok: true, value: m });
  },
  async deleteMessage(messageId) {
    const m = t.messages.find((x) => x.id === messageId);
    if (!m || !m.speaker?.mine) return wait({ ok: false, message: '지울 수 없는 말이에요.' });
    if (!m.editableUntil || new Date(m.editableUntil) < new Date()) return wait({ ok: false, message: `보낸 지 ${BALANCE.messageFixMinutes}분이 지나 지울 수 없어요.` });
    t.messages = t.messages.filter((x) => x.id !== messageId);
    save();
    return wait({ ok: true, value: undefined });
  },
  async report() {
    // 실제로는 reports에 남기고, 쌓이면 자동으로 숨기며, 운영자 조치는 moderation_log에 남는다.
    return wait({ ok: true, value: undefined }, 300);
  },
  async block(personaId) {
    if (!t.blocked.includes(personaId)) t.blocked.push(personaId);
    save();
    return wait({ ok: true, value: undefined });
  },
  async unblock(personaId) {
    t.blocked = t.blocked.filter((x) => x !== personaId);
    save();
    return wait({ ok: true, value: undefined });
  },
  async listInbox() {
    seed();
    const mine = myPersonas();
    const items: InboxItem[] = [];
    for (const m of [...t.messages].reverse()) {
      if (!m.speaker || m.speaker.mine || !visible(m) || m.kind !== 'say') continue;
      const dm = t.dms.find((d) => d.id === m.roomId);
      const to = dm ? mine.find((x) => x.id === dm.a || x.id === dm.b) : mine.find((x) => m.text.includes(x.name));
      if (!to) continue;
      const where = dm ? '1:1로' : `${PLACES.find((p) => p.id === m.roomId)?.name ?? '장소'}에서`;
      items.push({ id: m.id, roomId: m.roomId, from: m.speaker, to, where, at: m.at, preview: m.text });
    }
    return wait(items);
  },
  async openDm(myId, otherId) {
    const me = myPersonas().find((p) => p.id === myId);
    if (!me || !persona(otherId)) return wait({ ok: false, message: '말을 걸 수 없는 캐릭터예요.' });
    if (t.blocked.includes(otherId)) return wait({ ok: false, message: '차단한 사람이에요. 차단을 풀면 말을 걸 수 있어요.' });
    const found = t.dms.find((d) => (d.a === myId && d.b === otherId) || (d.a === otherId && d.b === myId));
    if (found) return wait({ ok: true, value: found.id });
    const d = { id: `dm-${uid()}`, a: otherId, b: myId };
    t.dms.push(d);
    t.lastSpeaker[d.id] = myId;
    save();
    return wait({ ok: true, value: d.id });
  },
  async getPersona(id) {
    return wait(persona(id), 60);
  },
  async getLastSpeaker(roomId) {
    return wait(t.lastSpeaker[roomId] ?? null, 40);
  },
  async setLastSpeaker(roomId, characterId) {
    t.lastSpeaker[roomId] = characterId;
    save();
  },
};
