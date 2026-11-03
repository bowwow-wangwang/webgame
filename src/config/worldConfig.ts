// 운영자가 운영 화면에서 바꿀 수 있는 서버 설정값(world_config).
// balance.ts와 game.ts의 값이 기본값이고, 서버가 내려준 값을 applyConfig로 덮어쓴다.
// 화면과 서버(지금은 가짜 서버)가 같은 검사 함수를 쓰지만, 저장할 때의 최종 검사는 서버가 한다.
import { BALANCE, DAY } from './balance';
import { OPEN_DATE } from './game';

type ByHours = Record<number, number>;

export interface WorldConfig {
  openDate: string | null;
  day: {
    critMax: number;
    fumbleMin: number;
    cautionAt: number;
    cautionPenalty: number;
    overloadAt: number;
    overloadHours: number;
    overloadClearBelow: number;
    naturalDecayPerHour: number;
    dispatchContamination: ByHours;
    struggleExtra: number;
    steadyRelief: number;
    boostContamination: number;
    boostContribution: number;
    pushContamination: number;
    contribution: ByHours;
    facilityProgress: ByHours;
    mapCells: ByHours;
    commonItems: ByHours;
    restRelief: ByHours;
    togetherBonus: number;
    forkChance: ByHours;
    growthCap: number;
    seasons: { snow: { month: number; day: number; days: number }; rain: { month: number; day: number; days: number }; truceDays: number };
  };
  ops: { reportAutoHide: number; suspendDays: number[] };
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const DEFAULT_CONFIG: WorldConfig = clone({
  openDate: OPEN_DATE,
  day: DAY as unknown as WorldConfig['day'],
  ops: { reportAutoHide: BALANCE.reportAutoHide, suspendDays: [...BALANCE.suspendDays] },
});

let current: WorldConfig = clone(DEFAULT_CONFIG);

/** 지금 쓰는 설정값. */
export const worldConfig = () => current;
export const openDate = () => current.openDate;

/**
 * 서버에서 받은 값을 적용한다. DAY와 BALANCE를 그 자리에서 바꿔서,
 * 그 값을 읽는 화면과 계산이 따로 고치지 않아도 새 값을 보게 한다.
 */
export function applyConfig(cfg: WorldConfig) {
  current = clone(cfg);
  Object.assign(DAY as unknown as WorldConfig['day'], clone(cfg.day));
  Object.assign(BALANCE as unknown as WorldConfig['ops'], clone(cfg.ops));
}

// ── 편집 화면의 칸 정의 ──

export type FieldKind = 'int' | 'prob' | 'byHours' | 'date' | 'list' | 'season';

export interface ConfigField {
  /** 'day.cautionAt'처럼 WorldConfig 안의 자리. */
  path: string;
  label: string;
  help?: string;
  kind: FieldKind;
  min?: number;
  max?: number;
  unit?: string;
}

export interface ConfigGroup {
  id: 'world' | 'contamination' | 'reward' | 'fork' | 'ops';
  title: string;
  note: string;
  fields: ConfigField[];
}

export const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'world',
    title: '세계',
    note: '오픈일은 휴전 연차를 세는 기준이고, 휴전 기념일 주간 갈림길이 이 날짜에 시작해요.',
    fields: [{ path: 'openDate', label: '오픈일', kind: 'date', help: '정하지 않으면 휴전 기념일 갈림길이 나오지 않아요. 한국 시간 기준.' }],
  },
  {
    id: 'contamination',
    title: '오염과 폭주',
    note: '능력자의 오염 상태에 바로 적용돼요. 출동 한 번에 쌓이는 양은 새로 보내는 출동부터 적용돼요.',
    fields: [
      { path: 'day.cautionAt', label: '주의 기준', kind: 'int', min: 1, max: 99, help: '이 값 이상이면 판정 수치가 내려가요.' },
      { path: 'day.cautionPenalty', label: '주의 때 판정 감소', kind: 'int', min: 0, max: 30 },
      { path: 'day.overloadAt', label: '폭주 기준', kind: 'int', min: 2, max: 100 },
      { path: 'day.overloadHours', label: '폭주 시간', kind: 'int', min: 1, max: 72, unit: '시간' },
      { path: 'day.overloadClearBelow', label: '폭주가 풀리는 오염', kind: 'int', min: 0, max: 99, help: '쉬어서 이 값 아래로 내려가면 바로 풀려요.' },
      { path: 'day.naturalDecayPerHour', label: '자연 감소', kind: 'int', min: 0, max: 20, unit: '시간당' },
      { path: 'day.dispatchContamination', label: '출동 오염', kind: 'byHours', min: 0, max: 100 },
      { path: 'day.struggleExtra', label: '고전하면 더 쌓임', kind: 'int', min: 0, max: 50 },
      { path: 'day.steadyRelief', label: '"버티며 신중하게" 성공 때 덜 쌓임', kind: 'int', min: 0, max: 50 },
      { path: 'day.boostContamination', label: '"능력을 아끼지 않는다" 오염', kind: 'int', min: 0, max: 50 },
      { path: 'day.pushContamination', label: '밀어붙이기 오염', kind: 'int', min: 0, max: 50 },
    ],
  },
  {
    id: 'reward',
    title: '보상과 회복',
    note: '새로 보내는 보내두기부터 적용돼요. 진행 중인 것은 보낼 때의 값으로 정산해요.',
    fields: [
      { path: 'day.contribution', label: '정화 기여', kind: 'byHours', min: 0, max: 20, unit: '%' },
      { path: 'day.boostContribution', label: '"능력을 아끼지 않는다" 기여 덤', kind: 'int', min: 0, max: 20, unit: '%' },
      { path: 'day.facilityProgress', label: '시설 복구 진행', kind: 'byHours', min: 0, max: 50 },
      { path: 'day.mapCells', label: '여행 지도 칸', kind: 'byHours', min: 0, max: 10 },
      { path: 'day.commonItems', label: '흔한 물품 개수', kind: 'byHours', min: 0, max: 10 },
      { path: 'day.restRelief', label: '휴식 회복', kind: 'byHours', min: 0, max: 100 },
      { path: 'day.togetherBonus', label: '함께 쉬기 덤', kind: 'prob', help: '0.2면 20% 더 줄어요.' },
    ],
  },
  {
    id: 'fork',
    title: '판정, 갈림길, 성장',
    note: '갈림길 확률은 새로 보내는 보내두기부터, 나머지는 다음 판정부터 적용돼요.',
    fields: [
      { path: 'day.critMax', label: '대성공 (이 값 이하)', kind: 'int', min: 1, max: 10 },
      { path: 'day.fumbleMin', label: '대실패 (이 값 이상)', kind: 'int', min: 90, max: 100 },
      { path: 'day.forkChance', label: '갈림길이 올 확률', kind: 'byHours', min: 0, max: 1, help: '0~1. 1이면 반드시 와요.' },
      { path: 'day.growthCap', label: '성장 상한', kind: 'int', min: 60, max: 99 },
      { path: 'day.seasons.snow', label: '첫눈 갈림길 기간', kind: 'season' },
      { path: 'day.seasons.rain', label: '장마 갈림길 기간', kind: 'season' },
      { path: 'day.seasons.truceDays', label: '휴전 기념일 주간 길이', kind: 'int', min: 1, max: 30, unit: '일' },
    ],
  },
  {
    id: 'ops',
    title: '운영',
    note: '다음에 들어오는 신고와 다음 제재부터 적용돼요.',
    fields: [
      { path: 'ops.reportAutoHide', label: '자동 숨김 기준', kind: 'int', min: 1, max: 20, unit: '건', help: '같은 내용에 신고가 이만큼 쌓이면 확인 전까지 숨겨요.' },
      { path: 'ops.suspendDays', label: '정지 기간 선택지', kind: 'list', min: 1, max: 365, unit: '일', help: '쉼표로 나눠 적어요. 예: 1, 3, 7, 30' },
    ],
  },
];

