// 새 장소 저장. 권한은 DB의 RLS가 최종으로 지킨다(작성자 = 로그인한 사람).
import type { APIRoute } from 'astro';
import { session, allowed, parsePlaceForm, photoPrefix, rebuild } from '../../../lib/admin';
export const prerender = false;
export const POST: APIRoute = async (ctx) => {
  const { sb, email, role } = await session(ctx);
  if (!sb || !email || !allowed(role, 'place.create')) return ctx.redirect('/admin');
  const r = parsePlaceForm(await ctx.request.formData(), photoPrefix());
  if (!r.ok) return ctx.redirect(`/admin/places/new?error=${encodeURIComponent(r.error)}`);
  const { data, error } = await sb.from('places').insert({ ...r.value, author: email }).select('id').single();
  if (error) return ctx.redirect(`/admin/places/new?error=${encodeURIComponent('저장하지 못했어요: ' + error.message)}`);
  if (r.value.published) await rebuild();
  return ctx.redirect(`/admin/places/${data.id}?saved=1`);
};
