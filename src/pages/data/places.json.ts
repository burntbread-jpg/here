// 지도 스크립트가 읽는 데이터. 빌드할 때 한 번 만들어지는 정적 파일이다.
import type { APIRoute } from 'astro';
import { getData, slim } from '../../lib/data';
import { thumb } from '../../lib/photos';

export const prerender = true;
export const GET: APIRoute = async () => {
  const { places, courses, source } = await getData();
  // 지도 패널에는 원본 사진 대신 빌드 때 만든 썸네일 주소만 넣는다
  const out = await Promise.all(places.map(async (p) => {
    const { photos, ...rest } = slim(p);
    return photos?.[0] ? { ...rest, thumb: await thumb(photos[0]) } : rest;
  }));
  return new Response(JSON.stringify({ source, places: out, courses }), { headers: { 'content-type': 'application/json' } });
};
