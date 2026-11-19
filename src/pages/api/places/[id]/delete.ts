import type { APIRoute } from 'astro';
import { session, allowed, rebuild } from '../../../../lib/admin';
export const prerender = false;
export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id!;
  const { sb, email, role } = await session(ctx);
  if (!sb || !email || !role) return ctx.redirect('/admin');
  const cur = await sb.from('places').select('author, published').eq('id', id).maybeSingle();
  if (!cur.data) return ctx.redirect('/admin?error=notfound');
  const mine = cur.data.author === email;
  if (!(mine ? allowed(role, 'place.delete.own') : allowed(role, 'place.delete.any'))) return ctx.redirect('/admin?error=forbidden');
  const { error } = await sb.from('places').delete().eq('id', id);
  if (error) return ctx.redirect(`/admin/places/${id}?error=${encodeURIComponent('지우지 못했어요: ' + error.message)}`);
  if (cur.data.published) await rebuild();
  return ctx.redirect('/admin?deleted=1');
};
