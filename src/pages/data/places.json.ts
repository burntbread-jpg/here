// 지도 스크립트가 읽는 데이터. 빌드할 때 한 번 만들어지는 정적 파일이다.
import type { APIRoute } from 'astro';
import { getData, slim } from '../../lib/data';

export const prerender = true;
export const GET: APIRoute = async () => {
  const { places, courses, source } = await getData();
  return new Response(JSON.stringify({ source, places: places.map(slim), courses }), { headers: { 'content-type': 'application/json' } });
};
