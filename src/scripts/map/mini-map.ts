// 장소 상세의 작은 지도: 백지도 위에 그 장소 하나와 같은 시·군·구의 다른 장소를 옅게 찍는다.
import * as maplibregl from 'maplibre-gl';
import { createBaseMap, loadRegions, attachRegionLabels } from './base';

export async function initMiniMap(el: HTMLElement) {
  const { lng, lat, ink, syllable } = el.dataset as Record<string, string>;
  const near = JSON.parse(el.dataset.near ?? '[]') as [number, number, string][];
  const regions = await loadRegions();
  const map = createBaseMap(el, regions, { padding: 20 });
  map.scrollZoom.disable(); // 페이지 스크롤을 가로채지 않게
  map.jumpTo({ center: [+lng, +lat], zoom: 11 });
  attachRegionLabels(map, regions, { sggFrom: 9 });
  for (const [x, y, c] of near) {
    const d = document.createElement('span'); d.className = 'mini-near'; d.style.background = c;
    new maplibregl.Marker({ element: d }).setLngLat([x, y]).addTo(map);
  }
  const pin = document.createElement('span'); pin.className = 'mini-pin display'; pin.style.background = ink; pin.textContent = syllable;
  new maplibregl.Marker({ element: pin }).setLngLat([+lng, +lat]).addTo(map);
}
