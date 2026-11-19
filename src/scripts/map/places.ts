import data from '../../data/sample-places.json';
import { CAT, CATEGORIES, type CategoryId } from '../../data/categories';

export interface Place {
  id: string; title: string; primary: CategoryId; secondary: CategoryId[]; tags: string[];
  lng: number; lat: number; sido: string; sgg: string; author: string; date: string; course?: string; order?: number;
}
export interface Course { id: string; title: string; author: string; date: string }

export const PLACES = data.places as Place[];
export const COURSES = data.courses as Course[];
export { CAT, CATEGORIES };

/** 사진이 들어갈 자리의 임시 썸네일. 실제 사진이 등록되면 <img>로 바뀐다. */
export function thumbStyle(p: Pick<Place, 'primary' | 'id'>) {
  const c = CAT[p.primary];
  const n = [...p.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const ang = (n * 47) % 360;
  return `background:
    radial-gradient(120% 90% at ${20 + (n % 60)}% ${10 + (n % 50)}%, ${c.tint} 0%, transparent 60%),
    linear-gradient(${ang}deg, color-mix(in oklab, ${c.ink} 78%, #fff) 0%, color-mix(in oklab, ${c.ink} 45%, #F6F3ED) 100%);`;
}

export function syllableChip(id: CategoryId, size: 'sm' | 'md' = 'sm') {
  const c = CAT[id];
  const s = size === 'sm' ? 'h-5 min-w-5 text-[11px]' : 'h-6 min-w-6 text-[13px]';
  return `<span class="inline-grid place-items-center rounded-md px-1 font-semibold ${s}" style="background:${c.tint};color:${c.ink}" title="${c.en}">${c.syllable}</span>`;
}

export function placeRow(p: Place) {
  return `<li><button type="button" data-place="${p.id}" class="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-black/[.035] focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]">
    <span class="size-12 shrink-0 rounded-lg" style="${thumbStyle(p)}"></span>
    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-1.5">${syllableChip(p.primary)}${p.secondary.map((s) => syllableChip(s)).join('')}</span>
      <span class="mt-1 block truncate text-[15px] font-medium">${p.title}</span>
      <span class="block truncate text-[12.5px] text-[var(--color-ink-3)]">${p.sido} ${p.sgg} · ${p.author}</span>
    </span></button></li>`;
}

export function countBy<T>(arr: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  for (const a of arr) m.set(key(a), (m.get(key(a)) ?? 0) + 1);
  return m;
}
