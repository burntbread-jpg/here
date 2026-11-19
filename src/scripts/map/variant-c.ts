// 시안 C · 잇기 — 장소 사이를 선으로 잇는다. 기준: 같은 코스(실선) / 같은 날(점선) / 같은 작성자(가는 점선).
import * as maplibregl from 'maplibre-gl';
import { createBaseMap, loadRegions, attachRegionLabels, prefersReducedMotion } from './base';
import { PLACES, COURSES, CAT, syllableChip, type Place } from './places';


export async function initVariantC() {
  const regions = await loadRegions();
  const isMobile = matchMedia('(max-width: 767.98px)').matches;
  const padding = isMobile ? { top: 120, bottom: 200, left: 24, right: 24 } : { top: 140, bottom: 60, left: 420, right: 60 };
  const map = createBaseMap(document.getElementById('map')!, regions, { padding });
  attachRegionLabels(map, regions);

  const stops = PLACES.filter((p) => p.course).sort((a, b) => (a.course! < b.course! ? -1 : a.course! > b.course! ? 1 : a.order! - b.order!));
  const others = PLACES.filter((p) => !p.course);
  let activeCourse = 'c1';

  // 선은 작성자가 직접 코스로 등록한 경우에만 그린다(같은 날·같은 작성자 자동 연결은 하지 않기로 함, 2026-11-19).
  function links(): GeoJSON.FeatureCollection {
    return { type: 'FeatureCollection', features: COURSES.map((c) => {
      const ps = stops.filter((p) => p.course === c.id).sort((a, b) => a.order! - b.order!);
      return { type: 'Feature', properties: { k: c.id, active: c.id === activeCourse }, geometry: { type: 'LineString', coordinates: ps.map((p) => [p.lng, p.lat]) } };
    }) };
  }

  const stopMarkers: { p: Place; m: maplibregl.Marker }[] = [];
  map.on('load', () => {
    map.addSource('others', { type: 'geojson', data: { type: 'FeatureCollection', features: others.map((p) => ({ type: 'Feature', properties: { c: CAT[p.primary].ink }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })) } });
    map.addLayer({ id: 'others', type: 'circle', source: 'others', paint: { 'circle-color': ['get', 'c'], 'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 1.6, 12, 3.5], 'circle-opacity': 0.45, 'circle-stroke-color': '#fff', 'circle-stroke-width': 0.6 } });
    map.addSource('links', { type: 'geojson', data: links() });
    map.addLayer({ id: 'links-halo', type: 'line', source: 'links', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': ['case', ['get', 'active'], 7, 5], 'line-opacity': 0.9 } });
    map.addLayer({ id: 'links', type: 'line', source: 'links', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: {
      'line-color': ['case', ['get', 'active'], '#24231F', '#A69D8D'], 'line-width': ['case', ['get', 'active'], 2, 1.25] } });

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
    (map.getSource('links') as maplibregl.GeoJSONSource).setData(links());
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
      <span class="flex items-baseline justify-between gap-2"><span class="display text-[19px]">${c.title}</span><span class="num text-[12px] text-[var(--color-caption)]">${ps.length}곳</span></span>
      <span class="mt-0.5 block text-[12.5px] text-[var(--color-ink-3)]">${ps[0].sido} · ${c.date.replaceAll('-', '.')} · ${c.author}</span>
      <span class="mt-2.5 flex items-center gap-1">${ps.map((p, i) => `${i ? '<span class="h-px w-2 bg-[var(--color-line)]"></span>' : ''}${syllableChip(p.primary)}`).join('')}</span>
    </button></li>`;
  }).join('');
  list.addEventListener('click', (e) => { const id = (e.target as HTMLElement).closest<HTMLElement>('[data-course]')?.dataset.course; if (id) setCourse(id); });
}
