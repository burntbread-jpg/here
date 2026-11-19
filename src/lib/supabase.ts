// 서버(요청 처리 중)에서 쓰는 Supabase 클라이언트. 로그인 세션은 쿠키에 담긴다.
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const env = (k: string) => process.env[k] ?? (import.meta.env[k] as string | undefined);

export const supabaseConfigured = () => !!(env('PUBLIC_SUPABASE_URL') && env('PUBLIC_SUPABASE_ANON_KEY'));

export function supabaseServer(ctx: { request: Request; cookies: AstroCookies }) {
  return createServerClient(env('PUBLIC_SUPABASE_URL')!, env('PUBLIC_SUPABASE_ANON_KEY')!, {
    cookies: {
      getAll: () => parseCookieHeader(ctx.request.headers.get('Cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' })),
      setAll: (list) => list.forEach(({ name, value, options }) => ctx.cookies.set(name, value, { ...options, path: '/' })),
    },
  });
}
