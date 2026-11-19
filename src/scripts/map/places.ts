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
    radial-gradient(120% 90% at ${20 + (n % 60)}% ${10 + (n % 50)}%, color-mix(in oklab, ${c.tint} 80%, #F6F3ED) 0%, transparent 65%),
    linear-gradient(${ang}deg, color-mix(in oklab, ${c.ink} 38%, #E4E0D6) 0%, color-mix(in oklab, ${c.ink} 18%, #F6F3ED) 100%);`;
}

export function syllableChip(id: CategoryId, size: 'sm' | 'md' = 'sm') {
  const c = CAT[id];
  const s = size === 'sm' ? 'size-5 text-[11.5px]' : 'size-6 text-[13px]';
  return `<span class="display inline-grid place-items-center rounded-[3px] ${s}" style="background:${c.tint};color:${c.ink}" title="${c.en}">${c.syllable}</span>`;
}

export function placeRow(p: Place, i = 0) {
  return `<li class="border-b border-[var(--color-linen)] last:border-b-0"><button type="button" data-place="${p.id}" class="row group flex w-full items-center gap-3.5 py-3 text-left">
    <span class="num w-6 shrink-0 self-start pt-0.5 text-[11px] text-[var(--color-caption)]">${String(i + 1).padStart(2, '0')}</span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-[15px] text-[var(--color-ink)]">${p.title}</span>
      <span class="mt-0.5 block truncate text-[12.5px] text-[var(--color-caption)]">${p.sgg} · ${p.author}</span>
      <span class="mt-2 flex items-center gap-1">${syllableChip(p.primary)}${p.secondary.map((s) => syllableChip(s)).join('')}</span>
    </span>
    <span class="size-14 shrink-0 rounded-[2px] transition-transform duration-200 group-hover:scale-[1.03]" style="${thumbStyle(p)}"></span>
    </button></li>`;
}

export function countBy<T>(arr: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  for (const a of arr) m.set(key(a), (m.get(key(a)) ?? 0) + 1);
  return m;
}
