import type { APIRoute } from 'astro';
import { supabaseServer, supabaseConfigured } from '../../../lib/supabase';
export const prerender = false;
export const POST: APIRoute = async (ctx) => {
  if (supabaseConfigured()) await supabaseServer(ctx).auth.signOut();
  return ctx.redirect('/admin');
};