/** 바꿀 수 없는 값: 이미 만든 캐릭터와 저장소 정책에 묶여 있어서 코드와 서버 정책을 함께 고쳐야 한다. */
export const FIXED_VALUES: { label: string; value: string }[] = [
  { label: '계정당 캐릭터', value: `${BALANCE.maxCharactersPerAccount}명` },
  { label: '능력치 기본 / 배분 / 생성 때 상한', value: `${BALANCE.statBase} / ${BALANCE.statPool} / ${BALANCE.statCapAtCreation}` },
  { label: '캐릭터당 이미지', value: `${BALANCE.imagesPerCharacter}장, 장당 ${Math.round(BALANCE.imageMaxBytes / 1000)}KB, 긴 변 ${BALANCE.imageLongEdge}px` },
  { label: '보내두기 시간', value: BALANCE.sendHours.map((h) => `${h}시간`).join(', ') },
  { label: '보낸 말 고치기', value: `${BALANCE.messageFixMinutes}분` },
  { label: '밤 시간', value: `${BALANCE.quietHours.start}~${BALANCE.quietHours.end}` },
];

// ── 읽기, 쓰기, 검사 ──

export function getAt(cfg: WorldConfig, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | null)?.[k], cfg);
}

export function setAt(cfg: WorldConfig, path: string, v: unknown): WorldConfig {
  const next = clone(cfg);
  const keys = path.split('.');
  const last = keys.pop()!;
  const parent = keys.reduce<Record<string, unknown>>((o, k) => o[k] as Record<string, unknown>, next as unknown as Record<string, unknown>);
  parent[last] = clone(v);
  return next;
}

