// 화면이 주고받는 데이터의 모양. 테이블 설계(docs/data-model.md)는 이 모양을 채우는 쪽으로 맞춘다.

export type Role = 'ability' | 'staff' | 'free';

export const ROLE_LABEL: Record<Role, string> = {
  ability: '능력자',
  staff: '재단 직원',
  free: '무소속',
};

export type MemoryLoss = 'most' | 'period' | 'name' | 'all';

export const MEMORY_LOSS_LABEL: Record<MemoryLoss, string> = {
  most: '거의 다 기억함',
  period: '특정 시기만 빠짐',
  name: '이름만 남음',
  all: '전부 잊음',
};

export type StatKey = 'str' | 'con' | 'dex' | 'emp' | 'int' | 'mind' | 'edu' | 'craft';
export type Stats = Record<StatKey, number>;

export const STAT_ORDER: readonly StatKey[] = ['str', 'con', 'dex', 'emp', 'int', 'mind', 'edu', 'craft'];

/** 능력치 이름. 여덟 번째는 능력자에게 "능력", 재단 직원과 무소속에게 "전문"이다. */
export function statLabel(key: StatKey, role: Role | undefined): string {
  if (key === 'craft') return role === 'ability' ? '능력' : '전문';
  return STAT_META[key].label;
}

export const STAT_META: Record<StatKey, { label: string; meaning: string }> = {
  str: { label: '근력', meaning: '힘, 들고 버티기' },
  con: { label: '건강', meaning: '체력, 오래 버티기' },
  dex: { label: '민첩', meaning: '몸놀림, 빠져나가기' },
  emp: { label: '교감', meaning: '사람을 대하는 힘' },
  int: { label: '지능', meaning: '알아차리고 추리하기' },
  mind: { label: '정신', meaning: '마음의 단단함' },
  edu: { label: '교육', meaning: '배운 지식, 절차와 기록' },
  craft: { label: '능력', meaning: '이능력을 다루는 정도' },
};

export function statMeaning(key: StatKey, role: Role | undefined): string {
  if (key === 'craft' && role !== 'ability') return '그 캐릭터의 직업 기술';
  return STAT_META[key].meaning;
}

export interface Settlement {
  id: string;
  name: string;
}

export interface DraftImage {
  id: string;
  /** 화면에 보여 줄 주소. 가짜 서비스에서는 브라우저의 임시 주소다. */
  url: string;
  alt: string;
  status: 'ready' | 'shrinking';
}

/** 만드는 중인 캐릭터. 단계마다 임시저장된다. */
export interface CharacterDraft {
  role: Role | null;
  name: string;
  look: string;
  personality: string;
  past: string;
  ability: string;
  memoryLoss: MemoryLoss | null;
  originSettlementId: string | null;
  stats: Stats;
  images: DraftImage[];
  savedAt: string | null;
}

export interface Character {
  id: string;
  role: Role;
  name: string;
  /** 능력자만 정부 등록 번호가 붙는다. */
  registrationNo: string | null;
  memoryLoss: MemoryLoss | null;
  originSettlement: Settlement | null;
  stats: Stats;
  past: string;
  portraitUrl: string | null;
  portraitAlt: string;
  createdAt: string;
}

export interface Session {
  accountId: string;
  email: string;
}

export interface QnaPrompt {
  id: string;
  text: string;
}

/** 보내두기: 능력자는 출동, 재단 직원은 근무, 무소속은 다녀오기. */
export type SendKind = 'dispatch' | 'shift' | 'outing';

export const SEND_KIND_LABEL: Record<SendKind, string> = {
  dispatch: '출동',
  shift: '근무',
  outing: '다녀오기',
};

export function sendKindOf(role: Role): SendKind {
  return role === 'ability' ? 'dispatch' : role === 'staff' ? 'shift' : 'outing';
}

export interface SendTarget {
  id: string;
  name: string;
  /** 정화율처럼 고를 때 참고할 짧은 정보. */
  note?: string;
}

export interface SendMethod {
  id: string;
  label: string;
  stat: StatKey;
}

export interface SendOptions {
  kind: SendKind;
  targetLegend: string;
  targets: SendTarget[];
  methods: SendMethod[];
  hours: readonly number[];
}

export interface SendRequest {
  characterId: string;
  targetId: string;
  methodId: string;
  hours: number;
}

export interface ActiveSend {
  id: string;
  characterId: string;
  characterName: string;
  kind: SendKind;
  hours: number;
  targetName: string;
  methodLabel: string;
  startedAt: string;
  endsAt: string;
}

export interface Place {
  id: string;
  name: string;
  staying: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; message: string; field?: string };

// ── 대화 ──

