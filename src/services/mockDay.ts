// 하루 한 바퀴의 가짜 서버: 보내두기 정산, 판정, 갈림길, 오염, 휴식.
// 진짜 서버에서는 이 계산이 전부 Postgres 함수와 예약 작업(틱)에서 일어난다. 화면은 결과만 받는다.
import { BALANCE, DAY } from '../config/balance';
import { openDate } from '../config/worldConfig';
import { josa } from '../lib/josa';
import {
  GRADE_LABEL,
  ROLE_LABEL,
  isSuccess,
  sendKindOf,
  statLabel,
  type ActiveSend,
  type ChoiceLine,
  type Condition,
  type Fork,
  type ForkOutcome,
  type Grade,
  type Persona,
  type RestKind,
  type RestOption,
  type Roll,
  type SendResult,
  type StatKey,
} from '../types/domain';
import { SEND_TABLE, mockStore, type StoredChar } from './mock';
import { mockOthers } from './mockTalk';
import { CRIT_LINES, DISPATCH_LINES, FORKS, ITEMS, type ForkSeed, type OptionSeed } from './seed/forks';
import type { DayKeys, GameService } from './types';

const { wait, uid } = mockStore;

// ── 저장 ──

interface CondState {
  value: number;
  at: string;
  overloadUntil: string | null;
  /** 한국 날짜(YYYY-MM-DD)마다 그날의 마지막 값. */
  history: Record<string, number>;
}

interface RunState {
  methodId: string | null;
  stat: StatKey | null;
  targetId: string;
  restKind?: RestKind;
  forkCode?: string;
  forkAt?: string;
  forkMet?: Persona[];
  forkChoice?: ForkOutcome;
  /** 고른 선택지의 오염·물품 효과 (정산 때 더한다). */
  forkEffect?: { contamination: number; item: string | null; lostBonus: boolean };
  result?: SendResult;
  seen?: boolean;
  /** 보낼 때의 보상·회복 값. 운영자가 나중에 바꿔도 이 보내두기는 이 값으로 정산한다. */
  rates?: Rates;
}

type Rates = Pick<
  typeof DAY,
  'contribution' | 'boostContribution' | 'dispatchContamination' | 'struggleExtra' | 'boostContamination' | 'steadyRelief' | 'pushContamination' | 'facilityProgress' | 'mapCells' | 'commonItems' | 'restRelief' | 'togetherBonus'
>;
const RATE_KEYS = ['contribution', 'boostContribution', 'dispatchContamination', 'struggleExtra', 'boostContamination', 'steadyRelief', 'pushContamination', 'facilityProgress', 'mapCells', 'commonItems', 'restRelief', 'togetherBonus'] as const;
const snapshotRates = (): Rates => JSON.parse(JSON.stringify(Object.fromEntries(RATE_KEYS.map((k) => [k, DAY[k]])))) as Rates;

interface DayStore {
  cond: Record<string, CondState>;
  runs: Record<string, RunState>;
  seenForks: Record<string, string[]>;
  choices: Record<string, ChoiceLine[]>;
  growth: Record<string, StatKey[]>;
  nextRoll: number | null;
}

const KEY = 'webgame.mock.day.v1';
const emptyDay = (): DayStore => ({ cond: {}, runs: {}, seenForks: {}, choices: {}, growth: {}, nextRoll: null });
function loadDay(): DayStore {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...emptyDay(), ...(JSON.parse(raw) as Partial<DayStore>) };
  } catch {
    // 저장소를 못 쓰면 새로 시작한다.
  }
  return emptyDay();
}
const day = loadDay();
function saveDay() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(day));
  } catch {
    // 이번 창에서는 계속 쓸 수 있다.
  }
}

// ── 시간과 주사위 ──

const H = 3600_000;
const now = () => Date.now();
const iso = (t: number) => new Date(t).toISOString();
const kstDate = (t: number) => new Date(t + 9 * H).toISOString().slice(0, 10);

function d100(): number {
  if (day.nextRoll !== null) {
    const v = day.nextRoll;
    day.nextRoll = null;
    return v;
  }
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return ((a[0] ?? 0) % 100) + 1;
}
const pickOne = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)] as T;

function gradeOf(value: number, target: number): Grade {
  if (value <= DAY.critMax) return 'crit';
  if (value >= DAY.fumbleMin) return 'fumble';
  if (value <= Math.floor(target / 5)) return 'extreme';
  if (value <= Math.floor(target / 2)) return 'hard';
  if (value <= target) return 'success';
  return 'fail';
}

