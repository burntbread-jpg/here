// 시안 B · 음절 + 행정 묶음 — 전국에서는 시·도별, 확대하면 시·군·구별 개수, 더 확대하면 음절 점.
// 묶음 원에는 분류 비율을 도넛으로 그린다. 위쪽 음절 칩으로 분류를 거른다.
import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { createBaseMap, loadRegions, attachRegionLabels, shortSido, prefersReducedMotion, type RegionProps } from './base';
import { PLACES, CATEGORIES, CAT, placeRow, type Place } from './places';
import type { CategoryId } from '../../data/categories';

const LEVEL = { sggFrom: 7.6, pointsFrom: 10.4 };

export async function initVariantB() {
  const regions = await loadRegions();
  const isMobile = matchMedia('(max-width: 767.98px)').matches;
  const padding = isMobile ? { top: 120, bottom: 180, left: 16, right: 16 } : { top: 130, bottom: 40, left: 410, right: 40 };
  const map = createBaseMap(document.getElementById('map')!, regions, { padding });
  attachRegionLabels(map, regions, { hideSidoBelow: 99, sggFrom: LEVEL.pointsFrom }); // 시·도 이름은 묶음 원이 대신 보여 준다

  const active = new Set<CategoryId>(CATEGORIES.map((c) => c.id));
  const visible = () => PLACES.filter((p) => active.has(p.primary) || p.secondary.some((s) => active.has(s)));

  const title = document.getElementById('sheet-title')!;
  const sub = document.getElementById('sheet-sub')!;
  const bars = document.getElementById('sheet-bars')!;
  const list = document.getElementById('sheet-list')!;
  const panel = document.getElementById('panel')!;

  function summarize(items: Place[], heading: string, subline: string) {
    title.textContent = heading; sub.textContent = subline;
    const total = items.length || 1;
    bars.innerHTML = CATEGORIES.map((c) => {
      const n = items.filter((p) => p.primary === c.id).length;
      return `<div class="flex items-center gap-2 text-[12.5px]"><span class="w-5 text-center font-semibold" style="color:${c.ink}">${c.syllable}</span>
        <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[.05]"><span class="block h-full rounded-full" style="width:${(n / total) * 100}%;background:${c.ink}"></span></span>
        <span class="w-7 text-right tnum text-[var(--color-ink-3)]">${n}</span></div>`;
    }).join('');
    list.innerHTML = items.slice(0, 60).map(placeRow).join('');
  }

  // 도넛: 분류별 비율을 conic-gradient로
  function donut(items: Place[]) {
    const total = items.length; let acc = 0; const stops: string[] = [];
    for (const c of CATEGORIES) {
      const n = items.filter((p) => p.primary === c.id).length; if (!n) continue;
      const a = (acc / total) * 360, b = ((acc + n) / total) * 360; acc += n;
      stops.push(`${c.ink} ${a}deg ${b - 1.5}deg`, `#fff ${b - 1.5}deg ${b}deg`);
    }
    return `conic-gradient(${stops.join(',')})`;
  }

  const markers: maplibregl.Marker[] = [];
  let pointIndex: Supercluster<{ id: string }> | null = null;
  const byId = new Map(PLACES.map((p) => [p.id, p]));

  function clear() { markers.splice(0).forEach((m) => m.remove()); }

  function regionBubble(name: string, items: Place[], at: [number, number], onClick: () => void, big: boolean) {
    const el = document.createElement('button'); el.type = 'button'; el.className = `rb ${big ? 'rb-lg' : ''}`;
    el.setAttribute('aria-label', `${name} ${items.length}곳`);
    const k = isMobile ? 0.72 : 1;
    const size = k * (big ? Math.round(44 + Math.sqrt(items.length) * 2.6) : Math.round(34 + Math.sqrt(items.length) * 2.4));
    el.style.setProperty('--s', `${Math.round(Math.min(size, k * (big ? 96 : 72)))}px`);
    el.innerHTML = `<span class="rb-ring" style="background:${donut(items)}"></span><span class="rb-core"><b class="tnum">${items.length}</b>${big ? `<i>${name}</i>` : ''}</span>${big ? '' : `<span class="rb-name">${name}</span>`}`;
    el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    markers.push(new maplibregl.Marker({ element: el }).setLngLat(at).addTo(map));
  }

  function fitRegion(f: GeoJSON.Feature) {
    const b = new maplibregl.LngLatBounds();
    const walk = (c: any) => (typeof c[0] === 'number' ? b.extend(c as [number, number]) : c.forEach(walk));
    walk((f.geometry as any).coordinates);
    map.fitBounds(b, { padding, duration: prefersReducedMotion() ? 0 : 700, maxZoom: 12.5 });
  }

  function render() {
    clear();
    const z = map.getZoom(); const items = visible();
    if (z < LEVEL.sggFrom) {
      for (const f of regions.sido.features) {
        const p = f.properties as RegionProps; const its = items.filter((x) => x.sido === p.sidonm);
        regionBubble(shortSido(p.sidonm), its, [p.lng, p.lat], () => { summarize(its, p.sidonm, `${its.length}곳 · 시·군·구로 확대했어요`); fitRegion(f); }, true);
      }
    } else if (z < LEVEL.pointsFrom) {
      const b = map.getBounds();
      for (const f of regions.sgg.features) {
        const p = f.properties as RegionProps; if (!b.contains([p.lng, p.lat])) continue;
        const its = items.filter((x) => x.sido === p.sidonm && x.sgg === p.sggnm); if (!its.length) continue;
        regionBubble(p.sggnm!, its, [p.lng, p.lat], () => { summarize(its, `${shortSido(p.sidonm)} ${p.sggnm}`, `${its.length}곳`); panel.dataset.state = 'open'; fitRegion(f); }, false);
      }
    } else {
      pointIndex = new Supercluster({ radius: 28, maxZoom: 16 });
      pointIndex.load(items.map((p) => ({ type: 'Feature', properties: { id: p.id }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })));
      const b = map.getBounds();
      for (const c of pointIndex.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.round(z))) {
        const el = document.createElement('button'); el.type = 'button';
        const props = c.properties as any;
        if (props.cluster) {
          const its = pointIndex.getLeaves(props.cluster_id, Infinity).map((l) => byId.get((l.properties as any).id)!);
          el.className = 'dot dot-n'; el.style.background = donut(its); el.innerHTML = `<b class="tnum">${props.point_count}</b>`;
          el.onclick = (e) => { e.stopPropagation(); map.easeTo({ center: c.geometry.coordinates as [number, number], zoom: pointIndex!.getClusterExpansionZoom(props.cluster_id) }); };
        } else {
          const p = byId.get(props.id)!; const cat = CAT[p.primary];
          el.className = 'dot'; el.style.background = cat.ink; el.textContent = cat.syllable; el.setAttribute('aria-label', `${p.title}, ${cat.en}`);
          el.onclick = (e) => { e.stopPropagation(); summarize([p], p.title, `${p.sido} ${p.sgg}`); panel.dataset.state = 'open'; };
        }
        markers.push(new maplibregl.Marker({ element: el }).setLngLat(c.geometry.coordinates as [number, number]).addTo(map));
      }
    }
  }

  // 음절 필터 칩
  const chips = document.getElementById('chips')!;
  chips.innerHTML = CATEGORIES.map((c) => `<button type="button" class="chip" aria-pressed="true" data-cat="${c.id}" style="--ink:${c.ink};--tint:${c.tint}">
    <span class="chip-s">${c.syllable}</span><span class="chip-e">${c.en}</span></button>`).join('');
  chips.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cat]'); if (!btn) return;
    const id = btn.dataset.cat as CategoryId;
    // 모두 켜진 상태에서 누르면 그 분류만, 그 외에는 토글
    if (active.size === CATEGORIES.length) { active.clear(); active.add(id); } else if (active.has(id)) { active.delete(id); if (!active.size) CATEGORIES.forEach((c) => active.add(c.id)); } else active.add(id);
    chips.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(active.has(b.dataset.cat as CategoryId))));
    render(); summarize(visible(), '전국', `${visible().length}곳`);
  });

  map.on('load', () => {
    const at = new URLSearchParams(location.search).get('at');
    if (at === 'seoul') map.jumpTo({ center: [126.985, 37.56], zoom: isMobile ? 9.6 : 10.2 });
    render(); summarize(visible(), at === 'seoul' ? '서울' : '전국', `${(at === 'seoul' ? visible().filter((p) => p.sido === '서울특별시') : visible()).length}곳 · 지역을 누르면 좁혀 봐요`);
  });
  map.on('moveend', render);
  map.on('click', () => summarize(visible(), '전국', `${visible().length}곳`));
}
