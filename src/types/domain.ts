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

/**
 * 판독지 "발현 이전 기록" 칸. 기억상실 정도만큼 뒤에서부터 말소된다 (직업 → 거주지 → 생년 → 본명).
 * 말소된 항목은 입력할 수 없고, 남은 항목은 비워 둬도 된다.
 */
export type PreRecordKey = 'realName' | 'born' | 'home' | 'job';
export type PreRecord = Partial<Record<PreRecordKey, string>>;

export const PRE_RECORD_ITEMS: readonly { key: PreRecordKey; label: string; hint: string }[] = [
  { key: 'realName', label: '본명', hint: '발현 전에 쓰던 이름. 지금 이름과 같아도 돼요.' },
  { key: 'born', label: '생년', hint: '태어난 해나 나이. 대략이어도 돼요.' },
  { key: 'home', label: '거주지', hint: '살던 곳. 지명이 아니어도 돼요.' },
  { key: 'job', label: '직업', hint: '발현 전에 하던 일.' },
];

const PRE_REDACTED: Record<MemoryLoss, number> = { most: 1, period: 2, name: 3, all: 4 };

export function redactedCount(loss: MemoryLoss | null): number {
  return loss ? PRE_REDACTED[loss] : 0;
}

/** 말소되지 않은 항목만 남긴다. 기억상실 정도를 바꾸면 말소된 칸의 글도 함께 지운다. */
export function keepOpen(pre: PreRecord | undefined, loss: MemoryLoss | null): PreRecord {
  const open = PRE_RECORD_ITEMS.length - redactedCount(loss);
  const out: PreRecord = {};
  PRE_RECORD_ITEMS.slice(0, open).forEach(({ key }) => {
    const v = pre?.[key];
    if (v) out[key] = v;
  });
  return out;
}

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
  preRecord: PreRecord;
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
  preRecord: PreRecord;
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
  /** 운영자 계정 (admins 테이블). 화면은 입구만 보이고 숨기는 데 쓰고, 권한은 서버 함수가 다시 확인한다. */
  admin?: boolean;
}

export interface QnaPrompt {
  id: string;
  text: string;
}

/** 보내두기: 능력자는 출동, 재단 직원은 근무, 무소속은 다녀오기. */
/** 보내두기의 종류. 휴식도 시간을 골라 보내 두면 서버가 끝난 뒤 정산한다. */
export type SendKind = 'dispatch' | 'shift' | 'outing' | 'rest';

export const SEND_KIND_LABEL: Record<SendKind, string> = {
  dispatch: '출동',
  shift: '근무',
  outing: '다녀오기',
  rest: '휴식',
};

export type WorkKind = Exclude<SendKind, 'rest'>;

export function sendKindOf(role: Role): WorkKind {
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
  /** 능력자만: "능력을 아끼지 않는다". 켜면 능력으로 판정하고 오염이 더 쌓인다. */
  boost: { extraContamination: number } | null;
  /** 지금 보낼 수 없으면 그 이유 (폭주 중, 이미 보낸 일이 있음). */
  blocked: string | null;
  /** 판정에서 빠지는 값 (오염이 높을 때). 꼬리표에는 뺀 값을 적는다. */
  penalty: number;
}

export interface SendRequest {
  characterId: string;
  targetId: string;
  methodId: string;
  hours: number;
  boost?: boolean;
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
  boost?: boolean;
  /** 도착했지만 아직 고르지 않은 갈림길이 있다. */
  forkWaiting?: boolean;
  /** 끝났고 결과를 아직 보지 않았다. */
  unseen?: boolean;
}

// ── 판정 ──

/** 성공 단계. 대성공(01)과 대실패(96~100)는 서버 설정값이다. */
export type Grade = 'crit' | 'extreme' | 'hard' | 'success' | 'fail' | 'fumble';

export const GRADE_LABEL: Record<Grade, string> = {
  crit: '대성공',
  extreme: '극단적 성공',
  hard: '어려운 성공',
  success: '성공',
  fail: '실패',
  fumble: '대실패',
};

export function isSuccess(g: Grade) {
  return g !== 'fail' && g !== 'fumble';
}

/** 서버가 굴린 판정 한 번. 화면은 이 값을 보여 주기만 한다. */
export interface Roll {
  stat: StatKey;
  /** 역할에 맞춘 능력치 이름 (능력 / 전문). */
  statLabel: string;
  /** 판정 기준 = 능력치 - 감점. */
  target: number;
  penalty: number;
  value: number;
  grade: Grade;
}

