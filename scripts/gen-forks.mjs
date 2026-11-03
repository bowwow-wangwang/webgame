// docs/content/이벤트 스크립트.md(설정집 "이벤트 스크립트" 탭)에서 갈림길 시드를 만든다.
// 문서를 고치면 `npm run seed:forks`를 다시 돌린다. 만들어진 파일은 손으로 고치지 않는다.
// 진짜 서버에서는 같은 결과를 choice_events / choice_options 시드 마이그레이션으로 넣는다.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const md = readFileSync(join(root, 'docs/content/이벤트 스크립트.md'), 'utf8');
const items = readFileSync(join(root, 'docs/content/콘텐츠 초안.md'), 'utf8');

// v0.1에서 내보내지 않는 갈림길: 모두의 선택(v0.2), 닫아 둔 자유 입력(C11, T20), 아직 없는 기능이 조건인 것(T09).
const EXCLUDE = new Set(['F13', 'F16', 'C11', 'T20', 'T09']);

const STAT = { 근력: 'str', 건강: 'con', 민첩: 'dex', 교감: 'emp', 지능: 'int', 정신: 'mind', 교육: 'edu', 능력: 'craft', 전문: 'craft' };
const ROLE = { 능력자: 'ability', '재단 직원': 'staff', 무소속: 'free', 공통: 'all' };
const SEASON = { 첫눈: 'snow', 장마: 'rain', '휴전 기념일': 'truce' };

// 물품 이름 (결과 문구에서 "얻었다"를 찾을 때 쓴다).
const itemNames = [...items.matchAll(/^\| ([^|]+?) \| (?:흔함|가끔|N\d\d|T\d\d|C\d\d)/gm)].map((m) => m[1].trim()).filter((n) => n !== '물품');

// ── 판정표와 실패 문구 표 ──
const judge = new Map(); // "N01A" → { stat, extreme }
const failTable = new Map(); // "N03A" → { fail, record, noPaper }
const section = (title) => {
  const a = md.indexOf(title);
  if (a < 0) return '';
  const b = md.indexOf('\n### ', a + title.length);
  return md.slice(a, b < 0 ? undefined : b);
};
for (const m of section('### 갈림길 판정').matchAll(/^\| ([NFTCS]\d\d) [^|]* \| ([A-C])\. [^|]* \| ([^|]+?) \| ([^|]*?) \|$/gm))
  judge.set(m[1] + m[2], { stat: STAT[m[3].trim()], extreme: m[4].trim() });
for (const m of section('### 실패 문구가 따로 필요한 선택지').matchAll(/^\| ([NFTCS]\d\d) ([A-C])\. [^|]* \| ([^|]+?) \| ([^|]*?) \|$/gm)) {
  const rec = m[4].trim();
  const r = rec.match(/「(.+?)」/);
  failTable.set(m[1] + m[2], {
    fail: m[3].trim().replace(/ \(원래 문구와 같음\)\.?$/, ''),
    record: rec === '성공과 같음' ? undefined : r ? r[1] : null,
    noPaper: rec.includes('정부 공문 없음'),
  });
}

