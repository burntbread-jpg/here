// 시안 A · 사진 핀 — 사진 썸네일 카드 마커 + 큰 숫자, 선택 시 파란 테두리, 아래 시트에 '항목 N개'.
import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import { createBaseMap, loadRegions, attachRegionLabels, prefersReducedMotion } from './base';
import { PLACES, thumbStyle, placeRow, CAT, type Place } from './places';

type P = { id: string };

export async function initVariantA() {
  const regions = await loadRegions();
  const isMobile = matchMedia('(max-width: 767.98px)').matches;
  const padding = isMobile ? { top: 70, bottom: 180, left: 16, right: 16 } : { top: 90, bottom: 80, left: 410, right: 60 };
  const map = createBaseMap(document.getElementById('map')!, regions, { padding });
  attachRegionLabels(map, regions);

  const byId = new Map(PLACES.map((p) => [p.id, p]));
  const index = new Supercluster<P, P>({ radius: 64, maxZoom: 15, minPoints: 2 });
  index.load(PLACES.map((p) => ({ type: 'Feature', properties: { id: p.id }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })));

  const title = document.getElementById('sheet-title')!;
  const sub = document.getElementById('sheet-sub')!;
  const list = document.getElementById('sheet-list')!;
  const panel = document.getElementById('panel')!;

  let selectedKey: string | null = null;
  const markers = new Map<string, maplibregl.Marker>();

  function show(items: Place[], heading: string, subline: string) {
    title.textContent = heading;
    sub.textContent = subline;
    list.innerHTML = items.slice(0, 80).map(placeRow).join('') + (items.length > 80 ? `<li class="px-2 py-3 text-[13px] text-[var(--color-ink-3)]">외 ${items.length - 80}개</li>` : '');
  }
  const showAll = () => show(PLACES, `항목 ${PLACES.length.toLocaleString()}개`, '지도에서 묶음을 누르면 그 자리의 항목만 보여요');

  function markerEl(key: string, count: number, rep: Place) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'pin';
    el.dataset.key = key;
    el.setAttribute('aria-label', count > 1 ? `항목 ${count}개 묶음` : `${rep.title}, ${CAT[rep.primary].en}`);
    const big = count >= 1000 ? 'text-[19px]' : count >= 100 ? 'text-[21px]' : 'text-[24px]';
    el.innerHTML = `<span class="pin-thumb" style="${thumbStyle(rep)}"></span>` +
      (count > 1 ? `<span class="pin-count ${big} tnum">${count.toLocaleString()}</span>` : `<span class="pin-cat" style="background:${CAT[rep.primary].ink}">${CAT[rep.primary].syllable}</span>`);
    return el;
  }

  function render() {
    const b = map.getBounds();
    const z = Math.round(map.getZoom());
    const clusters = index.getClusters([b.getWest() - 0.3, b.getSouth() - 0.3, b.getEast() + 0.3, b.getNorth() + 0.3], z);
    const seen = new Set<string>();
    for (const c of clusters) {
      const props = c.properties as Supercluster.ClusterProperties & P;
      const isCluster = 'cluster' in props && props.cluster;
      const key = isCluster ? `c${props.cluster_id}` : props.id;
      seen.add(key);
      if (markers.has(key)) continue;
      const count = isCluster ? props.point_count : 1;
      const rep = isCluster ? byId.get((index.getLeaves(props.cluster_id, 1)[0].properties as P).id)! : byId.get(props.id)!;
      const el = markerEl(key, count, rep);
      el.style.zIndex = String(Math.min(count, 9999));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        select(key, isCluster ? index.getLeaves(props.cluster_id, Infinity).map((l) => byId.get((l.properties as P).id)!) : [rep], c.geometry.coordinates as [number, number], isCluster ? props.cluster_id : null);
      });
      const m = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(c.geometry.coordinates as [number, number]).addTo(map);
      if (!prefersReducedMotion()) el.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' });
      markers.set(key, m);
    }
    for (const [k, m] of markers) if (!seen.has(k)) { m.remove(); markers.delete(k); }
    if (selectedKey && !markers.has(selectedKey)) selectedKey = null;
    markers.forEach((m, k) => m.getElement().classList.toggle('is-selected', k === selectedKey));
  }

  function select(key: string, items: Place[], at: [number, number], clusterId: number | null) {
    selectedKey = key;
    markers.forEach((m, k) => m.getElement().classList.toggle('is-selected', k === key));
    const sidos = new Set(items.map((i) => i.sido)); const sggs = new Set(items.map((i) => i.sido + i.sgg));
    show(items, `항목 ${items.length.toLocaleString()}개`, sggs.size === 1 ? `${items[0].sido} ${items[0].sgg}` : sidos.size === 1 ? `${items[0].sido} · ${sggs.size}개 시·군·구` : `${sidos.size}개 시·도 · ${sggs.size}개 시·군·구`);
    panel.dataset.state = 'open';
    // 두 번째 탭이면 확대해서 풀어 준다
    if (clusterId !== null && (map as any).__lastKey === key) {
      map.easeTo({ center: at, zoom: Math.min(index.getClusterExpansionZoom(clusterId) + 0.2, 16), duration: prefersReducedMotion() ? 0 : 500 });
    }
    (map as any).__lastKey = key;
  }

  map.on('click', () => { selectedKey = null; (map as any).__lastKey = null; markers.forEach((m) => m.getElement().classList.remove('is-selected')); showAll(); });
  list.addEventListener('click', (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-place]')?.dataset.place; if (!id) return;
    const p = byId.get(id)!; map.easeTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 14), duration: prefersReducedMotion() ? 0 : 600 });
  });

  map.on('load', () => { render(); showAll(); });
  map.on('moveend', render);
  // 시안 스크린샷용: ?sel=1 이면 가장 큰 묶음을 선택한 상태로 연다
  if (new URLSearchParams(location.search).has('sel')) map.once('idle', () => {
    let best: { k: string; n: number } | null = null;
    markers.forEach((m, k) => { const n = Number(m.getElement().querySelector('.pin-count')?.textContent?.replace(/,/g, '') || 1); if (!best || n > best.n) best = { k, n }; });
    if (best) (markers.get((best as any).k)!.getElement() as HTMLButtonElement).click();
  });
  return map;
}
