// 판독지·관계·명부 가짜 서비스. 다른 사람 캐릭터의 설정과 기록은 모두 [대괄호] 자리로 둔다.
import portraitA from '../assets/sample/portrait-a.webp';
import portraitB from '../assets/sample/portrait-b.webp';
import {
  SEND_KIND_LABEL,
  type Activity,
  type ChoiceLine,
  type DirectoryEntry,
  type Dossier,
  type MemoryLoss,
  type PreRecord,
  type Persona,
  type Relation,
  type RelationRequest,
  type RelKind,
  type Role,
  type Stats,
} from '../types/domain';
import { dateKST } from '../lib/time';
import { dayRecords } from './mockDay';
import { mockStore } from './mock';
import type { DossierKeys, GameService } from './types';

const wait = <T,>(v: T, ms = 180) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

interface OtherDef {
  persona: Persona;
  origin: string | null;
  memoryLoss: MemoryLoss | null;
  preRecord?: PreRecord;
  stats: Stats | null;
  status: string;
  regNo: string | null;
}
const st = (a: number[]): Stats => ({ str: a[0]!, con: a[1]!, dex: a[2]!, emp: a[3]!, int: a[4]!, mind: a[5]!, edu: a[6]!, craft: a[7]! });
const P = (id: string, name: string, role: Role, img: string | null): Persona => ({ id, name, role, portraitUrl: img, mine: false });
const OTHERS: OtherDef[] = [
  { persona: P('oA', '[캐릭터 A]', 'ability', portraitA), origin: '새벽뜰', memoryLoss: 'name', preRecord: { realName: '[본명]' }, stats: st([50, 40, 45, 35, 30, 50, 30, 50]), status: '휴게실에서 쉬는 중', regNo: 'A-0388' },
  { persona: P('oB', '[캐릭터 B]', 'staff', portraitB), origin: null, memoryLoss: null, stats: st([30, 40, 30, 60, 45, 40, 55, 30]), status: '식당 근무 중', regNo: null },
  { persona: P('oC', '[캐릭터 C]', 'free', null), origin: '스텔라', memoryLoss: null, stats: null, status: '휴게실에서 쉬는 중', regNo: null },
  { persona: P('oD', '[캐릭터 D]', 'ability', portraitB), origin: null, memoryLoss: 'all', stats: st([40, 40, 40, 40, 40, 40, 40, 50]), status: '휴게실에서 쉬는 중', regNo: 'A-0402' },
  { persona: P('oE', '[캐릭터 E]', 'ability', portraitA), origin: '새벽뜰', memoryLoss: 'period', preRecord: { realName: '[본명]', born: '[생년]' }, stats: st([35, 45, 55, 50, 35, 40, 30, 50]), status: '새벽뜰로 다녀오는 중', regNo: 'A-0391' },
  { persona: P('oF', '[캐릭터 F]', 'staff', portraitB), origin: '누에바 에스페란사', memoryLoss: null, stats: st([30, 35, 30, 55, 50, 45, 55, 40]), status: '새벽뜰에서 쉬는 중', regNo: null },
];

interface Store {
  relations: { id: string; a: string; b: string; kind: RelKind; note: string }[];
  requests: { id: string; from: string; to: string; kind: RelKind; note: string; at: string }[];
  choiceHidden: Record<string, boolean>;
  seededFor: string | null;
}
const KEY = 'webgame.mock.dossier.v1';
function load(): Store {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // 새로 시작
  }
  return { relations: [], requests: [], choiceHidden: {}, seededFor: null };
}
const t = load();
const save = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    // 이번 창에서는 계속 쓴다
  }
};

const mine = () => mockStore.mine();
const myPersona = (c: ReturnType<typeof mine>[number]): Persona => ({ id: c.id, name: c.name, role: c.role, portraitUrl: c.portraitUrl, mine: true });
function persona(id: string): Persona | null {
  const m = mine().find((c) => c.id === id);
  if (m) return myPersona(m);
  return OTHERS.find((o) => o.persona.id === id)?.persona ?? null;
}

