// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// 기본은 정적 출력. 로그인·편집이 필요한 페이지(/admin, /api)는
// 각 파일에서 `export const prerender = false` 로 서버 함수가 된다. docs/AUTH.md 참고.
export default defineConfig({
  site: 'https://here.example.com', // [확인 필요] Vercel 도메인 연결 후 교체
  adapter: vercel(),
  devToolbar: { enabled: false },
  // maplibre-gl v6 는 ESM 워커를 상대 경로로 불러오므로 사전 번들링에서 뺀다
  vite: { plugins: [tailwindcss()], optimizeDeps: { exclude: ['maplibre-gl'] } },
});