function roll(c: StoredChar, stat: StatKey): Roll {
  const penalty = penaltyOf(c);
  const target = Math.max(1, c.stats[stat] - penalty);
  const value = d100();
  const grade = gradeOf(value, target);
  // 판정에 성공한 능력치에는 성장 표시가 붙는다 (능력치마다 한 번). 성장 굴림은 하루 한 번 서버 틱이 한다.
  if (isSuccess(grade)) {
    const marks = (day.growth[c.id] ??= []);
    if (!marks.includes(stat)) marks.push(stat);
  }
  return { stat, statLabel: statLabel(stat, c.role), target, penalty, value, grade };
}

// ── 오염 ──

function cond(c: StoredChar): CondState {
  const s = (day.cond[c.id] ??= { value: 0, at: iso(now()), overloadUntil: null, history: {} });
  // 시간이 지나면 저절로 조금씩 줄어든다.
  const hours = (now() - new Date(s.at).getTime()) / H;
  if (hours > 0) {
    s.value = Math.max(0, Math.round(s.value - hours * DAY.naturalDecayPerHour));
    s.at = iso(now());
  }
  if (s.overloadUntil && new Date(s.overloadUntil).getTime() <= now()) s.overloadUntil = null;
  s.history[kstDate(now())] = s.value;
  return s;
}

function setContamination(c: StoredChar, value: number) {
  const s = cond(c);
  s.value = Math.max(0, Math.min(DAY.overloadAt, Math.round(value)));
  if (s.value >= DAY.overloadAt) s.overloadUntil = iso(now() + DAY.overloadHours * H);
  else if (s.value < DAY.overloadClearBelow) s.overloadUntil = null;
  s.history[kstDate(now())] = s.value;
}

function penaltyOf(c: StoredChar) {
  if (c.role !== 'ability') return 0;
  return cond(c).value >= DAY.cautionAt ? DAY.cautionPenalty : 0;
}

function conditionOf(c: StoredChar): Condition {
  if (c.role !== 'ability') return { characterId: c.id, contamination: null, level: 'calm', penalty: 0, overloadUntil: null, week: null };
  const s = cond(c);
  const week: number[] = [];
  let last = 0;
  for (let i = 6; i >= 0; i--) {
    const k = kstDate(now() - i * 24 * H);
    if (s.history[k] !== undefined) last = s.history[k];
    week.push(last);
  }
  return {
    characterId: c.id,
    contamination: s.value,
    level: s.overloadUntil ? 'overload' : s.value >= DAY.cautionAt ? 'caution' : 'calm',
    penalty: penaltyOf(c),
    overloadUntil: s.overloadUntil,
    week,
  };
}

// ── 장소와 만난 사람 ──

const ZONE_THREAT: Record<string, keyof typeof DISPATCH_LINES> = { 'E-07': 'mutant', 'T-02': 'armed', 'E-11': 'zombie' };
// 같은 곳에 머무는 다른 계정 캐릭터 (말 걸기 계기). 테스트용 배치.
const PRESENT: Record<string, string[]> = {
  'E-07': ['oA'],
  'E-11': ['oD'],
  'T-02': [],
  mess: ['oB'],
  clinic: ['oF'],
  lounge: ['oA', 'oB', 'oC', 'oD'],
  saebyeok: ['oE', 'oF'],
  market: ['oC'],
};
const presentAt = (place: string) => (PRESENT[place] ?? []).map((id) => mockOthers.find((o) => o.id === id)).filter((p): p is Persona => !!p);

// ── 갈림길 ──

/** 오늘(한국 시간)이 그 계절 갈림길의 기간 안인가. */
function inSeason(season: NonNullable<ForkSeed['season']>, t = now()) {
  const d = new Date(t + 9 * H);
  const y = d.getUTCFullYear();
  const within = (m: number, day: number, days: number) =>
    [y - 1, y].some((yy) => {
      const start = Date.UTC(yy, m - 1, day);
      return d.getTime() >= start && d.getTime() < start + days * 24 * H;
    });
  if (season === 'snow') return within(DAY.seasons.snow.month, DAY.seasons.snow.day, DAY.seasons.snow.days);
  if (season === 'rain') return within(DAY.seasons.rain.month, DAY.seasons.rain.day, DAY.seasons.rain.days);
  const open = openDate();
  if (!open) return false;
  const [, m, day] = open.split('-').map(Number);
  return within(m ?? 1, day ?? 1, DAY.seasons.truceDays);
}