export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const isInt = (v: unknown, min = -Infinity, max = Infinity) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isNum = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** 칸 하나의 값이 맞는지. 틀리면 사람의 말로 된 이유를 돌려준다. */
export function checkField(f: ConfigField, v: unknown): string | null {
  const range = f.min !== undefined ? `${f.min}~${f.max}` : '';
  switch (f.kind) {
    case 'int':
      return isInt(v, f.min, f.max) ? null : `${range} 사이의 정수로 적어 주세요.`;
    case 'prob':
      return isNum(v, 0, 1) ? null : '0에서 1 사이로 적어 주세요.';
    case 'byHours': {
      const m = v as ByHours;
      for (const h of BALANCE.sendHours) {
        const x = m?.[h];
        const ok = f.max === 1 ? isNum(x, 0, 1) : isInt(x, f.min, f.max);
        if (!ok) return `${h}시간 값을 ${f.max === 1 ? '0에서 1 사이로' : `${range} 사이의 정수로`} 적어 주세요.`;
      }
      return null;
    }
    case 'date':
      return v === null || (typeof v === 'string' && validDate(v)) ? null : '날짜를 다시 골라 주세요.';
    case 'list': {
      const a = v as number[];
      if (!Array.isArray(a) || a.length < 1 || a.length > 6) return '1개에서 6개까지 적어 주세요.';
      if (!a.every((x) => isInt(x, f.min, f.max))) return `${range} 사이의 정수만 적어 주세요.`;
      if (new Set(a).size !== a.length) return '같은 값이 두 번 있어요.';
      return null;
    }
    case 'season': {
      const s = v as { month: number; day: number; days: number };
      if (!isInt(s?.month, 1, 12)) return '월은 1~12로 적어 주세요.';
      if (!isInt(s.day, 1, 31) || !validDate(`2024-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`)) return '없는 날짜예요.';
      if (!isInt(s.days, 1, 60)) return '기간은 1~60일로 적어 주세요.';
      return null;
    }
  }
}

/** 묶음 전체 검사: 칸마다의 범위에 더해 칸끼리의 관계도 본다. */
export function checkGroup(group: ConfigGroup, cfg: WorldConfig): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of group.fields) {
    const e = checkField(f, getAt(cfg, f.path));
    if (e) errs[f.path] = e;
  }
  const d = cfg.day;
  if (group.id === 'contamination') {
    if (!errs['day.cautionAt'] && d.cautionAt >= d.overloadAt) errs['day.cautionAt'] = '폭주 기준보다 작아야 해요.';
    if (!errs['day.overloadClearBelow'] && d.overloadClearBelow >= d.overloadAt) errs['day.overloadClearBelow'] = '폭주 기준보다 작아야 해요.';
  }
  if (group.id === 'fork' && !errs['day.critMax'] && d.critMax >= d.fumbleMin) errs['day.critMax'] = '대실패 기준보다 작아야 해요.';
  return errs;
}

/** 사람이 읽는 값. 조치 기록과 확인 창에 쓴다. */
export function showValue(f: ConfigField, v: unknown): string {
  switch (f.kind) {
    case 'byHours':
      return BALANCE.sendHours.map((h) => `${h}시간 ${(v as ByHours)[h]}`).join(' / ');
    case 'date':
      return (v as string | null) ?? '정하지 않음';
    case 'list':
      return (v as number[]).join(', ') + (f.unit ?? '');
    case 'season': {
      const s = v as { month: number; day: number; days: number };
      return `${s.month}월 ${s.day}일부터 ${s.days}일`;
    }
    default:
      return `${String(v)}${f.unit && f.unit !== '시간당' ? f.unit : ''}`;
  }
}

/** 묶음에서 바뀐 칸만 "이름: 전 → 후"로. */
export function diffGroup(group: ConfigGroup, before: WorldConfig, after: WorldConfig) {
  return group.fields
    .filter((f) => !same(getAt(before, f.path), getAt(after, f.path)))
    .map((f) => ({ path: f.path, label: f.label, from: showValue(f, getAt(before, f.path)), to: showValue(f, getAt(after, f.path)) }));
}
