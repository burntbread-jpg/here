// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// 배포(빌드) 때 Supabase Storage 의 공개 사진을 내려받아 줄인 사본을 사이트 안에 만든다(docs/DATA.md §사진).
// 방문자는 Supabase가 아니라 Vercel에서 사진을 받으므로 Supabase 무료 전송량을 쓰지 않는다.
try { process.loadEnvFile('.env'); } catch {} // 로컬 .env (Vercel 에서는 환경 변수가 이미 있음)
const env = process.env;
const photoHosts = [env.PUBLIC_SUPABASE_URL, env.HERE_IMAGE_TEST_ORIGIN].filter((u) => !!u).map((u) => {
  // HERE_IMAGE_TEST_ORIGIN: 로컬 시험용 사진 서버(평소에는 비워 둔다)
  const x = new URL(/** @type {string} */ (u));
  return { protocol: x.protocol.replace(':', ''), hostname: x.hostname, ...(x.port ? { port: x.port } : {}) };
});

// 기본은 정적 출력. 로그인·편집이 필요한 페이지(/admin, /api)는
// 각 파일에서 `export const prerender = false` 로 서버 함수가 된다. docs/AUTH.md 참고.
export default defineConfig({
  site: 'https://here.example.com', // [확인 필요] Vercel 도메인 연결 후 교체
  adapter: vercel(),
  image: { remotePatterns: photoHosts },
  devToolbar: { enabled: false },
  // maplibre-gl v6 는 ESM 워커를 상대 경로로 불러오므로 사전 번들링에서 뺀다
  vite: { plugins: [tailwindcss()], optimizeDeps: { exclude: ['maplibre-gl'] } },
});