function forksFor(c: StoredChar) {
  const fit = FORKS.filter(
    (f) => (f.roles === 'all' || f.roles.includes(c.role)) && (!f.requires || !!c.originSettlement) && (!f.season || inSeason(f.season)),
  );
  // 계절 갈림길은 그 기간 안에서 먼저 나온다.
  const seasonal = fit.filter((f) => f.season);
  return { all: fit, seasonal };
}

function assignFork(c: StoredChar, run: RunState) {
  const { all: pool, seasonal } = forksFor(c);
  let seen = day.seenForks[c.id] ?? [];
  const freshSeason = seasonal.filter((x) => !seen.includes(x.code));
  // 그 역할의 갈림길을 모두 본 뒤에야 다시 돌린다 (계절 갈림길은 돌리지 않는다).
  if (!freshSeason.length && pool.filter((x) => !x.season).every((f) => seen.includes(f.code))) seen = seen.filter((code) => FORKS.find((x) => x.code === code)?.season);
  const f = freshSeason.length ? pickOne(freshSeason) : pickOne(pool.filter((x) => !x.season && !seen.includes(x.code)));
  day.seenForks[c.id] = [...seen, f.code];
  run.forkCode = f.code;
  const slot = f.who;
  if (slot) {
    const there = presentAt(run.targetId).filter((p) => slot.role === null || p.role === slot.role);
    run.forkMet = there.length ? [pickOne(there)] : [];
  } else run.forkMet = [];
}

/** {동료} 같은 자리를 실제 캐릭터 이름(없으면 이름 없는 사람)으로 채우고, 뒤의 조사를 받침에 맞춘다. */
function fill(text: string, map: Record<string, string>) {
  return text.replace(/\{[^}]+\}(이|가|을|를|은|는|와|과|으로|로|의)?/g, (m, particle?: string) => {
    const key = particle ? m.slice(0, -particle.length) : m;
    const name = map[key];
    if (name === undefined) return m;
    if (!particle || particle === '의') return name + (particle ?? '');
    const pair = ({ 이: '이/가', 가: '이/가', 을: '을/를', 를: '을/를', 은: '은/는', 는: '은/는', 와: '와/과', 과: '와/과', 으로: '으로/로', 로: '으로/로' } as const)[
      particle as '이'
    ];
    return josa(name, pair);
  });
}

function forkMap(f: ForkSeed, run: RunState, c: StoredChar, place: string) {
  const met = run.forkMet?.[0];
  const origin = c.originSettlement?.name;
  const map: Record<string, string> = {
    '{캐릭터}': c.name,
    '{구역}': place,
    // 정착지가 정해지지 않은 자리는 테스트용으로 새벽뜰을 쓴다 (진짜는 그 캐릭터가 머무는 정착지).
    '{정착지}': origin ?? '새벽뜰',
    '{출신 정착지}': origin ?? '새벽뜰',
    '{등록번호}': c.registrationNo ?? '번호 없음',
  };
  if (f.who) map[f.who.slot] = met?.name ?? f.who.npc;
  return map;
}

function outcomeOf(c: StoredChar, o: OptionSeed, auto: boolean, map: Record<string, string>): { out: ForkOutcome; effect: RunState['forkEffect'] } {
  // 자동 처리는 판정하지 않고, 선택 기록에도 남기지 않는다.
  // 둘 중 높은 쪽으로 판정하는 선택지가 있다 (예: 전문 또는 지능).
  const stat = o.stat && o.statAlt && c.stats[o.statAlt] > c.stats[o.stat] ? o.statAlt : o.stat;
  const r = !auto && stat ? roll(c, stat) : null;
  const ok = !r || isSuccess(r.grade);
  const great = !!r && (r.grade === 'extreme' || r.grade === 'crit');
  let text = ok ? o.result : (o.fail ?? `${o.result} 생각보다 오래 걸렸다.`);
  if (great && o.extreme) text += ` 극단적 성공: ${o.extreme}.`.replace('..', '.');
  const record = auto ? null : ok ? (o.record ?? null) : o.failRecord !== undefined ? o.failRecord : (o.record ?? null);
  const paper = auto ? null : ok ? (o.paper ?? null) : o.failPaper !== undefined ? o.failPaper : (o.paper ?? null);
  let contamination = (o.contamination ?? 0) + (ok ? 0 : (o.failContamination ?? 0));
  if (great && contamination > 0 && /오염/.test(o.extreme ?? '')) contamination = 0;
  // 오염은 능력자에게만 쌓인다. 다른 역할은 오염 대신 덤 하나를 포기하고, 문구도 바뀐다.
  const lostBonus = c.role !== 'ability' && contamination > 0;
  if (lostBonus) text = text.replace(/오염[이도]? (그만큼 |조금 )?더 쌓였다\./, '몸이 무겁다.');
  const item = great && o.extremeItem ? o.extremeItem : ok ? (o.item ?? null) : null;
  return {
    out: {
      optionId: o.id,
      optionLabel: o.label,
      auto,
      roll: r,
      text: fill(text, map),
      record: record ? fill(record, map) : null,
      paper,
    },
    effect: { contamination: c.role === 'ability' ? contamination : 0, item, lostBonus },
  };
}

