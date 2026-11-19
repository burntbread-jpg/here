// 사진 주소를 '사이트 안의 줄인 사본'으로 바꾼다. 빌드(정적 페이지 생성) 때만 쓴다.
// 원본은 Supabase Storage 에 있고, 여기서 만든 webp 사본이 dist/_astro 로 들어가 Vercel 이 보낸다.
// 사진을 내려받지 못하면 원본 주소를 그대로 쓴다(사이트는 깨지지 않음).
import { getImage } from 'astro:assets';

const cache = new Map<string, Promise<string>>();

async function local(src: string, width: number, height?: number): Promise<string> {
  const key = `${src}|${width}|${height ?? ''}`;
  if (!cache.has(key)) {
    cache.set(key, getImage({ src, inferSize: true, width, ...(height ? { height, fit: 'cover' } : {}), format: 'webp', quality: 78 })
      .then((r) => r.src)
      .catch((e) => { console.warn('[here] 사진 사본을 만들지 못해 원본을 씁니다:', src, (e as Error).message); return src; }));
  }
  return cache.get(key)!;
}

/** 목록·지도 패널용 정사각 썸네일(320px) */
export const thumb = (src: string) => local(src, 320, 320);
/** 상세 페이지용(가로 1600px까지) */
export const large = (src: string) => local(src, 1600);
