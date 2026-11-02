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