function seedOf(code: string | undefined) {
  return FORKS.find((f) => f.code === code);
}

// ── 정산 ──

function mine() {
  return mockStore.mine();
}
function charOf(id: string) {
  return mine().find((c) => c.id === id);
}
function ended(s: ActiveSend) {
  return new Date(s.endsAt).getTime() <= now();
}

function placeName(s: ActiveSend) {
  return s.targetName;
}

/** 끝난 보내두기를 정산한다. 진짜 서버에서는 예약 작업이 끝나는 시각에 한다 (접속과 상관없이). */
function settleDue() {
  let changed = false;
  for (const s of mockStore.sends()) {
    const run = day.runs[s.id];
    if (!run || run.result || !ended(s)) continue;
    const c = charOf(s.characterId);
    if (!c) continue;
    settle(c, s, run);
    changed = true;
  }
  if (changed) saveDay();
}

function settle(c: StoredChar, s: ActiveSend, run: RunState, pushedFrom?: Roll) {
  const f = seedOf(run.forkCode);
  const forkArrived = f && run.forkAt && new Date(run.forkAt).getTime() <= new Date(s.endsAt).getTime();
  // 끝날 때까지 고르지 않은 갈림길은 자동 선택지로 처리된다.
  if (f && forkArrived && !run.forkChoice) {
    const auto = f.options.find((o) => o.auto) ?? f.options[0];
    if (auto) {
      const { out, effect } = outcomeOf(c, auto, true, forkMap(f, run, c, placeName(s)));
      run.forkChoice = out;
      run.forkEffect = effect;
    }
  }
  const before = c.role === 'ability' ? cond(c).value : null;
  const result = s.kind === 'rest' ? settleRest(c, s, run) : settleWork(c, s, run, pushedFrom);
  if (before !== null) result.contamination = { before: pushedFrom && run.result?.contamination ? run.result.contamination.before : before, after: cond(c).value };
  if (f && run.forkChoice) result.fork = { ...run.forkChoice, title: `${f.code} ${f.title}` };
  run.result = result;
}

function baseResult(c: StoredChar, s: ActiveSend): SendResult {
  return {
    sendId: s.id,
    characterId: c.id,
    characterName: c.name,
    role: c.role,
    kind: s.kind,
    targetName: s.targetName,
    methodLabel: s.methodLabel,
    hours: s.hours,
    endedAt: s.endsAt,
    roll: null,
    firstRoll: null,
    push: null,
    outcome: null,
    lines: [],
    quip: null,
    gains: [],
    items: [],
    contamination: null,
    growth: null,
    fork: null,
    met: [],
  };
}

function addItem(items: SendResult['items'], name: string, n = 1) {
  const it = items.find((x) => x.name === name);
  if (it) it.count += n;
  else items.push({ name, count: n });
}

