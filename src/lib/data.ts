// 장소·코스 데이터를 읽는 한 곳. 빌드할 때(서버에서) 실행된다.
// Supabase 환경 변수가 있으면 공개 뷰(public_places, public_course_stops)에서 읽고,
// 없으면 시안용 샘플(src/data/sample-places.json)을 쓴다. docs/AUTH.md, docs/DATA.md
import sample from '../data/sample-places.json';
import type { CategoryId } from '../data/categories';

export interface Place {
  id: string; title: string; body?: string | null;
  primary: CategoryId; secondary: CategoryId[]; tags: string[];
  lng: number; lat: number; sido: string; sgg: string;
  photos?: string[];
  author: string;          // 표시 이름(이메일 아님)
  date: string;            // 다녀온 날 YYYY-MM-DD
  course?: string; order?: number;
}
export interface Course { id: string; title: string; author: string; date: string }
export interface Dataset { places: Place[]; courses: Course[]; source: 'supabase' | 'sample' }

const env = (k: string) => (import.meta.env[k] as string | undefined) ?? process.env[k];

let cache: Promise<Dataset> | null = null;

export function getData(): Promise<Dataset> {
  cache ??= load();
  return cache;
}

async function load(): Promise<Dataset> {
  const url = env('PUBLIC_SUPABASE_URL');
  const key = env('PUBLIC_SUPABASE_ANON_KEY');
  if (url && key) {
    try { return await fromSupabase(url, key); }
    catch (e) { console.warn('[here] Supabase에서 읽지 못해 샘플 데이터를 씁니다:', (e as Error).message); }
  }
  return { places: sample.places as Place[], courses: sample.courses as Course[], source: 'sample' };
}

async function fromSupabase(url: string, key: string): Promise<Dataset> {
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [p, c, s] = await Promise.all([
    db.from('public_places').select('*'),
    db.from('public_courses').select('*'),
    db.from('public_course_stops').select('*'),
  ]);
  for (const r of [p, c, s]) if (r.error) throw r.error;
  const stops = new Map<string, { course: string; order: number }>();
  for (const st of s.data!) stops.set(st.place_id, { course: st.course_id, order: st.position });
  const places: Place[] = p.data!.map((r: any) => ({
    id: r.id, title: r.title, body: r.body, primary: r.primary_cat, secondary: r.secondary ?? [], tags: r.tags ?? [],
    lng: r.lng, lat: r.lat, sido: r.sido ?? '', sgg: r.sgg ?? '', photos: r.photos ?? [],
    author: r.author_name ?? '', date: r.visited_on ?? '', ...stops.get(r.id),
  }));
  const courses: Course[] = c.data!.map((r: any) => ({ id: r.id, title: r.title, author: r.author_name ?? '', date: r.visited_on ?? '' }));
  return { places, courses, source: 'supabase' };
}

/** 지도·목록에서 쓰는 가벼운 형태(본문 제외) */
export const slim = ({ body: _b, ...rest }: Place) => rest;