/** 처음 열 때: 다른 사람이 내 첫 캐릭터에게 보낸 관계 신청 하나, 다른 사람끼리의 관계 몇 개. */
function seed() {
  const ms = mine();
  const key = ms.map((c) => c.id).join(',');
  if (t.seededFor === key) return;
  if (!t.relations.some((r) => r.a === 'oA')) {
    t.relations.push({ id: uid(), a: 'oA', b: 'oE', kind: 'lost', note: '[두 주인이 적은 관계 한 줄]' }, { id: uid(), a: 'oE', b: 'oF', kind: 'care', note: '의료동 담당' });
  }
  const first = ms[0];
  if (first && !t.requests.some((q) => q.from === 'oE')) {
    t.requests.push({ id: uid(), from: 'oE', to: first.id, kind: 'lost', note: '[캐릭터 E의 주인이 적은 한 줄]', at: ago(0.5) });
  }
  t.seededFor = key;
  save();
}

function relationsOf(id: string): Relation[] {
  return t.relations
    .filter((r) => r.a === id || r.b === id)
    .map((r) => {
      const other = persona(r.a === id ? r.b : r.a);
      return other ? { id: r.id, kind: r.kind, note: r.note, other } : null;
    })
    .filter((r): r is Relation => r !== null);
}

// 판독지의 선택 기록은 "10.29"처럼 짧게 적는다 (한국 시간).
function shortDate(iso: string) {
  const { month, day } = dateKST(new Date(iso));
  return `${month}.${String(day).padStart(2, '0')}`;
}

const SLIP_TITLE = { dispatch: '출동 통지', shift: '근무 일지', outing: '다녀오기 표', rest: '휴식 기록' } as const;