function settleWork(c: StoredChar, s: ActiveSend, run: RunState, pushedFrom?: Roll): SendResult {
  const r = baseResult(c, s);
  const kind = s.kind === 'rest' ? 'dispatch' : s.kind;
  const stat: StatKey = s.boost ? 'craft' : (run.stat ?? 'str');
  const rl = roll(c, stat);
  r.roll = rl;
  r.firstRoll = pushedFrom ?? null;
  const ok = isSuccess(rl.grade);
  // 밀어붙이기로 성공해도 재단 직원과 무소속은 덤을 포기한다 (능력자는 오염으로 대신 치렀다).
  const bonus = ok && !(pushedFrom && c.role !== 'ability') && !run.forkEffect?.lostBonus;
  const h = s.hours;
  const R = run.rates ?? snapshotRates();
  const map = { '{캐릭터}': c.name, '{구역}': s.targetName };
  const effect = run.forkEffect;

  if (kind === 'dispatch') {
    const threat = ZONE_THREAT[run.targetId] ?? 'zombie';
    r.outcome = ok ? '순조' : '고전';
    const line = rl.grade === 'crit' ? CRIT_LINES.dispatch.crit : rl.grade === 'fumble' ? CRIT_LINES.dispatch.fumble : ok ? pickOne(DISPATCH_LINES[threat].smooth) : DISPATCH_LINES[threat].struggle;
    r.lines.push(fill(line, map));
    let pct = (R.contribution[h] ?? 1) - (ok ? 0 : 1);
    if (bonus && run.methodId === 'front') pct += 1;
    if (ok && s.boost) pct += R.boostContribution;
    r.gains.push({ label: '정화 기여', value: `${s.targetName} +${Math.max(1, pct)}%` });
    if (bonus && run.methodId === 'around') r.gains.push({ label: '흔적', value: '안전한 길 표식 +1' });
    let add = (R.dispatchContamination[h] ?? 8) + (ok ? 0 : R.struggleExtra) + (s.boost ? R.boostContamination : 0);
    if (bonus && run.methodId === 'steady') add -= R.steadyRelief;
    add += effect?.contamination ?? 0;
    if (pushedFrom) add += R.pushContamination;
    setContamination(c, cond(c).value + Math.max(0, add));
    if (cond(c).value >= DAY.overloadAt) r.lines.push('오염이 한계에 닿았다. 쉬고 나면 다시 나갈 수 있다.');
    else if (cond(c).value >= DAY.cautionAt) r.lines.push('오염이 높아 몸이 무겁다. 쉬고 나면 괜찮아질 것이다.');
  } else if (kind === 'shift') {
    const line = rl.grade === 'crit' ? CRIT_LINES.shift.crit : rl.grade === 'fumble' ? CRIT_LINES.shift.fumble : ok ? `${s.targetName} 근무를 마쳤다.` : `${s.targetName} 근무를 마쳤다. 생각보다 오래 걸렸다.`;
    r.lines.push(line);
    let p = R.facilityProgress[h] ?? 2;
    if (bonus && run.methodId === 'hands') p += 2;
    r.gains.push({ label: '복구 진행', value: `${s.targetName} +${p}` });
    if (bonus && run.methodId === 'papers') addItem(r.items, pickOne(ITEMS.shift.common));
  } else {
    r.lines.push(
      rl.grade === 'crit' ? CRIT_LINES.outing.crit : rl.grade === 'fumble' ? CRIT_LINES.outing.fumble : ok ? `${s.targetName}에 다녀왔다.` : `${s.targetName}에 다녀왔다. 생각보다 오래 걸렸다.`,
    );
    let cells = R.mapCells[h] ?? 1;
    if (bonus && run.methodId === 'walk') cells += 1;
    r.gains.push({ label: '여행 지도', value: `칸 +${cells}` });
    if (bonus && run.methodId === 'meet') r.gains.push({ label: '정착지 이야기 조각', value: '+1' });
    if (bonus && run.methodId === 'look') addItem(r.items, pickOne(ITEMS.outing.common));
  }
  if (rl.grade === 'extreme') r.lines.push('생각보다 훨씬 수월했다.');

  // 물품: 개수는 시간으로 정해지고, 어떤 것이 나올지만 분류 안에서 섞인다.
  const table = ITEMS[kind];
  for (let i = 0; i < (R.commonItems[h] ?? 1); i++) addItem(r.items, pickOne(table.common));
  if (h >= 8) addItem(r.items, pickOne(table.rare));
  if (rl.grade === 'crit') {
    addItem(r.items, pickOne(table.rare));
    r.quip = '덤이 하나 더 붙었어요.';
  }
  if (rl.grade === 'fumble') r.quip = '잃은 것은 없어요.';
  if (effect?.item) addItem(r.items, effect.item);

  r.growth = ok ? { stat, label: statLabel(stat, c.role) } : null;
  if (!ok && !pushedFrom) r.push = { cost: c.role === 'ability' ? `오염 +${R.pushContamination}` : '성공해도 방식의 덤은 받지 않아요' };

  const met = new Map<string, Persona>();
  for (const p of presentAt(run.targetId)) met.set(p.id, p);
  for (const p of run.forkMet ?? []) met.set(p.id, p);
  r.met = [...met.values()];
  return r;
}

