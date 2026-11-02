// 디자인 시스템 원본(tokens.json + system.css.tpl)에서 앱이 쓰는 스타일시트 한 장을 만든다.
// 원본을 고치고 `npm run css`를 다시 돌린다. 만들어진 src/styles/system.css는 손으로 고치지 않는다.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8'));
const tpl = readFileSync(join(here, 'system.css.tpl'), 'utf8');

// 템플릿의 {{이름}} 자리를 src/styles/에서 본 상대 경로로 채운다 (Vite가 묶어 주고 하위 경로 배포에서도 맞는다).
const tex = (f) => `../assets/textures/${f}`;
const assets = {
  'paper-grain': tex('paper-grain.png'),
  housing: tex('housing.webp'),
  glass: tex('screen-glass.png'),
  'paper-film': tex('paper-film.webp'),
  'paper-gov': tex('paper-gov.webp'),
  'stamp-mask': tex('stamp-mask.png'),
  clip: tex('paperclip.png'),
  tape: tex('tape.png'),
  ring: tex('ring-stain.png'),
};

let body = tpl;
for (const [k, v] of Object.entries(assets)) body = body.replaceAll(`{{${k}}}`, v);
const left = body.match(/\{\{[\w-]+\}\}/g);
if (left) throw new Error(`채우지 못한 자리: ${[...new Set(left)].join(', ')}`);

const themes = tokens.color.themes.map((t) => t.id);
const blocks = Object.fromEntries(themes.map((id) => [id, []]));
for (const tok of tokens.color.tokens) {
  const v = tok.value;
  if (typeof v === 'string') blocks[themes[0]].push(`--${tok.name}: ${v};`);
  else for (const id of themes) if (id in v) blocks[id].push(`--${tok.name}: ${v[id]};`);
}
for (const s of tokens.shadow.tokens) blocks[themes[0]].push(`--${s.name}: ${s.value};`);
const root = [
  ...['spacing', 'radius', 'shape'].flatMap((fam) => tokens[fam].tokens.map((x) => `--${x.name}: ${x.value};`)),
  ...Object.entries(tokens.type.families).map(([k, v]) => `--font-${k}: ${v};`),
];

const fonts = tokens.type.fonts
  .map((f) => `@font-face { font-family: '${f.family}'; src: url('../assets/${f.file}') format('woff2'); font-weight: ${f.weight}; font-display: swap; }`)
  .join('\n');

let out = '/* 만들어진 파일: design/build-css.mjs가 design/tokens.json과 design/system.css.tpl에서 만든다. 손으로 고치지 않는다. */\n';
out += fonts + '\n';
out += `:root, [data-theme="terminal"] { ${blocks[themes[0]].join(' ')} }\n`;
for (const id of themes.slice(1)) out += `[data-theme="${id}"] { ${blocks[id].join(' ')} }\n`;
out += `:root { ${root.join(' ')} }\n\n`;
out += body;

const used = new Set([...out.matchAll(/var\(--([\w-]+)/g)].map((m) => m[1]));
const defined = new Set([...out.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]));
// --_로 시작하는 것과 인라인으로 넣는 값(--v, --r, --roll, --s0)은 부품을 쓰는 쪽이 정한다.
const inline = new Set(['v', 'r', 'roll', 's0']);
const missing = [...used].filter((u) => !defined.has(u) && !u.startsWith('_') && !inline.has(u));
if (missing.length) throw new Error(`정의되지 않은 토큰: ${missing.join(', ')}`);

writeFileSync(join(here, '..', 'src', 'styles', 'system.css'), out);
console.log(`src/styles/system.css (${out.length} bytes)`);
