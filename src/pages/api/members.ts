// 편집 가능 계정 관리(관리자만). 최대 5명·관리자 최소 1명은 DB 트리거가 지킨다.
import type { APIRoute } from 'astro';
import { session, allowed } from '../../lib/admin';
import { normalizeEmail } from '../../lib/auth/roles';
export const prerender = false;
const back = (ctx: Parameters<APIRoute>[0], q: string) => ctx.redirect(`/admin/members?${q}`);
export const POST: APIRoute = async (ctx) => {
  const { sb, email, role } = await session(ctx);
  if (!sb || !email || !allowed(role, 'member.manage')) return ctx.redirect('/admin');
  const f = await ctx.request.formData();
  const action = String(f.get('action'));
  const target = normalizeEmail(String(f.get('email') ?? ''));
  const newRole = f.get('role') === 'admin' ? 'admin' : 'editor';
  const name = String(f.get('name') ?? '').trim().slice(0, 40) || null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) return back(ctx, 'error=' + encodeURIComponent('이메일 형식이 맞지 않아요.'));
  let error;
  if (action === 'add') ({ error } = await sb.from('members').insert({ email: target, role: newRole, name }));
  else if (action === 'update') ({ error } = await sb.from('members').update({ role: newRole, name }).eq('email', target));
  else if (action === 'remove') {
    if (target === email) return back(ctx, 'error=' + encodeURIComponent('자기 자신은 지울 수 없어요.'));
    ({ error } = await sb.from('members').delete().eq('email', target));
  } else return back(ctx, 'error=' + encodeURIComponent('알 수 없는 요청이에요.'));
  if (error) return back(ctx, 'error=' + encodeURIComponent(error.message.includes('최대') || error.message.includes('관리자') ? error.message : '저장하지 못했어요: ' + error.message));
  return back(ctx, 'saved=1');
};