export interface Gain {
  label: string;
  value: string;
}

/** 판독지에 남는 문서 한 장 (정부 공문 / 재단 메모). */
export interface PaperNote {
  from: 'gov' | 'foundation';
  text: string;
}

export interface ForkOption {
  id: string;
  label: string;
  /** 판정이 붙은 선택지만. 기준은 이 캐릭터의 지금 수치(감점 뒤). */
  stat: StatKey | null;
  statLabel: string | null;
  target: number | null;
  auto: boolean;
}

/** 보내두기 중 갈림길. 문구는 설정집 "이벤트 스크립트" 탭이 시드로 들어온다. */
export interface Fork {
  sendId: string;
  code: string;
  title: string;
  situation: string;
  gov: boolean;
  options: ForkOption[];
  /** 이때까지 고르지 않으면 자동 선택지로 처리된다 (보내두기가 끝날 때). */
  deadline: string;
  chosen: ForkOutcome | null;
  /** 상황에 실제로 들어간 다른 캐릭터. 시스템은 이들의 말이나 행동을 지어내지 않는다. */
  met: Persona[];
}

export interface ForkOutcome {
  optionId: string;
  optionLabel: string;
  auto: boolean;
  roll: Roll | null;
  text: string;
  /** 판독지 선택 기록에 남는 한 줄. 자동 처리는 남지 않는다. */
  record: string | null;
  paper: PaperNote | null;
}

export interface SendResult {
  sendId: string;
  characterId: string;
  characterName: string;
  role: Role;
  kind: SendKind;
  targetName: string;
  methodLabel: string;
  hours: number;
  endedAt: string;
  roll: Roll | null;
  /** 밀어붙이기를 썼으면 처음 굴림. */
  firstRoll: Roll | null;
  /** 실패했고 아직 밀어붙이지 않았으면 대가를 적는다. */
  push: { cost: string } | null;
  /** 출동만: 순조 / 고전. */
  outcome: '순조' | '고전' | null;
  lines: string[];
  quip: string | null;
  gains: Gain[];
  items: { name: string; count: number }[];
  contamination: { before: number; after: number } | null;
  /** 판정에 성공해 성장 표시가 붙은 능력치. */
  growth: { stat: StatKey; label: string } | null;
  fork: (ForkOutcome & { title: string }) | null;
  /** 같은 곳에 있던 다른 캐릭터 (말 걸기 계기). */
  met: Persona[];
}

/** 능력자의 오염 상태. 재단 직원과 무소속에게는 쌓이지 않는다. */
export type ContaminationLevel = 'calm' | 'caution' | 'overload';

export interface Condition {
  characterId: string;
  contamination: number | null;
  level: ContaminationLevel;
  penalty: number;
  /** 폭주 중이면 출동할 수 있게 되는 때. */
  overloadUntil: string | null;
  /** 최근 7일 오염 (판독지 기록). */
  week: number[] | null;
}

export type RestKind = 'alone' | 'together' | 'counsel' | 'treat' | 'settlement';

export interface RestOption {
  id: RestKind;
  label: string;
  place: string;
  desc: string;
  /** 시간별로 줄어들 오염 (서버가 계산한 예상치). */
  estimate: Record<number, number>;
  /** 상담과 치료는 재단 직원에게 남기는 요청이다. 받지 않아도 혼자 쉬기만큼은 줄어든다. */
  request: boolean;
  disabled: string | null;
}