export const mockDossier: Pick<GameService, DossierKeys> = {
  async getDossier(id) {
    seed();
    const c = mine().find((x) => x.id === id);
    if (c) {
      const sends = mockStore.sends().filter((s) => s.characterId === id);
      const running = sends.find((s) => new Date(s.endsAt).getTime() > Date.now());
        const d: Dossier = {
        persona: myPersona(c),
        registrationNo: c.registrationNo,
        origin: c.originSettlement,
        memoryLoss: c.memoryLoss,
        preRecord: c.preRecord,
        ability: c.ability,
        past: c.past,
        look: c.look,
        personality: c.personality,
        stats: c.stats,
        statsHidden: !!c.statsHidden,
        status: running ? `${running.targetName} ${SEND_KIND_LABEL[running.kind]} 중` : null,
        // 오염은 서버가 출동과 휴식으로 계산한다 (mockDay).
        contamination: dayRecords.condition(c).week,
        // 갈림길에서 고른 것이 한 줄씩 쌓인다. 숨긴 줄도 주인에게는 보인다.
        choices: dayRecords.choices(c.id).map((l) => ({ ...l, date: shortDate(l.date) })),
        qna: [],
        memo: null,
        relations: relationsOf(id),
        createdAt: c.createdAt,
      };
      return wait(d);
    }
    const o = OTHERS.find((x) => x.persona.id === id);
    if (!o) return wait(null);
    const hidden = o.stats === null;
    // 남의 판독지: 주인이 숨긴 줄은 서버가 빼고 준다.
    const lines: ChoiceLine[] = [{ id: `${id}-c1`, date: '10.29', text: '[선택 기록 한 줄]', hidden: false }].filter((l) => !t.choiceHidden[l.id]);
    return wait({
      persona: o.persona,
      registrationNo: o.regNo,
      origin: o.origin ? { id: o.origin, name: o.origin } : null,
      memoryLoss: o.memoryLoss,
      preRecord: o.preRecord ?? {},
      ability: o.persona.role === 'ability' ? '[능력 한 줄]' : '',
      past: '[플레이어가 쓴 과거 이야기]',
      look: '[플레이어가 쓴 외형 설명]',
      personality: '[플레이어가 쓴 성격]',
      stats: o.stats,
      statsHidden: hidden,
      status: o.status,
      contamination: o.persona.role === 'ability' ? [22, 41, 18, 30, 55, 24, 36] : null,
      choices: lines,
      qna: [{ id: `${id}-q`, question: '[문답 질문]', answer: '[캐릭터의 말로 쓴 답 한 줄]' }],
      memo: o.persona.role === 'ability' ? { by: '[재단 직원]', text: '[담당 재단 직원이 쓴 메모]' } : null,
      relations: relationsOf(id),
      createdAt: ago(24 * 30),
    });
  },
  async setStatsHidden(id, hidden) {
    const c = mine().find((x) => x.id === id);
    if (!c) return wait({ ok: false, message: '내 캐릭터만 바꿀 수 있어요.' });
    c.statsHidden = hidden;
    mockStore.save();
    return wait({ ok: true, value: undefined });
  },
  async setChoiceHidden(id, choiceId, hidden) {
    if (dayRecords.setChoiceHidden(id, choiceId, hidden)) return wait({ ok: true, value: undefined });
    t.choiceHidden[choiceId] = hidden;
    save();
    return wait({ ok: true, value: undefined });
  },
  async listActivity(id) {
    const c = mine().find((x) => x.id === id);
    const out: Activity[] = [];
    if (c) {
      for (const s of mockStore.sends().filter((x) => x.characterId === id)) {
        const running = new Date(s.endsAt).getTime() > Date.now();
        const r = running ? null : dayRecords.result(s.id);
        const roll = r?.roll;
        const meta: string[] = [];
        if (running) meta.push('진행 중');
        if (roll) meta.push(`${roll.statLabel} ${roll.value}/${roll.target} ${dayRecords.gradeLabel(roll.grade)}`);
        if (r) meta.push(...r.gains.map((g) => `${g.label} ${g.value}`));
        out.push({
          id: s.id,
          kind: s.kind,
          at: s.startedAt,
          title: SLIP_TITLE[s.kind],
          rows: [
            [s.kind === 'dispatch' ? '구역' : s.kind === 'shift' ? '근무지' : s.kind === 'rest' ? '장소' : '목적지', s.targetName],
            [s.kind === 'rest' ? '휴식' : '방식', `${s.methodLabel}, ${s.hours}시간`],
          ],
          body: running ? '진행 중. 끝나면 결과가 여기에 남아요.' : r ? [...r.lines, r.fork ? `갈림길: ${r.fork.text}` : ''].filter(Boolean).join(' ') : '정산을 기다리는 중.',
          meta,
          form: s.kind === 'dispatch' ? '관리대상자 출동 서식 제[번호]호' : s.kind === 'shift' || s.kind === 'rest' ? '재단 서식 근-1' : undefined,
          running,
        });
      }
      for (const ch of dayRecords.choices(id)) {
        out.push({ id: `ch-${ch.id}`, kind: 'choice', at: ch.date, title: '전달 쪽지', rows: [['선택 기록', ch.text]], meta: ch.hidden ? ['숨김'] : ['판독지 선택 기록에 남김'] });
      }
      out.push({
        id: `${id}-reg`,
        kind: 'register',
        at: c.createdAt,
        title: c.role === 'ability' ? '관리대상자 등록' : c.role === 'staff' ? '재단 직원 등록' : '여행 일지 시작',
        rows: [['이름', c.name]],
        meta: c.registrationNo ? [`등록 ${c.registrationNo}`] : [],
      });
    } else {
      const role = OTHERS.find((o) => o.persona.id === id)?.persona.role ?? 'ability';
      // 역할마다 보내두기 기록의 서식이 다르다: 출동 통지 / 근무 일지 / 다녀오기 표.
      const send: Activity =
        role === 'ability'
          ? { id: `${id}-a1`, kind: 'dispatch', at: ago(2), title: '출동 통지', rows: [['구역', '에브론 경계지대 E-07'], ['방식', '조용히 돌아서, 4시간']], body: '[결과 문구]', meta: ['민첩 42/55 성공', '기여 +12'], form: '관리대상자 출동 서식 제[번호]호' }
          : role === 'staff'
            ? { id: `${id}-a1`, kind: 'shift', at: ago(2), title: '근무 일지', rows: [['근무지', '식당'], ['방식', '손으로 하는 일, 4시간']], body: '[결과 문구]', meta: ['전문 38/60 성공', '식당 복구 +6'], form: '재단 서식 근-1' }
            : { id: `${id}-a1`, kind: 'outing', at: ago(2), title: '다녀오기 표', rows: [['목적지', '가람터 강변'], ['방식', '사람을 만난다, 4시간']], body: '[결과 문구]', meta: ['교감 41/45 성공', '이야기 조각 1'] };
      out.push(
        send,
        { id: `${id}-a2`, kind: 'choice', at: ago(4), title: '전달 쪽지', rows: [['갈림길', '[갈림길 제목]']], body: '[선택 기록 한 줄]', meta: ['판독지 선택 기록에 남김'] },
      );
    }
    return wait(out.sort((a, b) => b.at.localeCompare(a.at)));
  },
  async listDirectory({ text, role }) {
    seed();
    const q = text.trim().toLowerCase();
    const all: DirectoryEntry[] = [
      ...mine().map((c) => ({ persona: myPersona(c), origin: c.originSettlement?.name ?? null, newToMe: false })),
      ...OTHERS.map((o) => ({ persona: o.persona, origin: o.origin, newToMe: !relationsOf(o.persona.id).some((r) => r.other.mine) })),
    ];
    // 이름순이나 최근 순이 아니라, 아직 모르는 사람을 앞에 둔다 (교류가 아는 사람끼리 몰리지 않게).
    const list = all
      .filter((e) => (!role || e.persona.role === role) && (!q || e.persona.name.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.newToMe) - Number(a.newToMe));
    return wait(list);
  },
  async requestRelation({ fromId, toId, kind, note }) {
    const from = mine().find((c) => c.id === fromId);
    const to = persona(toId);
    if (!from || !to) return wait({ ok: false, message: '관계를 신청할 수 없는 캐릭터예요.' });
    if (fromId === toId) return wait({ ok: false, message: '같은 캐릭터끼리는 이을 수 없어요.' });
    if (kind === 'care' && !((from.role === 'ability' && to.role === 'staff') || (from.role === 'staff' && to.role === 'ability')))
      return wait({ ok: false, message: '담당은 능력자와 재단 직원 사이에만 맺을 수 있어요.' });
    if (kind === 'free' && !note.trim()) return wait({ ok: false, message: '관계 이름을 적어 주세요.' });
    if (t.relations.some((r) => (r.a === fromId && r.b === toId) || (r.a === toId && r.b === fromId)))
      return wait({ ok: false, message: '이미 이어진 사이예요.' });
    if (to.mine) {
      // 자관: 두 캐릭터의 주인이 같으므로 동의 절차 없이 바로 잇는다.
      t.relations.push({ id: uid(), a: fromId, b: toId, kind, note: note.trim() });
      save();
      return wait({ ok: true, value: { instant: true } });
    }
    if (t.requests.some((q) => q.from === fromId && q.to === toId)) return wait({ ok: false, message: '이미 보낸 신청이 있어요. 상대 주인의 답을 기다려 주세요.' });
    t.requests.push({ id: uid(), from: fromId, to: toId, kind, note: note.trim(), at: new Date().toISOString() });
    save();
    return wait({ ok: true, value: { instant: false } });
  },
  async listRelationRequests() {
    seed();
    const ids = new Set(mine().map((c) => c.id));
    const out: RelationRequest[] = t.requests
      .filter((q) => ids.has(q.to))
      .map((q) => {
        const from = persona(q.from);
        const to = persona(q.to);
        return from && to ? { id: q.id, from, to, kind: q.kind, note: q.note, at: q.at } : null;
      })
      .filter((x): x is RelationRequest => x !== null);
    return wait(out);
  },
  async answerRelationRequest(id, accept) {
    const q = t.requests.find((x) => x.id === id);
    if (!q) return wait({ ok: false, message: '이미 처리한 신청이에요.' });
    t.requests = t.requests.filter((x) => x.id !== id);
    if (accept) t.relations.push({ id: uid(), a: q.from, b: q.to, kind: q.kind, note: q.note });
    save();
    return wait({ ok: true, value: undefined });
  },
};