// ── 갈림길 본문 ──
function parseOption(id, label, meta, body, forkRole) {
  const o = { id, label: label.trim() };
  if (meta) {
    if (meta.includes('자동')) o.auto = true;
    const stats = [...meta.matchAll(/근력|건강|민첩|교감|지능|정신|교육|능력|전문/g)].map((x) => STAT[x[0]]);
    if (stats[0]) o.stat = stats[0];
    if (stats[1] && meta.includes('높은 쪽')) o.statAlt = stats[1];
  }
  let text = body ?? '';
  const failM = text.match(/(?:^|\s|·\s)실패하면 (.+)$/);
  if (failM) {
    o.fail = failM[1].trim();
    text = text.slice(0, failM.index);
  }
  const rec = text.match(/기록 「(.+?)」/);
  if (rec) o.record = rec[1];
  const gov = text.match(/정부 공문 "(.+?)"/);
  const fdn = text.match(/재단 메모 "(.+?)"/);
  if (gov) o.paper = { from: 'gov', text: gov[1] };
  else if (fdn) o.paper = { from: 'foundation', text: fdn[1] };
  const memento = text.match(/기념품 "(.+?)"/);
  const paren = text.match(/\(([^()]+)\)\.?\s*$/);
  if (memento) o.item = memento[1];
  else if (paren && itemNames.includes(paren[1].trim())) o.item = paren[1].trim();
  else {
    for (const n of itemNames) {
      const at = text.indexOf(n);
      if (at < 0) continue;
      const after = text.slice(at + n.length, at + n.length + 12);
      if (/^(을|를)? ?(얻었|받았)|^ 하나\.|^ 하나를 (얻|받)/.test(after) || /^[을를] 얻/.test(after)) o.item = n;
    }
  }
  // 오염: 문구에서 읽는다. 능력자가 아닌 역할이 고르면 서버가 덤 포기로 바꾼다.
  if (/오염[이도]? (그만큼 |조금 )?더 쌓였/.test(text)) o.contamination = 6;
  else if (/오염[은이]? (조금 )?덜 쌓였/.test(text)) o.contamination = -3;
  else if (/오염이 줄/.test(text)) o.contamination = -4;
  if (forkRole === 'ability' && /오염이 조금 더 쌓였/.test(o.fail ?? '')) o.failContamination = 4;

  let result = text
    .replace(/기록 「.+?」/g, '')
    .replace(/정부 공문 ".+?"/g, '')
    .replace(/재단 메모 ".+?"/g, '')
    .replace(/(서로에게 )?말 걸기/g, '')
    .split('·')
    .map((x) => x.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
  if (!result) result = o.record ? `${o.record}.` : o.auto ? '별일 없이 지나갔다.' : o.stat ? '해냈다.' : '그렇게 했다.';
  o.result = result;
  return o;
}

const forks = [];
let role = null;
let season = null;
const lines = md.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const h2 = line.match(/^## (\d+)\. (.+)$/);
  if (h2) {
    const t = h2[2];
    season = null;
    role = t.includes('공통') ? 'all' : t.includes('능력자') ? 'ability' : t.includes('재단 직원') ? 'staff' : t.includes('무소속') ? 'free' : t.includes('계절') ? 'season' : null;
    continue;
  }
  const h3 = line.match(/^### (.+)$/);
  if (h3 && role === 'season') season = SEASON[h3[1].trim()] ?? season;
  const head = line.match(/^\*\*([NFTCS]\d\d) (.+?)\*\*(.*)$/);
  if (!head || !role) continue;
  const [, code, title, rest] = head;
  const fork = { code, title, roles: role === 'all' ? 'all' : [role], gov: rest.includes('정부') };
  if (role === 'season') {
    const r = Object.entries(ROLE).find(([k]) => rest.includes(`(${k})`));
    fork.roles = !r || r[1] === 'all' ? 'all' : [r[1]];
    fork.season = season;
  }
  // 상황: 다음 빈 줄 뒤의 문단들 (목록이 나오기 전까지)
  const situation = [];
  let j = i + 1;
  for (; j < lines.length && !lines[j].startsWith('- '); j++) {
    if (lines[j].startsWith('**') || lines[j].startsWith('#')) break;
    if (lines[j].trim()) situation.push(lines[j].trim());
  }
  fork.situation = situation.join(' ');
  const opts = [];
  let autoNote = null;
  let anyNote = null;
  for (; j < lines.length && (lines[j].startsWith('- ') || lines[j].startsWith('  ')); j++) {
    const l = lines[j];
    const auto = l.match(/^- 자동: ([A-C])를/);
    if (auto) {
      autoNote = auto[1];
      continue;
    }
    if (l.startsWith('- 어느 쪽이든')) {
      anyNote = l.slice(2).replace(/^어느 쪽이든 성공하면 /, '').trim();
      continue;
    }
    // "A. … / B. …: 결과" 처럼 선택지 둘이 한 줄에 있는 경우
    const pair = l.match(/^- \*\*([A-C])\. (.+?)\*\*( \([^)]*\))? \/ \*\*([A-C])\. (.+?)\*\*( \([^)]*\))?: (.+)$/);
    if (pair) {
      opts.push(parseOption(pair[1], pair[2], pair[3], pair[7], fork.roles[0]));
      opts.push(parseOption(pair[4], pair[5], pair[6], pair[7], fork.roles[0]));
      continue;
    }
    const m = l.match(/^- \*\*([A-C])\. (.+?)\*\*(?: · 정부)?( \([^)]*\))?(?:: (.*))?$/);
    if (m) opts.push(parseOption(m[1], m[2], m[3], m[4], fork.roles[0]));
  }
  if (autoNote) for (const o of opts) if (o.id === autoNote) o.auto = true;
  for (const o of opts) {
    const k = code + o.id;
    const jd = judge.get(k);
    if (jd) {
      o.stat ??= jd.stat;
      if (jd.extreme) {
        o.extreme = jd.extreme.replace(/\s*\((나중에 돌아오는 결과|기념품)\)/g, '');
        const got = itemNames.find((n) => o.extreme.includes(n) && /얻/.test(o.extreme));
        if (got) o.extremeItem = got;
      }
    }
    const ft = failTable.get(k);
    if (ft) {
      o.fail = ft.fail;
      if (ft.record !== undefined) o.failRecord = ft.record;
      if (ft.noPaper) o.failPaper = null;
    }
    if (anyNote && o.stat && o.result === '그렇게 했다.') o.result = `해냈다. ${anyNote}`;
  }
  // 상황에 실제 캐릭터가 들어가는 자리
  const all = fork.situation + opts.map((o) => o.result + (o.record ?? '')).join(' ');
  if (all.includes('{동료}')) fork.who = { slot: '{동료}', role: fork.roles === 'all' ? null : fork.roles[0], npc: '한 동료' };
  else if (all.includes('{능력자}')) fork.who = { slot: '{능력자}', role: 'ability', npc: '한 능력자' };
  else if (all.includes('{여행자}')) fork.who = { slot: '{여행자}', role: null, npc: '낯선 여행자' };
  if (all.includes('{출신 정착지}')) fork.requires = 'origin';
  fork.options = opts;
  if (EXCLUDE.has(code)) continue;
  if (!opts.length) throw new Error(`${code}: 선택지를 읽지 못했다`);
  if (!opts.some((o) => o.auto)) throw new Error(`${code}: 자동 선택지가 없다`);
  forks.push(fork);
}

const out = `// 만들어진 파일: scripts/gen-forks.mjs가 docs/content/이벤트 스크립트.md에서 만든다. 손으로 고치지 않는다.
import type { ForkSeed } from './forks';

export const FORKS: ForkSeed[] = ${JSON.stringify(forks, null, 2)};
`;
writeFileSync(join(root, 'src/services/seed/forks.generated.ts'), out);
const by = (r) => forks.filter((f) => (r === 'all' ? f.roles === 'all' : f.roles !== 'all' && f.roles.includes(r))).length;
console.log(`갈림길 ${forks.length}개 (능력자 ${by('ability')}, 재단 직원 ${by('staff')}, 무소속 ${by('free')}, 공통 ${by('all')}, 계절 ${forks.filter((f) => f.season).length}) · 뺀 것 ${[...EXCLUDE].join(', ')}`);
