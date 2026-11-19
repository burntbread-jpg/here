// 장소 폼: 지도에서 위치 찍기(시·도/시·군·구 자동), 보조 분류 2개 제한, 사진 줄여 올리기.
import * as maplibregl from 'maplibre-gl';
import { createBrowserClient } from '@supabase/ssr';
import { createBaseMap, loadRegions, attachRegionLabels } from '../map/base';

type Ring = number[][];
function inRing([x, y]: number[], ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inGeom(pt: number[], g: GeoJSON.Geometry): boolean {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.some((rings) => inRing(pt, rings[0] as Ring) && !rings.slice(1).some((h) => inRing(pt, h as Ring)));
}

export async function initPlaceForm(form: HTMLFormElement) {
  const $ = (n: string) => form.elements.namedItem(n) as HTMLInputElement;
  const label = document.getElementById('pick-label')!;

  // 보조 분류는 2개까지, 주 분류와 같은 것은 막는다
  const secBoxes = [...form.querySelectorAll<HTMLInputElement>('input[name=secondary]')];
  const syncSec = () => {
    const prim = (form.querySelector('input[name=primary_cat]:checked') as HTMLInputElement | null)?.value;
    const n = secBoxes.filter((b) => b.checked && b.value !== prim).length;
    secBoxes.forEach((b) => { if (b.value === prim) b.checked = false; b.disabled = b.value === prim || (!b.checked && n >= 2); b.parentElement!.style.opacity = b.disabled ? '.4' : '1'; });
  };
  form.addEventListener('change', syncSec); syncSec();

  // 위치 찍기
  const regions = await loadRegions();
  const el = document.getElementById('pick-map')!;
  const map = createBaseMap(el, regions, { padding: 20 });
  attachRegionLabels(map, regions);
  const pin = document.createElement('span'); pin.className = 'pick-pin';
  const marker = new maplibregl.Marker({ element: pin, draggable: true });
  const set = (lng: number, lat: number) => {
    marker.setLngLat([lng, lat]).addTo(map);
    $('lng').value = lng.toFixed(6); $('lat').value = lat.toFixed(6);
    const f = regions.sgg.features.find((x) => inGeom([lng, lat], x.geometry));
    const p = f?.properties as { sidonm?: string; sggnm?: string } | undefined;
    $('sido').value = p?.sidonm ?? ''; $('sgg').value = p?.sggnm ?? '';
    label.textContent = p ? `${p.sidonm} ${p.sggnm}` : '경계 밖이에요(바다·섬 근처라면 조금 옮겨 보세요)';
  };
  // 전국 보기에서 처음 찍으면 그 자리로 확대해 준다. 핀은 끌어서 옮길 수 있다.
  map.on('click', (e) => { set(e.lngLat.lng, e.lngLat.lat); if (map.getZoom() < 10) map.easeTo({ center: e.lngLat, zoom: 13, duration: 600 }); });
  marker.on('dragend', () => { const ll = marker.getLngLat(); set(ll.lng, ll.lat); });
  if ($('lng').value) { const lng = +$('lng').value, lat = +$('lat').value; map.once('load', () => { set(lng, lat); map.jumpTo({ center: [lng, lat], zoom: 13 }); }); }
  form.addEventListener('submit', (e) => { if (!$('lng').value) { e.preventDefault(); label.textContent = '지도에서 위치를 찍어 주세요.'; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });

  // 사진
  const list = document.getElementById('photo-list')!;
  const status = document.getElementById('photo-status')!;
  const store = form.elements.namedItem('photos') as HTMLTextAreaElement;
  let urls = store.value.split('\n').filter(Boolean);
  const draw = () => {
    store.value = urls.join('\n');
    list.innerHTML = urls.map((u, i) => `<li class="relative aspect-square overflow-hidden rounded-[2px] bg-[var(--color-linen)]">
      <img src="${u}" alt="" class="size-full object-cover" />
      ${i === 0 ? '<span class="absolute top-1 left-1 bg-[var(--color-paper)] px-1.5 text-[11px]">대표</span>' : `<button type="button" data-first="${i}" class="absolute top-1 left-1 bg-[var(--color-paper)] px-1.5 text-[11px]">대표로</button>`}
      <button type="button" data-rm="${i}" aria-label="사진 빼기" class="absolute top-1 right-1 grid size-6 place-items-center bg-[var(--color-paper)] text-[13px]">×</button></li>`).join('');
  };
  list.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.dataset.rm) { urls.splice(+t.dataset.rm, 1); draw(); }
    if (t.dataset.first) { const [u] = urls.splice(+t.dataset.first, 1); urls.unshift(u); draw(); }
  });
  draw();

  const url = import.meta.env.PUBLIC_SUPABASE_URL, key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const input = document.getElementById('photo-input') as HTMLInputElement;
  if (!url || !key) { input.disabled = true; status.textContent = 'Supabase 설정 전이라 사진을 올릴 수 없어요.'; return; }
  const sb = createBrowserClient(url, key);
  input.addEventListener('change', async () => {
    const files = [...(input.files ?? [])];
    for (const [i, file] of files.entries()) {
      if (urls.length >= 12) { status.textContent = '사진은 12장까지예요.'; break; }
      status.textContent = `올리는 중… ${i + 1}/${files.length}`;
      try {
        const blob = await shrink(file, 1600);
        const path = `${crypto.randomUUID()}.webp`;
        const { error } = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
        if (error) throw error;
        urls.push(sb.storage.from('photos').getPublicUrl(path).data.publicUrl); draw();
      } catch (err) { status.textContent = `올리지 못했어요: ${(err as Error).message}`; return; }
    }
    status.textContent = ''; input.value = '';
  });
}

async function shrink(file: File, max: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = new OffscreenCanvas(Math.round(bmp.width * k), Math.round(bmp.height * k));
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.convertToBlob({ type: 'image/webp', quality: 0.82 });
}
