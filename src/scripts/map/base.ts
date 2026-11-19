// 타일 서비스 없이 행정구역 경계만으로 그리는 '백지도'. 홈·코스·장소 지도가 공유한다. docs/MAP.md
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap, LngLatBoundsLike } from 'maplibre-gl';
// 배포 빌드에서 워커 경로가 깨지지 않도록 워커 파일을 자산으로 내보내고 주소를 직접 알려 준다
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
maplibregl.setWorkerUrl(workerUrl);

export const KOREA_BOUNDS: LngLatBoundsLike = [[124.6, 33.0], [131.0, 38.65]];
export const ZOOM = { sggLines: 7.4, sggLabels: 9.6, sidoLabelsMax: 8.6 };

export interface RegionProps { sidocd: string; sidonm: string; sggcd?: string; sggnm?: string; lng: number; lat: number }
export interface Regions { sido: GeoJSON.FeatureCollection; sgg: GeoJSON.FeatureCollection }

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export async function loadRegions(): Promise<Regions> {
  const [sido, sgg] = await Promise.all(['/geo/sido.geojson', '/geo/sgg.geojson'].map((u) => fetch(u).then((r) => r.json())));
  return { sido, sgg };
}

/** 시·도 이름을 짧게: '서울특별시' → '서울', '경기도' → '경기' */
export function shortSido(n: string) {
  const special: Record<string, string> = { 충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전북특별자치도: '전북', 경상북도: '경북', 경상남도: '경남', 전라남도: '전남', 전남광주통합특별시: '전남광주' };
  if (special[n]) return special[n];
  return n.replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, '');
}

export function createBaseMap(container: HTMLElement, regions: Regions, opts: { padding?: maplibregl.PaddingOptions } = {}) {
  const map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: {
        sido: { type: 'geojson', data: regions.sido, attribution: '경계: 통계청 SGIS(공공누리 1유형) · vuski/admdongkor (CC BY 4.0)' },
        sgg: { type: 'geojson', data: regions.sgg },
      },
      layers: [
        { id: 'sea', type: 'background', paint: { 'background-color': css('--color-sea') || css('--color-paper') || '#F4F4F1' } },
        { id: 'land', type: 'fill', source: 'sido', paint: { 'fill-color': css('--color-land') || '#FFFFFF' } },
        { id: 'sgg-hover', type: 'fill', source: 'sgg', paint: { 'fill-color': '#000', 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.035, 0] } },
        { id: 'sgg-line', type: 'line', source: 'sgg', minzoom: ZOOM.sggLines - 0.6,
          paint: { 'line-color': css('--color-line-2') || '#E8E2D7', 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.4, 11, 1], 'line-opacity': ['interpolate', ['linear'], ['zoom'], ZOOM.sggLines - 0.6, 0, ZOOM.sggLines, 1] } },
        { id: 'sido-line', type: 'line', source: 'sido', paint: { 'line-color': css('--color-line') || '#D9D2C5', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1.6] } },
        { id: 'coast', type: 'line', source: 'sido', paint: { 'line-color': css('--color-coast') || '#CFC6B6', 'line-width': 0.6, 'line-blur': 0.4 } },
      ],
    },
    bounds: KOREA_BOUNDS,
    fitBoundsOptions: { padding: opts.padding ?? 24 },
    minZoom: 5,
    maxZoom: 16,
    maxBounds: [[121.5, 31.5], [134.5, 40.2]],
    dragRotate: false,
    pitchWithRotate: false,
    attributionControl: { compact: true },
  });
  map.touchZoomRotate.disableRotation();
  // 출처 표기는 접힌 상태(ⓘ)로 시작한다. 펼치면 경계 데이터 출처가 보인다.
  map.once('load', () => container.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  // 시·군·구 위에 마우스를 올리면 아주 옅게 칠한다
  let hovered: string | number | undefined;
  map.on('mousemove', 'sgg-hover', (e) => {
    const id = e.features?.[0]?.id;
    if (hovered !== undefined) map.setFeatureState({ source: 'sgg', id: hovered }, { hover: false });
    hovered = id; if (id !== undefined) map.setFeatureState({ source: 'sgg', id }, { hover: true });
  });
  map.on('mouseleave', 'sgg-hover', () => { if (hovered !== undefined) map.setFeatureState({ source: 'sgg', id: hovered }, { hover: false }); hovered = undefined; });

  return map;
}

/** 지역 이름 라벨(HTML). 글리프 서버가 없으므로 심볼 레이어 대신 HTML로 그린다. */
export function attachRegionLabels(map: MLMap, regions: Regions, opts: { hideSidoBelow?: number; sggFrom?: number } = {}) {
  const make = (f: GeoJSON.Feature, cls: string, text: string) => {
    const el = document.createElement('div'); el.className = `rlabel ${cls}`; el.textContent = text;
    const p = f.properties as RegionProps;
    return { m: new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([p.lng, p.lat]), p, on: false };
  };
  const sido = regions.sido.features.map((f) => make(f, 'sido', shortSido((f.properties as RegionProps).sidonm)));
  const sgg = regions.sgg.features.map((f) => make(f, 'sgg', (f.properties as RegionProps).sggnm!));
  const update = () => {
    const z = map.getZoom(); const b = map.getBounds();
    for (const l of sido) { const on = z < ZOOM.sidoLabelsMax && z >= (opts.hideSidoBelow ?? 0); if (on !== l.on) { on ? l.m.addTo(map) : l.m.remove(); l.on = on; } }
    for (const l of sgg) { const on = z >= (opts.sggFrom ?? ZOOM.sggLabels) && b.contains([l.p.lng, l.p.lat]); if (on !== l.on) { on ? l.m.addTo(map) : l.m.remove(); l.on = on; } }
  };
  map.on('moveend', update); map.on('load', update);
  return update;
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