/** 대화에 나오는 캐릭터. 다른 사람의 캐릭터는 이름, 역할, 대표 사진만 안다. */
export interface Persona {
  id: string;
  name: string;
  role: Role;
  portraitUrl: string | null;
  /** 내 계정의 캐릭터인가 (자관). */
  mine: boolean;
}

export type StayStatus = '쉬는 중' | '근무 중' | '다녀오는 중' | '출동 중';

export interface Staying {
  persona: Persona;
  status: StayStatus;
  /** 아직 대화해 본 적 없는 사람 (다른 계정만). 마주칠 기회를 앞에 둔다. */
  newToMe: boolean;
}

export type RoomKind = 'place' | 'dm';

export interface Room {
  id: string;
  kind: RoomKind;
  name: string;
  /** 장소 채널의 감시 화면 꼬리표 (CAM 03, 새벽뜰 등). */
  cam?: string;
  imageUrl?: string;
  imageAlt?: string;
  /** 오늘 메뉴 같은 그날의 한 줄. */
  todayLine?: string;
  staying: Staying[];
  /** 1:1 방이면 상대와 나의 캐릭터. */
  members?: Persona[];
  lastLine?: { name: string; text: string; at: string };
}

export type MessageKind = 'say' | 'owner' | 'system' | 'event';

export interface Message {
  id: string;
  roomId: string;
  kind: MessageKind;
  speaker?: Persona;
  text: string;
  at: string;
  /** 이 시각까지 내 말을 다른 캐릭터로 바꾸거나 지울 수 있다. */
  editableUntil?: string;
}

export interface InboxItem {
  id: string;
  roomId: string;
  from: Persona;
  to: Persona;
  where: string;
  at: string;
  preview: string;
}

export type ReportReason = 'harm' | 'contact' | 'harass' | 'other';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  harm: '수위를 넘는 내용 (성적이거나 잔혹함)',
  contact: '외부 연락처를 묻거나 알려 줌',
  harass: '괴롭힘이나 멸칭으로 공격함',
  other: '그 밖의 문제',
};

// ── 판독지, 관계, 명부 ──

export type RelKind = 'lost' | 'settlement' | 'care' | 'trip' | 'free';

export const REL_LABEL: Record<RelKind, string> = {
  lost: '잃어버린 인연',
  settlement: '같은 정착지 출신',
  care: '담당',
  trip: '여행에서 만난 사이',
  free: '자유 입력',
};

export const REL_DESC: Record<RelKind, string> = {
  lost: '발현 이전에 서로 알던 사이. 기억은 없지만 감정이 남았어요.',
  settlement: '같은 정착지에서 왔어요.',
  care: '능력자와 재단 직원의 고정 파트너. 재단 직원이 판독지 재단 메모를 써요.',
  trip: '길 위에서 만났어요.',
  free: '두 주인이 관계 이름을 직접 적어요.',
};

export interface Relation {
  id: string;
  kind: RelKind;
  /** 자유 입력이면 관계 이름, 아니면 두 주인이 적은 한 줄. */
  note: string;
  other: Persona;
}

export interface RelationRequest {
  id: string;
  from: Persona;
  to: Persona;
  kind: RelKind;
  note: string;
  at: string;
}

export interface ChoiceLine {
  id: string;
  date: string;
  text: string;
  gov?: boolean;
  hidden: boolean;
}

export interface QnaLine {
  id: string;
  question: string;
  answer: string;
}

export interface Dossier {
  persona: Persona;
  registrationNo: string | null;
  origin: Settlement | null;
  memoryLoss: MemoryLoss | null;
  ability: string;
  past: string;
  look: string;
  personality: string;
  /** 주인이 숫자를 숨겼으면 null (다른 사람에게만). */
  stats: Stats | null;
  statsHidden: boolean;
  /** 지금 상태 한 줄 (출동 중, 근무 중 등). */
  status: string | null;
  /** 능력자만: 최근 7일 오염. */
  contamination: number[] | null;
  choices: ChoiceLine[];
  qna: QnaLine[];
  /** 담당 재단 직원이 쓴 메모 (능력자만). */
  memo: { by: string; text: string } | null;
  relations: Relation[];
  createdAt: string;
}

export type ActivityKind = 'dispatch' | 'shift' | 'outing' | 'choice' | 'register';

export interface Activity {
  id: string;
  kind: ActivityKind;
  at: string;
  title: string;
  rows: [string, string][];
  body?: string;
  meta: string[];
  form?: string;
  running?: boolean;
}

export interface DirectoryEntry {
  persona: Persona;
  origin: string | null;
  /** 아직 대화해 본 적 없는 사람 (다른 계정만). */
  newToMe: boolean;
}
