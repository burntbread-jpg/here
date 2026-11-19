// 홈 지도 — 전국에서는 시·도별, 확대하면 시·군·구별 개수, 더 확대하면 음절 점(2026-11-19 확정한 시안 B).
// 묶음 원에는 분류 비율을 도넛으로 그린다. 위쪽 음절 칩으로 분류를 거른다.
import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { createBaseMap, loadRegions, attachRegionLabels, shortSido, prefersReducedMotion, type RegionProps } from './base';
import { PLACES, CATEGORIES, CAT, placeRow, type Place, loadData } from './places';
import type { CategoryId } from '../../data/categories';

const LEVEL = { sggFrom: 7.6, pointsFrom: 10.4 };

export async function initHomeMap() {
  const [regions] = await Promise.all([loadRegions(), loadData()]);
  const isMobile = matchMedia('(max-width: 767.98px)').matches;
  const padding = isMobile ? { top: 110, bottom: 196, left: 20, right: 20 } : { top: 120, bottom: 60, left: 430, right: 60 };
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
    const max = Math.max(1, ...CATEGORIES.map((c) => items.filter((p) => p.primary === c.id).length));
    bars.innerHTML = CATEGORIES.map((c) => {
      const n = items.filter((p) => p.primary === c.id).length;
      return `<div class="dist-row"><span class="display cat-text text-[14px]" style="--ink:${c.ink}">${c.syllable}</span>
        <span class="eyebrow !tracking-[0.06em]">${c.en}</span>
        <span class="relative h-px flex-1 bg-[var(--color-linen)]"><span class="absolute inset-y-[-0.5px] left-0 h-[2px]" style="width:${(n / max) * 100}%;background:${c.ink}"></span></span>
        <span class="num w-8 text-right text-[12px] text-[var(--color-caption)]">${n}</span></div>`;
    }).join('');
    void total;
    list.innerHTML = items.slice(0, 60).map((p, i) => placeRow(p, i)).join('');
  }

  // 도넛: 분류별 비율을 conic-gradient로
  const land = getComputedStyle(document.documentElement).getPropertyValue('--color-land').trim() || '#FBF9F5';
  function donut(items: Place[]) {
    const total = items.length; let acc = 0; const stops: string[] = [];
    for (const c of CATEGORIES) {
      const n = items.filter((p) => p.primary === c.id).length; if (!n) continue;
      const a = (acc / total) * 360, b = ((acc + n) / total) * 360; acc += n;
      stops.push(`${c.ink} ${a}deg ${b - 2}deg`, `${land} ${b - 2}deg ${b}deg`);
    }
    return `conic-gradient(${stops.join(',')})`;
  }

  const markers: maplibregl.Marker[] = [];
  let pointIndex: Supercluster<{ id: string }> | null = null;
  const byId = new Map(PLACES.map((p) => [p.id, p]));

  function clear() { markers.splice(0).forEach((m) => m.remove()); placed.length = 0; }

  // 붙어 있는 시·도(세종·대전, 부산·울산 등)의 원이 겹치지 않게 화면 좌표에서 살짝 밀어낸다
  const placed: { m: maplibregl.Marker; x: number; y: number; r: number; ox: number; oy: number }[] = [];
  function relax() {
    for (const q of placed) { const pt = map.project(q.m.getLngLat()); q.x = pt.x; q.y = pt.y; q.ox = 0; q.oy = 0; }
    for (let it = 0; it < 80; it++) {
      let moved = false;
      for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], b = placed[j];
        const dx = (b.x + b.ox) - (a.x + a.ox), dy = (b.y + b.oy) - (a.y + a.oy);
        const d = Math.hypot(dx, dy) || 0.01, need = a.r + b.r + 4;
        if (d < need) { const push = (need - d) / 2, ux = dx / d, uy = dy / d; a.ox -= ux * push; a.oy -= uy * push; b.ox += ux * push; b.oy += uy * push; moved = true; }
      }
      if (!moved) break;
    }
    for (const q of placed) q.m.setOffset([q.ox, q.oy]);
  }

  function regionBubble(name: string, items: Place[], at: [number, number], onClick: () => void, big: boolean) {
    const el = document.createElement('button'); el.type = 'button'; el.className = `rb ${big ? 'rb-lg' : ''}`;
    el.setAttribute('aria-label', `${name} ${items.length}곳`);
    const k = isMobile ? 0.72 : 1;
    const size = k * (big ? Math.round(34 + Math.sqrt(items.length) * 2.2) : Math.round(28 + Math.sqrt(items.length) * 2));
    el.style.setProperty('--s', `${Math.round(Math.min(size, k * (big ? 72 : 56)))}px`);
    el.innerHTML = `<span class="rb-ring" style="background:${donut(items)}"></span><span class="rb-core"><b class="num">${items.length}</b></span><span class="rb-name">${name}</span>`;
    el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    const m = new maplibregl.Marker({ element: el }).setLngLat(at).addTo(map);
    markers.push(m);
    // 이름 라벨(원 아래 약 16px)까지 포함해 반지름을 잡는다
    const s = parseFloat(el.style.getPropertyValue('--s'));
    placed.push({ m, x: 0, y: 0, r: s / 2 + 7, ox: 0, oy: 0 });
  }

  function fitRegion(f: GeoJSON.Feature) {
    const b = new maplibregl.LngLatBounds();
    const walk = (c: any) => (typeof c[0] === 'number' ? b.extend(c as [number, number]) : c.forEach(walk));
    walk((f.geometry as any).coordinates);
    map.fitBounds(b, { padding, duration: prefersReducedMotion() ? 0 : 700, maxZoom: 12.5 });
  }

  function render() {
    clear();
    const eyebrow = document.getElementById('sheet-level');
    const z = map.getZoom(); const items = visible();
    if (z < LEVEL.sggFrom) {
      for (const f of regions.sido.features) {
        const p = f.properties as RegionProps; const its = items.filter((x) => x.sido === p.sidonm);
        regionBubble(shortSido(p.sidonm), its, [p.lng, p.lat], () => { summarize(its, p.sidonm, `${its.length}곳 · 시·군·구로 확대했어요`); fitRegion(f); }, true);
      }
      relax(); if (eyebrow) eyebrow.textContent = '시·도별';
    } else if (z < LEVEL.pointsFrom) {
      const b = map.getBounds();
      for (const f of regions.sgg.features) {
        const p = f.properties as RegionProps; if (!b.contains([p.lng, p.lat])) continue;
        const its = items.filter((x) => x.sido === p.sidonm && x.sgg === p.sggnm); if (!its.length) continue;
        regionBubble(p.sggnm!, its, [p.lng, p.lat], () => { summarize(its, `${shortSido(p.sidonm)} ${p.sggnm}`, `${its.length}곳`); panel.dataset.state = 'open'; fitRegion(f); }, false);
      }
      relax(); if (eyebrow) eyebrow.textContent = '시·군·구별';
    } else {
      if (eyebrow) eyebrow.textContent = '장소별';
      pointIndex = new Supercluster({ radius: 28, maxZoom: 16 });
      pointIndex.load(items.map((p) => ({ type: 'Feature', properties: { id: p.id }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })));
      const b = map.getBounds();
      for (const c of pointIndex.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.round(z))) {
        const el = document.createElement('button'); el.type = 'button';
        const props = c.properties as any;
        if (props.cluster) {
          const its = pointIndex.getLeaves(props.cluster_id, Infinity).map((l) => byId.get((l.properties as any).id)!);
          el.className = 'dot dot-n'; el.style.background = donut(its); el.innerHTML = `<b class="num">${props.point_count}</b>`;
          el.onclick = (e) => { e.stopPropagation(); map.easeTo({ center: c.geometry.coordinates as [number, number], zoom: pointIndex!.getClusterExpansionZoom(props.cluster_id) }); };
        } else {
          const p = byId.get(props.id)!; const cat = CAT[p.primary];
          el.className = 'dot display'; el.style.background = cat.ink; el.textContent = cat.syllable; el.setAttribute('aria-label', `${p.title}, ${cat.en}`);
          el.onclick = (e) => { e.stopPropagation(); summarize([p], p.title, `${p.sido} ${p.sgg}`); panel.dataset.state = 'open'; };
        }
        markers.push(new maplibregl.Marker({ element: el }).setLngLat(c.geometry.coordinates as [number, number]).addTo(map));
      }
    }
  }

  // 음절 필터 칩
  const chips = document.getElementById('chips')!;
  chips.innerHTML = CATEGORIES.map((c) => `<button type="button" class="chip" aria-pressed="true" data-cat="${c.id}" style="--ink:${c.ink};--tint:${c.tint}">
    <span class="chip-s display">${c.syllable}</span><span class="chip-e">${c.en}</span></button>`).join('');
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
    render(); { const its = at === 'seoul' ? visible().filter((p) => p.sido === '서울특별시') : visible(); summarize(its, at === 'seoul' ? '서울' : '전국', `${its.length}곳 · 지역을 누르면 좁혀 봐요`); }
    // 3D 홈에서 시·도를 눌러 들어온 경우: /map?sido=서울특별시
    const want = new URLSearchParams(location.search).get('sido');
    const f = want && regions.sido.features.find((x) => (x.properties as RegionProps).sidonm === want);
    if (f) { const its = visible().filter((x) => x.sido === want); summarize(its, want!, `${its.length}곳`); fitRegion(f); }
  });
  map.on('moveend', render);
  map.on('click', () => summarize(visible(), '전국', `${visible().length}곳`));
}
