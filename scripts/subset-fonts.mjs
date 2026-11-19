// 빌드가 끝난 뒤, 사이트에 실제로 쓰인 글자만 남긴 작은 글꼴을 만든다. docs/OPERATIONS.md §글꼴
//
// · 대상: 함렛(제목·음절·숫자), Pretendard(본문)
// · 글자 모으기: 빌드된 HTML 의 글자 + /data/places.json(지도 패널이 브라우저에서 그리는 글자) + 기본 문자(ASCII 등)
// · 결과: <out>/fonts/here-*.<hash>.woff2 와 <out>/fonts/here-fonts.css, 그리고 각 HTML 에 preload 를 넣는다.
// · 미리 알 수 없는 글자(편집 화면에 새로 입력한 글 등)는 CSS 글꼴 목록의 다음 순서인
//   원래 글꼴(unicode-range 로 쪼개진 fontsource / pretendard)로 자연스럽게 넘어간다.
//
// 사용: node scripts/subset-fonts.mjs [출력 폴더=.vercel/output/static]
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ?? join(root, '.vercel/output/static');
if (!existsSync(out)) { console.warn(`[fonts] ${out} 이 없어 건너뜁니다`); process.exit(0); }

const files = [];
(function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/\.html$/.test(n)) files.push(p); } })(out);

const chars = new Set();
const add = (s) => { for (const ch of s) chars.add(ch); };
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
for (const f of files) {
  const html = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  add(decode(html.replace(/<[^>]+>/g, ' ')));
  for (const m of html.matchAll(/(?:aria-label|title|placeholder|alt|content)="([^"]*)"/g)) add(decode(m[1]));
}
const data = join(out, 'data/places.json');
if (existsSync(data)) add(readFileSync(data, 'utf8'));
// 스크립트가 화면에 쓰는 고정 문구(지도 패널·폼 안내 등)는 소스에서 한글 문자열을 모은다
(function walkSrc(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walkSrc(p); else if (/\.(ts|astro)$/.test(n)) add((readFileSync(p, 'utf8').match(/[ㄱ-힣]/g) ?? []).join('')); } })(join(root, 'src'));
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
add('·—–…“”‘’→←↗×₩%°');
const text = [...chars].filter((c) => c.trim() || c === ' ').join('');
const hangul = [...chars].filter((c) => /[가-힣]/.test(c)).length;

const fonts = [
  { family: 'HERE Hahmlet', src: join(root, 'fonts-src/Hahmlet-Regular.woff2'), name: 'here-hahmlet', weight: '300 500', opts: {} },
  { family: 'HERE Pretendard', src: join(root, 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2'), name: 'here-pretendard', weight: '45 920', opts: {} },
];
mkdirSync(join(out, 'fonts'), { recursive: true });
let css = '/* 빌드 때 만든 글자 모음 글꼴(scripts/subset-fonts.mjs). 없는 글자는 다음 글꼴로 넘어간다. */\n';
const preloads = [];
for (const f of fonts) {
  const buf = await subsetFont(readFileSync(f.src), text, { targetFormat: 'woff2', ...f.opts });
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
  const file = `${f.name}.${hash}.woff2`;
  writeFileSync(join(out, 'fonts', file), buf);
  css += `@font-face{font-family:'${f.family}';src:url(/fonts/${file}) format('woff2');font-weight:${f.weight};font-style:normal;font-display:swap}\n`;
  preloads.push(`<link rel="preload" href="/fonts/${file}" as="font" type="font/woff2" crossorigin>`);
  console.log(`[fonts] ${f.family}: ${(buf.length / 1024).toFixed(0)}KB (글자 ${chars.size}개, 한글 ${hangul}자)`);
}
writeFileSync(join(out, 'fonts/here-fonts.css'), css);
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  if (html.includes('rel="preload" href="/fonts/here-')) continue;
  writeFileSync(f, html.replace('<link rel="stylesheet" href="/fonts/here-fonts.css">', preloads.join('') + '<link rel="stylesheet" href="/fonts/here-fonts.css">'));
}
