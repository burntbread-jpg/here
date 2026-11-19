// 시안 C · 잇기 — 장소 사이를 선으로 잇는다. 기준: 같은 코스(실선) / 같은 날(점선) / 같은 작성자(가는 점선).
import * as maplibregl from 'maplibre-gl';
import { createBaseMap, loadRegions, attachRegionLabels, prefersReducedMotion } from './base';
import { PLACES, COURSES, CAT, syllableChip, type Place } from './places';

type Mode = 'course' | 'day' | 'author';

export async function initVariantC() {
  const regions = await loadRegions();
  const isMobile = matchMedia('(max-width: 767.98px)').matches;
  const padding = isMobile ? { top: 120, bottom: 200, left: 24, right: 24 } : { top: 140, bottom: 60, left: 420, right: 60 };
  const map = createBaseMap(document.getElementById('map')!, regions, { padding });
  attachRegionLabels(map, regions);

  const stops = PLACES.filter((p) => p.course).sort((a, b) => (a.course! < b.course! ? -1 : a.course! > b.course! ? 1 : a.order! - b.order!));
  const others = PLACES.filter((p) => !p.course);
  let mode: Mode = 'course';
  let activeCourse = 'c1';

  const line = (ps: Place[]) => ps.map((p) => [p.lng, p.lat]);
  function links(m: Mode): GeoJSON.FeatureCollection {
    const feats: GeoJSON.Feature[] = [];
    const group = (key: (p: Place) => string, sort: (a: Place, b: Place) => number) => {
      const g = new Map<string, Place[]>(); stops.forEach((p) => g.set(key(p), [...(g.get(key(p)) ?? []), p]));
      for (const [k, ps] of g) {
        const ids = new Set(ps.map((p) => p.course));
        if (ps.length < 2 || (m !== 'course' && ids.size < 2)) continue; // 같은 날·작성자는 코스를 넘나들 때만 의미가 있다
        feats.push({ type: 'Feature', properties: { k, active: ps.some((p) => p.course === activeCourse) }, geometry: { type: 'LineString', coordinates: line(ps.sort(sort)) } });
      }
    };
    if (m === 'course') group((p) => p.course!, (a, b) => a.order! - b.order!);
    if (m === 'day') group((p) => p.date, (a, b) => (a.course! + a.order!).localeCompare(b.course! + b.order!));
    if (m === 'author') group((p) => p.author, (a, b) => (a.date + a.course + a.order).localeCompare(b.date + b.course + b.order));
    return { type: 'FeatureCollection', features: feats };
  }

  const stopMarkers: { p: Place; m: maplibregl.Marker }[] = [];
  map.on('load', () => {
    map.addSource('others', { type: 'geojson', data: { type: 'FeatureCollection', features: others.map((p) => ({ type: 'Feature', properties: { c: CAT[p.primary].ink }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })) } });
    map.addLayer({ id: 'others', type: 'circle', source: 'others', paint: { 'circle-color': ['get', 'c'], 'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 1.6, 12, 3.5], 'circle-opacity': 0.45, 'circle-stroke-color': '#fff', 'circle-stroke-width': 0.6 } });
    map.addSource('links', { type: 'geojson', data: links(mode) });
    map.addLayer({ id: 'links-halo', type: 'line', source: 'links', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': ['case', ['get', 'active'], 7, 5], 'line-opacity': 0.9 } });
    map.addLayer({ id: 'links', type: 'line', source: 'links', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: {
      'line-color': ['case', ['get', 'active'], '#1E1D1A', '#A39C90'], 'line-width': ['case', ['get', 'active'], 3, 2] } });

    for (const p of stops) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'stop';
      el.style.setProperty('--ink', CAT[p.primary].ink);
      el.innerHTML = `<b class="tnum">${p.order}</b><span>${CAT[p.primary].syllable}</span>`;
      el.setAttribute('aria-label', `${p.title}, ${CAT[p.primary].en}`);
      el.onclick = (e) => { e.stopPropagation(); setCourse(p.course!, false); };
      stopMarkers.push({ p, m: new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map) });
    }
    setCourse(activeCourse, false);
    map.fitBounds(bounds(stops.filter((p) => p.sido === '서울특별시')), { padding, duration: 0 });
  });

  function bounds(ps: Place[]) { const b = new maplibregl.LngLatBounds(); ps.forEach((p) => b.extend([p.lng, p.lat])); return b; }

  function applyStyle() {
    const dash = mode === 'course' ? null : mode === 'day' ? [2, 1.6] : [0.1, 2];
    map.setPaintProperty('links', 'line-dasharray', dash ?? [1, 0]);
    (map.getSource('links') as maplibregl.GeoJSONSource).setData(links(mode));
    for (const { p, m } of stopMarkers) m.getElement().classList.toggle('is-dim', p.course !== activeCourse);
  }

  function setCourse(id: string, fly = true) {
    activeCourse = id; applyStyle();
    document.querySelectorAll<HTMLElement>('[data-course]').forEach((el) => el.setAttribute('aria-current', String(el.dataset.course === id)));
    if (fly) map.fitBounds(bounds(stops.filter((p) => p.course === id)), { padding, maxZoom: 14, duration: prefersReducedMotion() ? 0 : 700 });
  }

  // 패널: 코스 목록
  const list = document.getElementById('course-list')!;
  list.innerHTML = COURSES.map((c) => {
    const ps = stops.filter((p) => p.course === c.id);
    return `<li><button type="button" data-course="${c.id}" class="course w-full rounded-2xl p-3 text-left">
      <span class="flex items-baseline justify-between gap-2"><span class="text-[15.5px] font-semibold">${c.title}</span><span class="tnum text-[12px] text-[var(--color-ink-3)]">${ps.length}곳</span></span>
      <span class="mt-0.5 block text-[12.5px] text-[var(--color-ink-3)]">${ps[0].sido} · ${c.date.replaceAll('-', '.')} · ${c.author}</span>
      <span class="mt-2.5 flex items-center gap-1">${ps.map((p, i) => `${i ? '<span class="h-px w-2 bg-[var(--color-line)]"></span>' : ''}${syllableChip(p.primary)}`).join('')}</span>
    </button></li>`;
  }).join('');
  list.addEventListener('click', (e) => { const id = (e.target as HTMLElement).closest<HTMLElement>('[data-course]')?.dataset.course; if (id) setCourse(id); });

  document.getElementById('modes')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]'); if (!b) return;
    mode = b.dataset.mode as Mode;
    document.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    applyStyle();
  });
}
