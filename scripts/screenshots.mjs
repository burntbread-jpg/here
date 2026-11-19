// 시안 스크린샷: 1440×900(데스크톱), 390×844(모바일). 사용: node scripts/screenshots.mjs [base=http://localhost:4321] [scale=2]
// Playwright는 컨테이너에 전역 설치된 것을 쓴다(별도 설치 금지). 다른 환경이면 `npx playwright` 로 대체.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const base = process.argv[2] ?? 'http://localhost:4321';
const scale = Number(process.argv[3] ?? 2);
const pages = [
  ['home', '/?still'], ['home-night', '/?still&mode=night'], ['home-sewing', '/?frame=6.2'], ['home-sewing-night', '/?frame=6.2&mode=night'], ['map', '/map'], ['home-seoul', '/map?at=seoul'], ['course', '/course'],
  ['places', '/places'], ['places-eat', '/places/eat'], ['place', '/place/p001'],
];
const sizes = [['1440', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]];
const browser = await pw.chromium.launch({ args: ['--no-sandbox'] });
for (const [w, viewport] of sizes) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: w === '390', hasTouch: w === '390' });
  for (const [name, path] of pages) {
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(path.startsWith('/?') ? 5000 : 1500); // 3D 홈은 소프트웨어 렌더링이 느리다
    await page.screenshot({ path: `shots/${name}-${w}.png` });
    console.log(`shots/${name}-${w}.png`, errs.length ? 'ERRORS: ' + errs.join(' | ') : '');
    await page.close();
  }
  await ctx.close();
}
await browser.close();
