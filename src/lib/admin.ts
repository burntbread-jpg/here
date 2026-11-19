// 편집 화면 공통: 로그인한 사람과 역할, 입력값 검사, 재배포 훅.
import type { APIContext, AstroGlobal } from 'astro';
import { supabaseServer, supabaseConfigured } from './supabase';
import { can, type Role, type Action } from './auth/roles';
import { CATEGORIES, ATTRIBUTE_TAGS, type CategoryId } from '../data/categories';

type Ctx = Pick<APIContext, 'request' | 'cookies'> | AstroGlobal;

export async function session(ctx: Ctx) {
  if (!supabaseConfigured()) return { sb: null, email: null, role: null as Role | null, configured: false };
  const sb = supabaseServer(ctx);
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? null;
  let role: Role | null = null;
  if (email) {
    const m = await sb.from('members').select('role').eq('email', email).maybeSingle();
    role = (m.data?.role as Role) ?? null;
  }
  return { sb, email, role, configured: true };
}

export const allowed = (role: Role | null, a: Action) => can(role, a);

const CAT_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const TAG_IDS = new Set<string>(ATTRIBUTE_TAGS.map((t) => t.id));

export interface PlaceInput {
  title: string; body: string; primary_cat: CategoryId; secondary: CategoryId[]; tags: string[];
  lng: number; lat: number; sido: string; sgg: string; photos: string[]; visited_on: string | null; published: boolean;
}

/** 폼 값 검사. 문제가 있으면 사람이 읽을 수 있는 이유를 돌려준다. */
export function parsePlaceForm(f: FormData, photoPrefix: string): { ok: true; value: PlaceInput } | { ok: false; error: string } {
  const s = (k: string) => String(f.get(k) ?? '').trim();
  const title = s('title');
  if (!title || title.length > 120) return { ok: false, error: '이름은 1–120자로 적어 주세요.' };
  const primary = s('primary_cat');
  if (!CAT_IDS.has(primary)) return { ok: false, error: '주 분류를 하나 골라 주세요.' };
  const secondary = [...new Set(f.getAll('secondary').map(String))].filter((x) => CAT_IDS.has(x) && x !== primary);
  if (secondary.length > 2) return { ok: false, error: '보조 분류는 2개까지 고를 수 있어요.' };
  const tags = [...new Set(f.getAll('tags').map(String))].filter((x) => TAG_IDS.has(x));
  const lng = Number(s('lng')), lat = Number(s('lat'));
  if (!(lng >= 124 && lng <= 132.1 && lat >= 33 && lat <= 38.7)) return { ok: false, error: '지도에서 위치를 찍어 주세요.' };
  const body = s('body');
  if (body.length > 20000) return { ok: false, error: '본문이 너무 깁니다(2만 자까지).' };
  const date = s('visited_on');
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: '다녀온 날 형식이 맞지 않아요.' };
  const photos = s('photos').split('\n').map((x) => x.trim()).filter(Boolean);
  if (photos.length > 12 || photos.some((u) => !u.startsWith(photoPrefix))) return { ok: false, error: '사진 주소가 올바르지 않아요.' };
  return { ok: true, value: {
    title, body, primary_cat: primary as CategoryId, secondary: secondary as CategoryId[], tags, lng, lat,
    sido: s('sido').slice(0, 40), sgg: s('sgg').slice(0, 40), photos, visited_on: date || null, published: f.get('published') === 'on',
  } };
}

export const photoPrefix = () => `${process.env.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/`;

/** 공개 페이지를 다시 만들도록 Vercel Deploy Hook 을 부른다(설정되어 있을 때만). */
export async function rebuild() {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return false;
  try { await fetch(url, { method: 'POST' }); return true; } catch { return false; }
}