export interface RestOptions {
  options: RestOption[];
  hours: readonly number[];
  blocked: string | null;
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

/** 운영자가 가릴 수 있는 판독지 칸. */
export type DossierPart = 'ability' | 'past' | 'look' | 'personality' | 'image';

export const DOSSIER_PART_LABEL: Record<DossierPart, string> = {
  ability: '능력',
  past: '본인 진술',
  look: '외형',
  personality: '성격',
  image: '사진',
};

export interface Dossier {
  persona: Persona;
  registrationNo: string | null;
  origin: Settlement | null;
  memoryLoss: MemoryLoss | null;
  preRecord: PreRecord;
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
  /** 운영자가 숨기거나 지운 칸. 다른 사람에게는 내용 없이 내려온다. */
  veiled: DossierPart[];
}

export type ActivityKind = 'dispatch' | 'shift' | 'outing' | 'rest' | 'choice' | 'register';

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

// ── 단말 설정 ──

/** 알림 종류. 약속(동행 탐색)과 교환은 그 기능이 열릴 때 더한다. */
export type NotifyKind = 'send' | 'talk' | 'relation' | 'care';

export const NOTIFY_KINDS: readonly { kind: NotifyKind; label: string; desc: string }[] = [
  { kind: 'send', label: '보내두기', desc: '출동, 근무, 다녀오기, 휴식이 끝났을 때와 갈림길이 왔을 때' },
  { kind: 'talk', label: '말 걸기', desc: '내 캐릭터에게 누군가 말을 걸었을 때' },
  { kind: 'relation', label: '관계 신청', desc: '다른 캐릭터가 관계를 신청했을 때' },
  { kind: 'care', label: '케어 요청', desc: '상담·치료 요청을 받았거나, 내 요청을 누가 받았을 때' },
];

/** 계정마다 서버에 저장한다 (notification_settings). */
export interface NotificationSettings {
  kinds: Record<NotifyKind, boolean>;
  /** 밤 시간에는 보내지 않고 아침에 묶어 보낸다. 기본으로 켜져 있다. */
  quietNight: boolean;
}

// ── 운영 (신고와 조치) ──

export type ReportTargetKind = 'message' | 'profile' | 'image' | 'qna';

export const REPORT_TARGET_LABEL: Record<ReportTargetKind, string> = {
  message: '대화',
  profile: '판독지 글',
  image: '캐릭터 이미지',
  qna: '문답 답',
};

/** 같은 대상에 들어온 신고를 한 건으로 묶은 것. */
export interface ReportCase {
  id: string;
  targetKind: ReportTargetKind;
  /** 신고된 내용 일부 (운영자에게만). */
  excerpt: string;
  where: string;
  author: Persona;
  /** 작성자 계정 (운영자에게만 보이는 짧은 표시). */
  account: { id: string; label: string; characters: number; sanctions: number };
  reasons: { reason: ReportReason; count: number }[];
  count: number;
  /** 신고 메모 (신고한 사람이 남긴 말). 누가 신고했는지는 보여 주지 않는다. */
  memos: string[];
  firstAt: string;
  lastAt: string;
  status: 'open' | 'done';
  content: 'shown' | 'hidden' | 'deleted';
  /** 신고가 기준 수 이상 쌓여 운영자 확인 전까지 자동으로 숨겼다. */
  autoHidden: boolean;
  /** 이미지 신고면 운영자에게 원본을 보여 준다 (숨겼어도). */
  imageUrl: string | null;
  actions: ModAction[];
}

/** 판독지에서 무엇을 신고하는지. */
export type ReportPart = { kind: 'profile'; field: Exclude<DossierPart, 'image'> } | { kind: 'image' } | { kind: 'qna'; id: string };

export type ModActionKind = 'hide' | 'unhide' | 'delete' | 'dismiss' | 'close' | 'warn' | 'suspend' | 'ban' | 'lift' | 'config';

export const MOD_ACTION_LABEL: Record<ModActionKind, string> = {
  hide: '숨김',
  unhide: '다시 보임',
  delete: '지움',
  dismiss: '문제없음으로 닫음',
  close: '처리 끝',
  warn: '경고',
  suspend: '기간 정지',
  ban: '영구 정지',
  lift: '제재 풂',
  config: '설정 변경',
};

/** 조치 기록 (moderation_log). 운영자가 방치하지 않았다는 근거가 된다. */
export interface ModAction {
  id: string;
  at: string;
  by: string;
  kind: ModActionKind;
  /** 무엇에 대한 조치인지 한 줄. */
  target: string;
  reportId: string | null;
  memo: string;
  /** 기간 정지면 풀리는 때. */
  until: string | null;
}

export interface Sanction {
  id: string;
  accountId: string;
  accountLabel: string;
  kind: 'warn' | 'suspend' | 'ban';
  at: string;
  until: string | null;
  reason: string;
  active: boolean;
}

export type ModRequest =
  | { kind: 'hide' | 'unhide' | 'delete' | 'dismiss' | 'close' | 'warn' | 'ban'; memo: string }
  | { kind: 'suspend'; memo: string; days: number };
