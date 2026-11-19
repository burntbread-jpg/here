// 장소 고치기. 편집자는 자기 글만(RLS), 관리자는 모두.
import type { APIRoute } from 'astro';
import { session, allowed, parsePlaceForm, photoPrefix, rebuild } from '../../../../lib/admin';
export const prerender = false;
export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id!;
  const { sb, email, role } = await session(ctx);
  if (!sb || !email || !role) return ctx.redirect('/admin');
  const cur = await sb.from('places').select('author, published').eq('id', id).maybeSingle();
  if (!cur.data) return ctx.redirect('/admin?error=notfound');
  const mine = cur.data.author === email;
  if (!(mine ? allowed(role, 'place.update.own') : allowed(role, 'place.update.any'))) return ctx.redirect('/admin?error=forbidden');
  const r = parsePlaceForm(await ctx.request.formData(), photoPrefix());
  if (!r.ok) return ctx.redirect(`/admin/places/${id}?error=${encodeURIComponent(r.error)}`);
  const { error } = await sb.from('places').update(r.value).eq('id', id);
  if (error) return ctx.redirect(`/admin/places/${id}?error=${encodeURIComponent('저장하지 못했어요: ' + error.message)}`);
  if (r.value.published || cur.data.published) await rebuild();
  return ctx.redirect(`/admin/places/${id}?saved=1`);
};