const REST_DEF: Record<RestKind, { label: string; place: string; placeId: string; desc: string; request: boolean }> = {
  alone: { label: '혼자 쉬기', place: '숙소', placeId: 'dorm', desc: '언제든 할 수 있는 기본 휴식이에요.', request: false },
  together: { label: '함께 쉬기', place: '재단 기숙사 휴게실', placeId: 'lounge', desc: '같은 시간에 다른 사람이 머물면 조금 더 줄어요. 휴게실 채널에 "머무는 중"으로 보여요.', request: false },
  counsel: { label: '상담 요청', place: '상담실', placeId: 'counsel', desc: '재단 상담사에게 요청을 남겨요. 받아 주면 더 줄고, 기억의 감정 흔적이 떠오를 수 있어요.', request: true },
  treat: { label: '치료 요청', place: '의료동', placeId: 'clinic', desc: '재단 의료진에게 요청을 남겨요. 폭주에서 더 빨리 돌아와요.', request: true },
  settlement: { label: '정착지에서 쉬기', place: '새벽뜰', placeId: 'saebyeok', desc: '정착지 모닥불 곁에서 쉬어요. 그곳 사람들과 마주쳐요.', request: false },
};

function reliefOf(kind: RestKind, hours: number, R: Pick<Rates, 'restRelief' | 'togetherBonus'> = DAY) {
  const base = R.restRelief[hours] ?? 10;
  const together = kind === 'together' && presentAt('lounge').length > 0;
  return Math.round(base * (together ? 1 + R.togetherBonus : 1));
}

function settleRest(c: StoredChar, s: ActiveSend, run: RunState): SendResult {
  const r = baseResult(c, s);
  const kind = run.restKind ?? 'alone';
  const def = REST_DEF[kind];
  const relief = reliefOf(kind, s.hours, run.rates);
  const before = cond(c).value;
  setContamination(c, before - relief);
  const after = cond(c).value;
  r.lines.push(`${def.place}에서 ${s.hours}시간 쉬었다. 오염이 ${before - after} 줄었다.`);
  if (def.request) r.lines.push(`${def.label}은 아직 받은 사람이 없어요. 재단 직원이 받으면 오염이 더 줄고 알림이 와요.`);
  if (before >= DAY.overloadAt && !cond(c).overloadUntil) r.lines.push('폭주에서 돌아왔다. 다시 출동할 수 있다.');
  r.gains.push({ label: '오염', value: `-${before - after}` });
  r.met = presentAt(def.placeId);
  return r;
}

// ── 보내두기 옵션 ──

function blockedOf(c: StoredChar): string | null {
  const running = mockStore.sends().find((s) => s.characterId === c.id && !ended(s));
  if (running) return `${josa(c.name, '은/는')} 이미 보내 둔 일이 있어요. ${running.targetName}에서 돌아오면 다시 보낼 수 있어요.`;
  return null;
}

function decorate(s: ActiveSend): ActiveSend {
  const run = day.runs[s.id];
  const forkWaiting = !!run?.forkAt && !run.forkChoice && !ended(s) && new Date(run.forkAt).getTime() <= now();
  return { ...s, forkWaiting, unseen: ended(s) && !!run?.result && !run.seen };
}

// ── 서비스 ──

