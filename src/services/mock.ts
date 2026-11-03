// 가짜 서비스: Supabase가 붙기 전까지 화면을 눌러 볼 수 있게 한다.
// 여기서 하는 검사와 계산은 나중에 서버 함수가 할 일을 흉내 낸 것이다. 화면 코드로 옮기지 않는다.
import { BALANCE, TEXT_LIMITS } from '../config/balance';
import {
  STAT_ORDER,
  keepOpen,
  type ActiveSend,
  type Character,
  type CharacterDraft,
  type Place,
  type Result,
  type SendOptions,
  type WorkKind,
  type NotificationSettings,
  type Session,
  type Settlement,
} from '../types/domain';
import type { DayKeys, DossierKeys, GameService, TalkKeys } from './types';

// 판독지에 쓰는 설정 글도 같이 둔다 (화면용 Character에는 없는 칸).
export type StoredChar = Character & { ownerId: string; look: string; personality: string; ability: string; statsHidden?: boolean };

interface Store {
  accounts: { id: string; email: string; password: string }[];
  session: Session | null;
  draft: CharacterDraft | null;
  characters: StoredChar[];
  sends: ActiveSend[];
  usedCodes: string[];
  nextRegNo: number;
  notify?: NotificationSettings;
}

const KEY = 'webgame.mock.v1';
const empty = (): Store => ({ accounts: [], session: null, draft: null, characters: [], sends: [], usedCodes: [], nextRegNo: 417 });

function load(): Store {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...empty(), ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    // 개인 창이나 저장소 차단: 새로 시작한다.
  }
  return empty();
}
let store = load();
function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // 저장하지 못해도 이번 창에서는 계속 쓸 수 있다.
  }
}

// 서버 응답처럼 조금 기다리게 해서 "불러오는 중" 상태가 실제로 보이게 한다.
const wait = <T,>(v: T, ms = 280) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const uid = () => Math.random().toString(36).slice(2, 10);

const SETTLEMENTS: Settlement[] = [
  { id: 'saebyeok', name: '새벽뜰' },
  { id: 'esperanza', name: '누에바 에스페란사' },
  { id: 'stella', name: '스텔라' },
];

// 진짜 서버에서는 운영자가 넣은 금칙어 목록(DB)으로 검사한다. 여기서는 연락처 모양만 흉내 낸다.
const CONTACT_PATTERN = /(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})|(https?:\/\/)|(www\.)|(@[a-z0-9_]{3,})/i;

function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[\s-]/g, '');
}

export const SEND_TABLE: Record<WorkKind, Pick<SendOptions, 'kind' | 'targetLegend' | 'targets' | 'methods'>> = {
  dispatch: {
    kind: 'dispatch',
    targetLegend: '출동할 구역',
    targets: [
      { id: 'E-07', name: '에브론 경계지대 E-07', note: '정화 41%' },
      { id: 'T-02', name: '토르빈 옛 제철소', note: '정화 8%' },
      { id: 'E-11', name: '에브론 경계지대 E-11', note: '정화 77%' },
    ],
    methods: [
      { id: 'front', label: '정면으로', stat: 'str' },
      { id: 'around', label: '조용히 돌아서', stat: 'dex' },
      { id: 'steady', label: '버티며 신중하게', stat: 'mind' },
    ],
  },
  shift: {
    kind: 'shift',
    targetLegend: '근무지',
    targets: [
      { id: 'clinic', name: '의료동' },
      { id: 'counsel', name: '상담실' },
      { id: 'mess', name: '식당' },
      { id: 'workshop', name: '정비실' },
      { id: 'library', name: '도서실' },
      { id: 'greenhouse', name: '온실' },
      { id: 'dorm', name: '기숙사' },
      { id: 'office', name: '행정실' },
    ],
    methods: [
      { id: 'hands', label: '손으로 하는 일', stat: 'craft' },
      { id: 'people', label: '사람을 대하는 일', stat: 'emp' },
      { id: 'papers', label: '서류와 기록', stat: 'edu' },
    ],
  },
  outing: {
    kind: 'outing',
    targetLegend: '갈 곳',
    targets: [
      { id: 'market', name: '헤일렌 시장' },
      { id: 'riverside', name: '가람터 강변' },
      { id: 'saebyeok', name: '새벽뜰 가는 길' },
    ],
    methods: [
      { id: 'walk', label: '먼 길을 걷는다', stat: 'con' },
      { id: 'meet', label: '사람을 만난다', stat: 'emp' },
      { id: 'look', label: '둘러보며 간다', stat: 'int' },
    ],
  },
};

