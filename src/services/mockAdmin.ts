// 운영 가짜 서버: 신고 받기, 신고 목록, 조치, 제재, 조치 기록.
// 진짜 서버에서는 reports, moderation_log, sanctions 테이블과 운영자 전용 서버 함수가 맡는다.
// 함수마다 첫 줄에서 운영자인지 확인한다 (진짜는 admins 테이블로 다시 확인한다).
import { BALANCE } from '../config/balance';
import { CONFIG_GROUPS, DEFAULT_CONFIG, applyConfig, checkGroup, diffGroup, getAt, setAt, worldConfig, type WorldConfig } from '../config/worldConfig';
import { DOSSIER_PART_LABEL, MOD_ACTION_LABEL, type ModAction, type ModRequest, type Persona, type ReportCase, type ReportReason, type Result, type Sanction } from '../types/domain';
import { mockStore } from './mock';
import { mockDossier } from './mockDossier';
import { moderation } from './moderation';
import { mockOthers, talkModeration } from './mockTalk';
import type { AdminKeys, GameService } from './types';

const { wait, uid } = mockStore;
const H = 3600_000;
const iso = (t: number) => new Date(t).toISOString();

type StoredReport = Omit<ReportCase, 'account' | 'actions' | 'imageUrl'> & { targetId: string; accountId: string };

interface AdminStore {
  reports: StoredReport[];
  log: ModAction[];
  sanctions: Sanction[];
  seeded: boolean;
}

const KEY = 'webgame.mock.admin.v2';
function load(): AdminStore {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AdminStore;
  } catch {
    // 새로 시작
  }
  return { reports: [], log: [], sanctions: [], seeded: false };
}
const a = load();
const save = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // 이번 창에서는 쓸 수 있다
  }
};

const other = (id: string) => mockOthers.find((o) => o.id === id) as Persona;
// 다른 계정은 테스트용으로 캐릭터마다 계정 하나씩 둔다 (B와 F는 같은 사람).
const accountOf = (p: Persona) => (p.id === 'oF' ? 'acct-oB' : `acct-${p.id}`);
const accountChars = (accountId: string) => mockOthers.filter((o) => accountOf(o) === accountId);

function addReport(input: { targetKind: StoredReport['targetKind']; targetId: string; excerpt: string; where: string; author: Persona; reason: ReportReason; memo: string; at?: number }) {
  const at = input.at ?? Date.now();
  let r = a.reports.find((x) => x.targetKind === input.targetKind && x.targetId === input.targetId && x.status === 'open');
  if (!r) {
    r = {
      id: uid(),
      targetKind: input.targetKind,
      targetId: input.targetId,
      excerpt: input.excerpt,
      where: input.where,
      author: input.author,
      accountId: accountOf(input.author),
      reasons: [],
      count: 0,
      memos: [],
      firstAt: iso(at),
      lastAt: iso(at),
      status: 'open',
      content: 'shown',
      autoHidden: false,
    };
    a.reports.push(r);
  }
  const reason = r.reasons.find((x) => x.reason === input.reason);
  if (reason) reason.count += 1;
  else r.reasons.push({ reason: input.reason, count: 1 });
  r.count += 1;
  r.lastAt = iso(at);
  if (input.memo.trim()) r.memos.push(input.memo.trim());
  // 기준 수만큼 쌓이면 운영자가 보기 전까지 숨긴다. 조치 기록에는 "자동"으로 남긴다.
  if (r.count >= BALANCE.reportAutoHide && r.content === 'shown') {
    r.content = 'hidden';
    r.autoHidden = true;
    applyContent(r, 'hidden');
    log({ kind: 'hide', by: '자동 (신고 누적)', target: targetLine(r), reportId: r.id, memo: `신고 ${r.count}건`, until: null, at });
  }
  return r;
}

function applyContent(r: StoredReport, to: 'shown' | 'hidden' | 'deleted') {
  if (r.targetKind !== 'message') return moderation.set(r.targetId, to === 'shown' ? null : to);
  if (to === 'deleted') talkModeration.remove(r.targetId);
  else talkModeration.setHidden(r.targetId, to === 'hidden');
}

const targetLine = (r: StoredReport) => `${r.author.name}의 ${r.targetKind === 'message' ? '말' : r.targetKind === 'profile' ? '판독지 글' : r.targetKind === 'image' ? '이미지' : '문답 답'} (${r.where})`;

function log(x: Omit<ModAction, 'id' | 'at'> & { at?: number }) {
  const entry: ModAction = { id: uid(), at: iso(x.at ?? Date.now()), by: x.by, kind: x.kind, target: x.target, reportId: x.reportId, memo: x.memo, until: x.until };
  a.log.unshift(entry);
  return entry;
}

