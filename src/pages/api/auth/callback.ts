import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/supabase';
export const prerender = false;
export const GET: APIRoute = async (ctx) => {
  const code = ctx.url.searchParams.get('code');
  if (!code) return ctx.redirect('/admin?error=callback');
  const { error } = await supabaseServer(ctx).auth.exchangeCodeForSession(code);
  return ctx.redirect(error ? '/admin?error=callback' : '/admin');
};