// 처음에는 모든 종류를 켜 두고, 밤 시간에는 보내지 않는다 (docs/tech.md 알림).
const defaultNotify = (): NotificationSettings => ({ kinds: { send: true, talk: true, relation: true, care: true }, quietNight: true });

function mine() {
  // 칸이 생기기 전에 저장된 테스트 캐릭터에도 빈 값을 채운다.
  return store.characters.filter((c) => c.ownerId === store.session?.accountId).map((c) => (c.preRecord ? c : Object.assign(c, { preRecord: {} })));
}

export const mockService: Omit<GameService, TalkKeys | DossierKeys | DayKeys> = {
  async getSession() {
    return wait(store.session, 60);
  },
  async signIn(email, password) {
    const a = store.accounts.find((x) => x.email === email.trim().toLowerCase() && x.password === password);
    // 어느 쪽이 틀렸는지 말하지 않는다 (계정이 있는지 알려 주지 않으려고).
    if (!a) return wait({ ok: false, message: '이메일이나 비밀번호가 맞지 않아요.' });
    store.session = { accountId: a.id, email: a.email };
    save();
    return wait({ ok: true, value: store.session });
  },
  async signOut() {
    store.session = null;
    save();
  },
  async checkInviteCode(code) {
    const n = normalizeCode(code);
    return wait(n.length === 8 && !store.usedCodes.includes(n), 200);
  },
  async signUp({ inviteCode, email, password }) {
    const n = normalizeCode(inviteCode);
    if (n.length !== 8 || store.usedCodes.includes(n)) return wait({ ok: false, field: 'code', message: '쓸 수 없는 코드예요. 받은 코드를 다시 확인해 주세요.' });
    const e = email.trim().toLowerCase();
    if (store.accounts.some((a) => a.email === e)) return wait({ ok: false, field: 'email', message: '이미 가입한 이메일이에요. 로그인해 주세요.' });
    if (password.length < TEXT_LIMITS.passwordMin) return wait({ ok: false, field: 'password', message: `${TEXT_LIMITS.passwordMin}자 이상 적어 주세요.` });
    const id = uid();
    store.accounts.push({ id, email: e, password });
    store.usedCodes.push(n);
    store.session = { accountId: id, email: e };
    save();
    return wait({ ok: true, value: store.session });
  },

  async listMyCharacters() {
    return wait(mine());
  },
  async getCharacter(id) {
    return wait(mine().find((c) => c.id === id) ?? null, 120);
  },
  async listSettlements() {
    return wait(SETTLEMENTS, 120);
  },
  async loadDraft() {
    return wait(store.draft, 120);
  },
  async saveDraft(draft) {
    const at = new Date().toISOString();
    store.draft = { ...draft, savedAt: at };
    save();
    return wait(at, 150);
  },
  async registerCharacter(d): Promise<Result<Character>> {
    if (!store.session) return wait({ ok: false, message: '다시 로그인해 주세요.' });
    if (mine().length >= BALANCE.maxCharactersPerAccount)
      return wait({ ok: false, message: `한 계정에 캐릭터는 ${BALANCE.maxCharactersPerAccount}명까지예요.` });
    if (!d.role) return wait({ ok: false, field: 'role', message: '역할을 골라 주세요.' });
    if (!d.name.trim()) return wait({ ok: false, field: 'name', message: '이름을 적어 주세요.' });
    if (d.role === 'ability' && !d.memoryLoss) return wait({ ok: false, field: 'memoryLoss', message: '기억상실 정도를 골라 주세요.' });
    const total = STAT_ORDER.reduce((s, k) => s + d.stats[k], 0);
    const over = STAT_ORDER.some((k) => d.stats[k] < BALANCE.statBase || d.stats[k] > BALANCE.statCapAtCreation);
    if (total !== BALANCE.statBase * STAT_ORDER.length + BALANCE.statPool || over)
      return wait({ ok: false, field: 'stats', message: '능력치를 다시 나눠 주세요.' });
    const pre = d.role === 'ability' ? keepOpen(d.preRecord, d.memoryLoss) : {};
    if (Object.values(pre).some((v) => (v ?? '').length > TEXT_LIMITS.preRecordItem))
      return wait({ ok: false, field: 'text', message: `발현 이전 기록은 항목마다 ${TEXT_LIMITS.preRecordItem}자까지예요.` });
    const fields = [d.name, d.look, d.personality, d.past, d.ability, ...Object.values(pre).map((v) => v ?? '')];
    // 어떤 말이 걸렸는지는 알려 주지 않는다 (금칙어 목록을 짐작하지 못하게).
    if (fields.some((f) => CONTACT_PATTERN.test(f))) return wait({ ok: false, field: 'text', message: '설정 글에 쓸 수 없는 내용이 있어요. 연락처나 주소는 적을 수 없어요.' });

    const regNo = d.role === 'ability' ? `A-${String(store.nextRegNo++).padStart(4, '0')}` : null;
    const portrait = d.images[0];
    const c: StoredChar = {
      id: uid(),
      ownerId: store.session.accountId,
      role: d.role,
      name: d.name.trim(),
      registrationNo: regNo,
      memoryLoss: d.role === 'ability' ? d.memoryLoss : null,
      preRecord: pre,
      originSettlement: SETTLEMENTS.find((s) => s.id === d.originSettlementId) ?? null,
      stats: d.stats,
      past: d.past,
      look: d.look,
      personality: d.personality,
      ability: d.role === 'ability' ? d.ability : '',
      portraitUrl: portrait?.url ?? null,
      portraitAlt: portrait?.alt || `${d.name.trim()}의 그림`,
      createdAt: new Date().toISOString(),
    };
    store.characters.push(c);
    store.draft = null;
    save();
    return wait({ ok: true, value: c }, 500);
  },

  async getQnaPrompt() {
    // 설정집 "이벤트 스크립트" 6절 문답의 "캐릭터를 만든 직후" 질문. 진짜는 qna_prompts 시드에서 온다.
    return wait({ id: 'created', text: '오늘 아침, 가장 먼저 떠오른 것은?' }, 120);
  },
  async answerQna(_c, _p, text) {
    if (text.length > TEXT_LIMITS.qnaAnswer) return wait({ ok: false, message: `${TEXT_LIMITS.qnaAnswer}자까지 적을 수 있어요.` });
    if (CONTACT_PATTERN.test(text)) return wait({ ok: false, message: '연락처나 주소는 적을 수 없어요.' });
    return wait({ ok: true, value: undefined });
  },

  async getSend(id) {
    return wait(store.sends.find((s) => s.id === id) ?? null, 120);
  },
  async savePushSubscription() {
    // 진짜 구현은 구독 정보를 push_subscriptions에 저장하고, Edge Function이 보낸다.
    return wait({ ok: true, value: undefined });
  },

  async getNotificationSettings() {
    return wait(store.notify ?? defaultNotify(), 120);
  },
  async saveNotificationSettings(next) {
    if (!store.session) return wait({ ok: false, message: '다시 로그인해 주세요.' });
    store.notify = next;
    save();
    return wait({ ok: true, value: next }, 200);
  },
  async getBusiestPlace(): Promise<Place | null> {
    return wait({ id: 'lounge', name: '재단 기숙사 휴게실', staying: 4 }, 120);
  },
};

// 대화 가짜 서비스(mockTalk)가 내 캐릭터와 보낸 일을 읽으려고 쓴다.
export const mockStore = {
  mine: () => mine(),
  sends: () => store.sends,
  save: () => save(),
  wait,
  uid,
  contactPattern: CONTACT_PATTERN,
};