function seed() {
  if (a.seeded) return;
  talkModeration.seed();
  const now = Date.now();
  const msg = talkModeration.firstBy('oA');
  if (msg) {
    addReport({ targetKind: 'message', targetId: msg.id, excerpt: msg.text, where: talkModeration.roomName(msg.roomId), author: other('oA'), reason: 'contact', memo: '[신고 메모]', at: now - 5 * H });
    addReport({ targetKind: 'message', targetId: msg.id, excerpt: msg.text, where: talkModeration.roomName(msg.roomId), author: other('oA'), reason: 'contact', memo: '', at: now - 3 * H });
  }
  addReport({ targetKind: 'profile', targetId: 'oC-look', excerpt: '[플레이어가 쓴 외형 설명]', where: '판독지 외형', author: other('oC'), reason: 'harass', memo: '', at: now - 26 * H });
  for (const h of [9, 7, 2]) addReport({ targetKind: 'image', targetId: 'oB-image', excerpt: '[캐릭터 B]의 판독지 사진', where: '판독지 사진', author: other('oB'), reason: 'harm', memo: '', at: now - h * H });
  const done = addReport({ targetKind: 'qna', targetId: 'oE-q', excerpt: '[캐릭터의 말로 쓴 답 한 줄]', where: '문답 "[문답 질문]"', author: other('oE'), reason: 'other', memo: '', at: now - 50 * H });
  done.status = 'done';
  log({ kind: 'dismiss', by: '[운영자]', target: targetLine(done), reportId: done.id, memo: '[처리 메모]', until: null, at: now - 48 * H });
  a.seeded = true;
  save();
}

// ── 서버 설정값 (world_config) ──
// 가짜 서버와 화면이 한 창 안에 있어서, 저장하면 바로 applyConfig로 모두가 새 값을 본다.
const CONFIG_KEY = 'webgame.mock.config.v1';
function loadConfig(): WorldConfig {
  try {
    const raw = sessionStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as WorldConfig) };
  } catch {
    // 기본값으로
  }
  return DEFAULT_CONFIG;
}
applyConfig(loadConfig());

function guard(): string | null {
  const s = mockStore.session();
  if (!s) return '다시 로그인해 주세요.';
  if (!s.admin) return '운영자만 쓸 수 있어요.';
  return null;
}

function view(r: StoredReport): ReportCase {
  const sanctions = a.sanctions.filter((x) => x.accountId === r.accountId);
  const chars = accountChars(r.accountId);
  return {
    ...r,
    imageUrl: r.targetKind === 'image' ? moderation.originalPortrait(r.author.id) : null,
    account: { id: r.accountId, label: `${chars.map((c) => c.name).join(', ')}의 계정`, characters: chars.length, sanctions: sanctions.length },
    actions: a.log.filter((x) => x.reportId === r.id),
  };
}

function activeOf(s: Sanction): Sanction {
  const expired = s.kind === 'suspend' && s.until !== null && new Date(s.until).getTime() <= Date.now();
  return expired ? { ...s, active: false } : s;
}