export const mockDay: Pick<GameService, DayKeys> = {
  async getSendOptions(characterId) {
    settleDue();
    const c = charOf(characterId);
    const kind = sendKindOf(c?.role ?? 'ability');
    const ability = c?.role === 'ability';
    let blocked = c ? blockedOf(c) : '캐릭터를 찾지 못했어요.';
    const st = c && ability ? cond(c) : null;
    if (!blocked && st?.overloadUntil)
      blocked = `폭주 중이라 출동할 수 없어요. 쉬어서 오염이 ${DAY.overloadClearBelow} 아래로 내려가면 바로 돌아와요.`;
    return wait({
      ...SEND_TABLE[kind],
      hours: BALANCE.sendHours,
      boost: ability ? { extraContamination: DAY.boostContamination } : null,
      blocked,
      penalty: c ? penaltyOf(c) : 0,
    });
  },

  async startSend(req) {
    settleDue();
    const c = charOf(req.characterId);
    if (!c) return wait({ ok: false, message: '캐릭터를 찾지 못했어요.' });
    const t = SEND_TABLE[sendKindOf(c.role)];
    const target = t.targets.find((x) => x.id === req.targetId);
    const method = t.methods.find((x) => x.id === req.methodId);
    if (!target || !method || !(BALANCE.sendHours as readonly number[]).includes(req.hours)) return wait({ ok: false, message: '고른 내용을 다시 확인해 주세요.' });
    const blocked = blockedOf(c);
    if (blocked) return wait({ ok: false, message: blocked });
    if (c.role === 'ability' && cond(c).overloadUntil) return wait({ ok: false, message: '폭주 중이라 출동할 수 없어요. 먼저 쉬어 주세요.' });
    const boost = c.role === 'ability' && !!req.boost;
    const start = now();
    const s: ActiveSend = {
      id: uid(),
      characterId: c.id,
      characterName: c.name,
      kind: t.kind,
      hours: req.hours,
      targetName: target.name,
      methodLabel: boost ? `${method.label} · 능력을 아끼지 않음` : method.label,
      startedAt: iso(start),
      endsAt: iso(start + req.hours * H),
      boost,
    };
    const run: RunState = { methodId: method.id, stat: method.stat, targetId: target.id, rates: snapshotRates() };
    if (Math.random() < (DAY.forkChance[req.hours] ?? 0)) {
      assignFork(c, run);
      // 도중 어느 때에 온다 (처음과 끝 언저리는 피한다).
      run.forkAt = iso(start + req.hours * H * (0.2 + Math.random() * 0.6));
    }
    day.runs[s.id] = run;
    mockStore.sends().push(s);
    mockStore.save();
    saveDay();
    return wait({ ok: true, value: s }, 400);
  },

  async listMySends() {
    settleDue();
    const ids = new Set(mine().map((c) => c.id));
    return wait(mockStore.sends().filter((x) => ids.has(x.characterId)).map(decorate), 120);
  },

  async listConditions() {
    settleDue();
    const out = mine().map(conditionOf);
    saveDay();
    return wait(out, 120);
  },

  async getCondition(characterId) {
    settleDue();
    const c = charOf(characterId);
    const out = c ? conditionOf(c) : null;
    saveDay();
    return wait(out, 120);
  },

  async getFork(sendId) {
    settleDue();
    const s = mockStore.sends().find((x) => x.id === sendId);
    const run = day.runs[sendId];
    const f = seedOf(run?.forkCode);
    const c = s && charOf(s.characterId);
    if (!s || !run || !f || !c || !run.forkAt || new Date(run.forkAt).getTime() > now()) return wait(null, 120);
    const map = forkMap(f, run, c, s.targetName);
    const penalty = penaltyOf(c);
    const fork: Fork = {
      sendId,
      code: f.code,
      title: f.title,
      situation: fill(f.situation, map),
      gov: !!f.gov,
      options: f.options.map((o) => ({
        id: o.id,
        label: fill(o.label, map),
        stat: o.stat ?? null,
        statLabel: o.stat ? statLabel(o.stat, c.role) : null,
        target: o.stat ? Math.max(1, c.stats[o.stat] - penalty) : null,
        auto: !!o.auto,
      })),
      deadline: s.endsAt,
      chosen: run.forkChoice ?? null,
      met: run.forkMet ?? [],
    };
    return wait(fork, 160);
  },

  async chooseFork(sendId, optionId) {
    settleDue();
    const s = mockStore.sends().find((x) => x.id === sendId);
    const run = day.runs[sendId];
    const f = seedOf(run?.forkCode);
    const c = s && charOf(s.characterId);
    if (!s || !run || !f || !c) return wait({ ok: false, message: '갈림길을 찾지 못했어요.' });
    if (run.forkChoice) return wait({ ok: false, message: '이미 고른 갈림길이에요.' });
    if (ended(s)) return wait({ ok: false, message: '보내 둔 일이 이미 끝나서 자동으로 처리됐어요.' });
    const o = f.options.find((x) => x.id === optionId);
    if (!o) return wait({ ok: false, message: '선택지를 다시 골라 주세요.' });
    const { out, effect } = outcomeOf(c, o, false, forkMap(f, run, c, s.targetName));
    run.forkChoice = out;
    run.forkEffect = effect;
    if (out.record) {
      const list = (day.choices[c.id] ??= []);
      list.unshift({ id: uid(), date: iso(now()), text: out.record, gov: !!f.gov, hidden: false });
    }
    saveDay();
    return wait({ ok: true, value: out }, 300);
  },

  async getSendResult(sendId) {
    settleDue();
    const run = day.runs[sendId];
    const s = mockStore.sends().find((x) => x.id === sendId);
    if (!s || !run) return wait({ ok: false, message: '보내 둔 일을 찾지 못했어요.' });
    if (!run.result) return wait({ ok: false, message: '아직 끝나지 않았어요.' });
    run.seen = true;
    saveDay();
    return wait({ ok: true, value: run.result }, 200);
  },

  async pushSend(sendId) {
    settleDue();
    const run = day.runs[sendId];
    const s = mockStore.sends().find((x) => x.id === sendId);
    const c = s && charOf(s.characterId);
    if (!s || !run?.result || !c) return wait({ ok: false, message: '결과를 찾지 못했어요.' });
    const prev = run.result;
    if (!prev.push || !prev.roll) return wait({ ok: false, message: '이 판정은 다시 굴릴 수 없어요.' });
    // 첫 정산의 오염과 성장 표시를 되돌리지는 않는다: 밀어붙이기는 그 위에 한 번 더 굴리는 것이다.
    if (c.role === 'ability' && prev.contamination) setContamination(c, prev.contamination.before);
    settle(c, s, run, prev.roll);
    if (run.result) run.result.push = null;
    saveDay();
    return wait({ ok: true, value: run.result as SendResult }, 300);
  },

  async getRestOptions(characterId) {
    settleDue();
    const c = charOf(characterId);
    const blocked = !c ? '캐릭터를 찾지 못했어요.' : c.role !== 'ability' ? `${ROLE_LABEL[c.role]}에게는 오염이 쌓이지 않아요.` : blockedOf(c);
    const options: RestOption[] = (Object.keys(REST_DEF) as RestKind[]).map((k) => {
      const d = REST_DEF[k];
      const estimate: Record<number, number> = {};
      for (const h of BALANCE.sendHours) estimate[h] = reliefOf(k, h);
      return { id: k, label: d.label, place: d.place, desc: d.desc, estimate, request: d.request, disabled: null };
    });
    return wait({ options, hours: BALANCE.sendHours, blocked });
  },

  async startRest({ characterId, kind, hours }) {
    settleDue();
    const c = charOf(characterId);
    if (!c) return wait({ ok: false, message: '캐릭터를 찾지 못했어요.' });
    if (c.role !== 'ability') return wait({ ok: false, message: '오염이 쌓이지 않는 역할이에요.' });
    if (!(BALANCE.sendHours as readonly number[]).includes(hours) || !REST_DEF[kind]) return wait({ ok: false, message: '고른 내용을 다시 확인해 주세요.' });
    const blocked = blockedOf(c);
    if (blocked) return wait({ ok: false, message: blocked });
    const d = REST_DEF[kind];
    const start = now();
    const s: ActiveSend = {
      id: uid(),
      characterId: c.id,
      characterName: c.name,
      kind: 'rest',
      hours,
      targetName: d.place,
      methodLabel: d.label,
      startedAt: iso(start),
      endsAt: iso(start + hours * H),
    };
    day.runs[s.id] = { methodId: null, stat: null, targetId: d.placeId, restKind: kind, rates: snapshotRates() };
    mockStore.sends().push(s);
    mockStore.save();
    saveDay();
    return wait({ ok: true, value: s }, 400);
  },

  dev: {
    async finishNow(sendId) {
      const s = mockStore.sends().find((x) => x.id === sendId);
      if (!s || ended(s)) return;
      s.endsAt = iso(now() - 1000);
      mockStore.save();
      settleDue();
      saveDay();
    },
    async bringFork(sendId) {
      const s = mockStore.sends().find((x) => x.id === sendId);
      const run = day.runs[sendId];
      const c = s && charOf(s.characterId);
      if (!s || !run || !c || ended(s) || s.kind === 'rest') return false;
      if (!run.forkCode) assignFork(c, run);
      if (!run.forkAt || new Date(run.forkAt).getTime() > now()) run.forkAt = iso(now() - 1000);
      saveDay();
      return true;
    },
    async setNextRoll(value) {
      day.nextRoll = value === null ? null : Math.max(1, Math.min(100, Math.round(value)));
      saveDay();
    },
    async setContamination(characterId, value) {
      const c = charOf(characterId);
      if (!c || c.role !== 'ability') return;
      setContamination(c, value);
      saveDay();
    },
  },
};

/** 판독지(mockDossier)가 내 캐릭터의 오염 기록, 선택 기록, 끝난 결과를 읽으려고 쓴다. */
export const dayRecords = {
  condition(c: StoredChar) {
    const out = conditionOf(c);
    saveDay();
    return out;
  },
  choices(characterId: string) {
    return day.choices[characterId] ?? [];
  },
  setChoiceHidden(characterId: string, choiceId: string, hidden: boolean) {
    const line = day.choices[characterId]?.find((x) => x.id === choiceId);
    if (!line) return false;
    line.hidden = hidden;
    saveDay();
    return true;
  },
  result(sendId: string) {
    settleDue();
    return day.runs[sendId]?.result ?? null;
  },
  gradeLabel(g: Grade) {
    return GRADE_LABEL[g];
  },
};

