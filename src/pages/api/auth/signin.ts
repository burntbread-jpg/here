// Google 로그인 시작 → Google → /api/auth/callback
import type { APIRoute } from 'astro';
import { supabaseServer, supabaseConfigured } from '../../../lib/supabase';
export const prerender = false;
export const POST: APIRoute = async (ctx) => {
  if (!supabaseConfigured()) return ctx.redirect('/admin?error=config');
  const sb = supabaseServer(ctx);
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('/api/auth/callback', ctx.url).toString() },
  });
  if (error || !data.url) return ctx.redirect('/admin?error=signin');
  return ctx.redirect(data.url);
};