export const mockAdmin: Pick<GameService, AdminKeys> = {
  async getWorldConfig() {
    return wait(worldConfig(), 60);
  },

  async saveWorldConfig(groupId, cfg) {
    const denied = guard();
    if (denied) return wait({ ok: false, message: denied });
    const group = CONFIG_GROUPS.find((g) => g.id === groupId);
    if (!group) return wait({ ok: false, message: '없는 설정 묶음이에요.' });
    // 보낸 값 중 이 묶음의 칸만 받는다. 나머지는 지금 값 그대로.
    const before = worldConfig();
    let next = before;
    for (const f of group.fields) next = setAt(next, f.path, getAt(cfg, f.path));
    const errs = checkGroup(group, next);
    const first = Object.keys(errs)[0];
    if (first) return wait({ ok: false, message: `${group.fields.find((f) => f.path === first)?.label}: ${errs[first]}` });
    const changes = diffGroup(group, before, next);
    if (!changes.length) return wait({ ok: false, message: '바뀐 값이 없어요.' });
    applyConfig(next);
    try {
      sessionStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    } catch {
      // 이번 창에서는 쓸 수 있다
    }
    const by = mockStore.session()?.email ?? '[운영자]';
    for (const c of changes) log({ kind: 'config', by, target: `${group.title}: ${c.label}`, reportId: null, memo: `${c.from} → ${c.to}`, until: null });
    save();
    return wait({ ok: true, value: worldConfig() }, 300);
  },

  async report({ messageId, part, personaId, reason, memo }) {
    seed();
    const author = mockOthers.find((o) => o.id === personaId);
    if (!author) return wait({ ok: false, message: '신고할 수 없는 대상이에요.' });
    if (messageId) {
      const msg = talkModeration.find(messageId);
      if (!msg) return wait({ ok: false, message: '이미 사라진 말이에요.' });
      addReport({ targetKind: 'message', targetId: msg.id, excerpt: msg.text, where: talkModeration.roomName(msg.roomId), author, reason, memo });
    } else {
      // 판독지에서 고른 칸. 신고된 내용은 서버가 그 자리의 글을 읽어 붙인다 (신고한 사람이 보낸 글을 믿지 않는다).
      const d = await mockDossier.getDossier(personaId);
      if (!d || !part) return wait({ ok: false, message: '무엇을 신고하는지 골라 주세요.' });
      if (part.kind === 'profile') {
        if (!d[part.field]) return wait({ ok: false, message: '이미 비어 있는 칸이에요.' });
        addReport({ targetKind: 'profile', targetId: `${personaId}-${part.field}`, excerpt: d[part.field], where: `판독지 ${DOSSIER_PART_LABEL[part.field]}`, author, reason, memo });
      } else if (part.kind === 'image') {
        if (!d.persona.portraitUrl) return wait({ ok: false, message: '이미 사진이 없어요.' });
        addReport({ targetKind: 'image', targetId: `${personaId}-image`, excerpt: `${author.name}의 판독지 사진`, where: '판독지 사진', author, reason, memo });
      } else {
        const q = d.qna.find((x) => x.id === part.id);
        if (!q) return wait({ ok: false, message: '이미 사라진 답이에요.' });
        addReport({ targetKind: 'qna', targetId: q.id, excerpt: q.answer, where: `문답 "${q.question}"`, author, reason, memo });
      }
    }
    save();
    return wait({ ok: true, value: undefined }, 300);
  },

  async listReports(status) {
    if (guard()) return wait([]);
    seed();
    const list = a.reports.filter((r) => r.status === status).map(view);
    // 기다리는 신고: 자동으로 숨긴 것과 신고가 많은 것을 먼저, 같으면 오래 기다린 것부터.
    list.sort((x, y) =>
      status === 'open'
        ? Number(y.autoHidden) - Number(x.autoHidden) || y.count - x.count || x.firstAt.localeCompare(y.firstAt)
        : y.lastAt.localeCompare(x.lastAt),
    );
    return wait(list, 200);
  },

  async getReport(id) {
    if (guard()) return wait(null);
    seed();
    const r = a.reports.find((x) => x.id === id);
    return wait(r ? view(r) : null, 160);
  },

  async actOnReport(id, req: ModRequest): Promise<Result<ReportCase>> {
    const denied = guard();
    if (denied) return wait({ ok: false, message: denied });
    const r = a.reports.find((x) => x.id === id);
    if (!r) return wait({ ok: false, message: '신고를 찾지 못했어요.' });
    const by = mockStore.session()?.email ?? '[운영자]';
    const memo = req.memo.trim();
    const target = targetLine(r);
    let until: string | null = null;

    switch (req.kind) {
      case 'hide':
      case 'unhide':
        if (r.content === 'deleted') return wait({ ok: false, message: '이미 지운 내용이에요.' });
        r.content = req.kind === 'hide' ? 'hidden' : 'shown';
        r.autoHidden = false;
        applyContent(r, r.content);
        break;
      case 'delete':
        r.content = 'deleted';
        r.autoHidden = false;
        applyContent(r, 'deleted');
        r.status = 'done';
        break;
      case 'dismiss':
        // 문제없음: 자동으로 숨겼던 내용은 다시 보이게 한다.
        if (r.content === 'hidden') {
          r.content = 'shown';
          applyContent(r, 'shown');
        }
        r.autoHidden = false;
        r.status = 'done';
        break;
      case 'close':
        r.status = 'done';
        break;
      case 'warn':
      case 'suspend':
      case 'ban': {
        if (req.kind === 'suspend') {
          if (!(BALANCE.suspendDays as readonly number[]).includes(req.days)) return wait({ ok: false, message: '정지 기간을 다시 골라 주세요.' });
          until = iso(Date.now() + req.days * 24 * H);
        }
        if (req.kind === 'ban' && a.sanctions.some((x) => x.accountId === r.accountId && x.kind === 'ban' && x.active))
          return wait({ ok: false, message: '이미 영구 정지된 계정이에요.' });
        a.sanctions.unshift({
          id: uid(),
          accountId: r.accountId,
          accountLabel: view(r).account.label,
          kind: req.kind,
          at: iso(Date.now()),
          until,
          reason: memo || `${target} 신고 처리`,
          active: req.kind !== 'warn',
        });
        break;
      }
      default:
        return wait({ ok: false, message: '할 수 없는 조치예요.' });
    }
    log({ kind: req.kind, by, target, reportId: r.id, memo, until });
    save();
    return wait({ ok: true, value: view(r) }, 300);
  },

  async listModLog() {
    if (guard()) return wait([]);
    seed();
    return wait(a.log, 160);
  },

  async listSanctions() {
    if (guard()) return wait([]);
    seed();
    return wait(a.sanctions.map(activeOf), 160);
  },

  async liftSanction(id, memo) {
    const denied = guard();
    if (denied) return wait({ ok: false, message: denied });
    const s = a.sanctions.find((x) => x.id === id);
    if (!s || !activeOf(s).active) return wait({ ok: false, message: '지금 걸려 있는 제재가 아니에요.' });
    s.active = false;
    log({ kind: 'lift', by: mockStore.session()?.email ?? '[운영자]', target: `${s.accountLabel}: ${MOD_ACTION_LABEL[s.kind]}`, reportId: null, memo: memo.trim(), until: null });
    save();
    return wait({ ok: true, value: { ...s } }, 260);
  },
};
