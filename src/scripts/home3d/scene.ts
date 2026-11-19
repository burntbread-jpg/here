// HERE 3D 홈 — "한지 바느질 지도"
//
// · 한반도의 시·도를 한지 여러 장을 겹쳐 쌓은 종이 모형으로 만든다. 장소가 많은 곳일수록 높이 쌓인다(등고선 모형처럼).
// · 장소는 종이에 바늘로 찍은 매듭(분류 색), 코스는 청실·홍실로 꿰맨 홈질(running stitch)이다. '찍고 잇는다'를 손으로 하는 일로.
// · 낮: 창으로 들어온 볕 아래의 한지. 밤: 종이 안쪽에서 등불이 비치고 매듭이 빛난다.
// 데이터는 지도와 같은 /data/places.json, 경계는 /geo/sido.geojson.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { hanjiTextures } from './paper';
import { PLACES, COURSES, CAT, loadData, type Place } from '../map/places';
import { shortSido } from '../../lib/regions';

type Mode = 'day' | 'night';
const K = 9;                       // 경위도 1도 ≈ K 단위
const COS = Math.cos((36.2 * Math.PI) / 180);
const T = 0.15;                    // 한지 한 장 두께(실제보다 과장)
const proj = (lng: number, lat: number) => ({ x: (lng - 127.75) * COS * K, y: (lat - 36.0) * K }); // y = 북쪽(도형 평면)
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const easeInOut = (t: number) => { t = Math.min(1, Math.max(0, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const THREADS = ['#A8322A', '#284A8E', '#B8892B', '#3F6B4A']; // 홍실·청실·금사·녹사

interface Stack { name: string; group: THREE.Group; layers: THREE.Mesh[]; top: number; lift: number; vel: number; liftTo: number; dim: number; dimTo: number; label: HTMLAnchorElement; center: THREE.Vector3; places: Place[]; w: number }

export async function initHome3D(host: HTMLElement, opts: { mode: Mode; reduced: boolean; intro?: boolean; frame?: number; onReady?: () => void; onHint?: (text: string | null) => void }) {
  const [sido] = await Promise.all([fetch('/geo/sido.geojson').then((r) => r.json()) as Promise<GeoJSON.FeatureCollection>, loadData()]);
  const isSmall = matchMedia('(max-width: 767.98px)').matches;

  // ── 렌더러·장면 ─────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall ? 1.5 : 1.75));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap; // 가장자리가 부드러운 그림자
  renderer.toneMapping = THREE.NeutralToneMapping; // 한지의 흰색이 회색으로 바래지 않게
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isSmall ? 38 : 28, host.clientWidth / host.clientHeight, 0.1, 600);
  // 지도 칸 가운데에 한반도를 둔다(소개 글은 별도 칸이라 겹치지 않음)
  const home = { pos: new THREE.Vector3(isSmall ? 1.2 : 4, isSmall ? 41 : 40, isSmall ? 32 : 50), target: new THREE.Vector3(isSmall ? 0.4 : 1.8, 0, isSmall ? 2.5 : 3) };
  camera.position.copy(home.pos).add(new THREE.Vector3(0, 30, 18));

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(home.target);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 10; controls.maxDistance = 110;
  controls.minPolarAngle = 0.25; controls.maxPolarAngle = 1.12;
  controls.minAzimuthAngle = -0.75; controls.maxAzimuthAngle = 0.75;
  controls.rotateSpeed = 0.5; controls.zoomSpeed = 0.7;

  // ── 빛 ───────────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight('#ffffff', '#cfc8b8', 0.85);
  const sun = new THREE.DirectionalLight('#fff0dc', 2.9);
  sun.position.set(-44, 26, -6); // 낮게 깔린 늦은 오후 볕 → 종이 층마다 긴 그림자
  sun.castShadow = true;
  sun.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 160 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 9; sun.shadow.blurSamples = 16;
  const fill = new THREE.DirectionalLight('#dfe6ff', 0.35); fill.position.set(30, 20, -10);
  scene.add(hemi, sun, sun.target, fill);

  // ── 한지 ─────────────────────────────────────────────────
  const tex = hanjiTextures(1024, 11);
  const sheetTex = (rep: number) => { const m = tex.map.clone(); m.repeat.set(rep, rep); m.needsUpdate = true; const b = tex.bump.clone(); b.repeat.set(rep, rep); b.needsUpdate = true; return { m, b }; };
  const st = sheetTex(0.09);
  const tones = ['#FBFAF5', '#F3F0E7', '#F8F6EF', '#EEEAE0', '#FFFEFA'];
  const sheetMats = tones.map((c) => new THREE.MeshStandardMaterial({ color: c, map: st.m, bumpMap: st.b, bumpScale: 0.6, roughness: 0.93, metalness: 0, emissive: '#ffb066', emissiveMap: st.m, emissiveIntensity: 0 }));

  const tt = sheetTex(0.05);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#E6E2D9', map: tt.m, bumpMap: tt.b, bumpScale: 0.5, roughness: 1 }));
  table.rotation.x = -Math.PI / 2; table.position.y = -0.002; table.receiveShadow = true;
  scene.add(table);

  // ── 시·도 쌓기 ────────────────────────────────────────────
  const stacks: Stack[] = [];
  const labelHost = document.getElementById('labels')!;
  const rnd = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  const ringArea = (r: number[][]) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };

  for (const f of sido.features) {
    const pr = f.properties as { sidonm: string; lng: number; lat: number };
    const piv = proj(pr.lng, pr.lat);
    const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : (f.geometry as GeoJSON.MultiPolygon).coordinates) as number[][][][];
    const base: THREE.BufferGeometry[] = [], main: THREE.BufferGeometry[] = [];
    let mainArea = 0;
    for (const poly of polys) {
      const rings = poly.map((ring) => ring.map(([lng, lat]) => { const p = proj(lng, lat); return [p.x - piv.x, p.y - piv.y]; }));
      const area = ringArea(rings[0]);
      if (area < 0.0015 || rings[0].length < 4) continue;
      const shape = new THREE.Shape(rings[0].map(([x, y]) => new THREE.Vector2(x, y)));
      for (const h of rings.slice(1)) if (h.length > 3) shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
      const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 1 });
      base.push(g);
      if (area > 0.25) { main.push(g.clone()); mainArea += area; }
    }
    if (!base.length) continue;
    const baseGeo = mergeGeometries(base)!; baseGeo.computeVertexNormals();
    const mainGeo = main.length ? mergeGeometries(main)! : baseGeo;
    const places = PLACES.filter((p) => p.sido === pr.sidonm);
    const n = places.length;
    const L = Math.min(14, 1 + Math.round(Math.sqrt(n) * 0.95));
    const R = Math.sqrt(Math.max(mainArea, 0.5) / Math.PI);
    const group = new THREE.Group(); group.position.set(piv.x, 0, -piv.y);
    const layers: THREE.Mesh[] = [];
    for (let k = 0; k < L; k++) {
      const mat = sheetMats[(k + stacks.length) % sheetMats.length].clone(); // 더미마다 따로(흐리기·밤 밝기를 각자 조절)
      const m = new THREE.Mesh(k === 0 ? baseGeo : mainGeo, mat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = (rnd() - 0.5) * 0.012 * Math.min(1, k);
      const s = k === 0 ? 1 : Math.max(0.3, 1 - (k * 0.16 * (0.85 + rnd() * 0.3)) / R);
      m.scale.set(s, s, 1);
      m.position.set((rnd() - 0.5) * 0.04 * k, k * T, (rnd() - 0.5) * 0.04 * k);
      m.castShadow = true; m.receiveShadow = true;
      m.userData = { sido: pr.sidonm, k, finalY: k * T, finalS: s, base: mat.color.clone() };
      group.add(m); layers.push(m);
    }
    scene.add(group);
    // 라벨은 진짜 링크: 키보드(Tab)·화면 낭독기로도 시·도에 들어갈 수 있다
    const label = document.createElement('a');
    label.className = 'r3-label';
    label.href = `/map?sido=${encodeURIComponent(pr.sidonm)}`;
    label.setAttribute('aria-label', `${pr.sidonm} ${n}곳, 지도에서 보기`);
    label.innerHTML = `<b>${shortSido(pr.sidonm)}</b><span class="num">${n}</span>`;
    labelHost.appendChild(label);
    const st: Stack = { name: pr.sidonm, group, layers, top: L * T, lift: 0, vel: 0, liftTo: 0, dim: 0, dimTo: 0, label, center: new THREE.Vector3(piv.x, L * T, -piv.y), places, w: 0 };
    label.addEventListener('focus', () => select(st));
    label.addEventListener('blur', () => select(null));
    label.addEventListener('mouseenter', () => select(st));
    label.addEventListener('mouseleave', () => select(null));
    stacks.push(st);
  }
  const stackOf = new Map(stacks.map((s) => [s.name, s]));

  // ── 매듭(장소) ─────────────────────────────────────────────
  // 매듭은 볼록한 실 뭉치: 납작한 구 + 그 아래 바늘구멍 그림자
  const knotGeo = new THREE.SphereGeometry(0.062, 14, 10); knotGeo.scale(1, 0.6, 1);
  const knotMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 });
  // 밤: 분류 색 그대로 빛나도록 HDR 색(1보다 큰 값)으로 칠해 bloom 이 색을 머금게 한다
  const knotGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 5), toneMapped: false });
  const knotMeshes: THREE.InstancedMesh[] = [];
  const knotOf = new Map<string, THREE.Vector3>();
  for (const s of stacks) {
    if (!s.places.length) continue;
    const inst = new THREE.InstancedMesh(knotGeo, knotMat, s.places.length);
    inst.castShadow = true;
    const mtx = new THREE.Matrix4(), col = new THREE.Color();
    s.places.forEach((p, i) => {
      const q = proj(p.lng, p.lat);
      const local = new THREE.Vector3(q.x - s.group.position.x, s.top + 0.04, -q.y - s.group.position.z);
      mtx.makeRotationY(rnd() * Math.PI); mtx.setPosition(local); inst.setMatrixAt(i, mtx);
      inst.setColorAt(i, col.set(CAT[p.primary].ink));
      knotOf.set(p.id, local.clone().add(s.group.position));
    });
    inst.userData = { knots: true, stack: s }; knotMeshes.push(inst);
    s.group.add(inst);
  }

  // ── 실(코스): 청실·홍실 홈질 ─────────────────────────────────
  // 정류장 사이를 종이 위로 올라왔다(보이는 땀) 내려갔다(종이 밑) 하는 짧은 아치로 꿰맨다.
  interface Seam { stitches: THREE.Mesh[]; path: THREE.Vector3[]; sido: string; color: string }
  const seams: Seam[] = [];
  COURSES.forEach((c, ci) => {
    const stops = PLACES.filter((p) => p.course === c.id).sort((a, b) => a.order! - b.order!);
    const pts = stops.map((p) => knotOf.get(p.id)).filter(Boolean) as THREE.Vector3[];
    if (pts.length < 2) return;
    const color = THREADS[ci % THREADS.length];
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, emissive: color, emissiveIntensity: 0 });
    const curve = new THREE.CatmullRomCurve3(pts.map((v) => v.clone().setY(v.y - 0.01)), false, 'centripetal', 0.3);
    const total = curve.getLength();
    const stitchLen = 0.15, gap = 0.07;
    const stitches: THREE.Mesh[] = [];
    for (let d = 0.02; d + stitchLen < total; d += stitchLen + gap) {
      const a = curve.getPointAt(d / total), b = curve.getPointAt((d + stitchLen) / total);
      const mid = a.clone().lerp(b, 0.5); mid.y += 0.055;
      const arc = new THREE.QuadraticBezierCurve3(a.clone().setY(a.y - 0.01), mid, b.clone().setY(b.y - 0.01));
      const m = new THREE.Mesh(new THREE.TubeGeometry(arc, 8, 0.019, 6, false), mat);
      m.castShadow = true; m.visible = opts.reduced;
      scene.add(m); stitches.push(m);
    }
    // 정류장마다 실을 한 바퀴 감아 매듭지은 고리
    for (const v of pts) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 6, 24), mat);
      ring.rotation.x = -Math.PI / 2; ring.position.copy(v).setY(v.y - 0.01); ring.castShadow = true; ring.visible = opts.reduced;
      scene.add(ring); stitches.push(ring);
    }
    seams.push({ stitches, path: curve.getSpacedPoints(200), sido: stops[0].sido, color });
  });

  // 바늘: 가늘고 길게, 귀에 실을 꿴 모양
  const needle = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.0015, 0.62, 10), new THREE.MeshStandardMaterial({ color: '#d9dade', metalness: 1, roughness: 0.22 }));
  shaft.position.y = 0.31;
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 14), shaft.material); eye.position.y = 0.6;
  needle.add(shaft, eye); needle.scale.setScalar(1.7); needle.visible = false; shaft.castShadow = true;
  scene.add(needle);

  // ── 공기 중의 닥섬유 먼지(밤에는 반딧불) ─────────────────────
  const dustN = isSmall ? 160 : 320;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (rnd() - 0.5) * 70; dustPos[i * 3 + 1] = 0.5 + rnd() * 14; dustPos[i * 3 + 2] = (rnd() - 0.5) * 70; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  { const g = dot.getContext('2d')!; const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const dustMat = new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, color: '#b9ae98', opacity: 0.35 });
  const dust = new THREE.Points(dustGeo, dustMat); scene.add(dust);

  // ── 낮 / 밤 ───────────────────────────────────────────────
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(host.clientWidth, host.clientHeight), 1.05, 0.42, 0.6);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  let mode: Mode = opts.mode;
  const maxCount = Math.max(...stacks.map((s) => s.places.length), 1);
  function applyMode(m: Mode) {
    mode = m;
    const night = m === 'night';
    scene.background = new THREE.Color(night ? '#121211' : '#F1F0EB');
    scene.fog = new THREE.Fog(night ? '#121211' : '#F1F0EB', 80, 190);
    hemi.color.set(night ? '#6d7a99' : '#ffffff'); hemi.groundColor.set(night ? '#0b0b0a' : '#cfc8b8'); hemi.intensity = night ? 0.2 : 0.85;
    sun.color.set(night ? '#9fb2e6' : '#fff0dc'); sun.intensity = night ? 0.35 : 2.9;
    fill.intensity = night ? 0.05 : 0.35;
    (table.material as THREE.MeshStandardMaterial).color.set(night ? '#1b1a17' : '#E6E2D9');
    // 밤: 장소가 많은 곳일수록, 위쪽 장일수록 종이 안에서 등불이 비친다
    for (const s of stacks) {
      const glow = Math.pow(s.places.length / maxCount, 0.85);
      s.layers.forEach((l, k) => {
        (l.material as THREE.MeshStandardMaterial).emissiveIntensity = night ? (0.006 + glow * 0.34) * (0.25 + 0.75 * Math.pow(k / Math.max(1, s.layers.length - 1), 1.4)) : 0;
      });
    }
    knotMeshes.forEach((k) => (k.material = night ? knotGlow : knotMat));
    seams.forEach((sm) => sm.stitches.forEach((x) => ((x.material as THREE.MeshStandardMaterial).emissiveIntensity = night ? 0.9 : 0)));
    dustMat.color.set(night ? '#ffd28a' : '#b9ae98'); dustMat.opacity = night ? 0.85 : 0.35; dustMat.size = night ? 0.16 : 0.12;
    renderer.toneMappingExposure = night ? 1.1 : 1.0;
    document.documentElement.dataset.scene = m;
  }
  applyMode(mode);

  // ── 등장: 한지가 한 장씩 내려앉고, 바늘이 코스를 꿰맨다 ──────────
  const t0 = performance.now();
  let tour = !opts.reduced && opts.intro !== false;
  const settleFrom = !opts.reduced && !tour ? performance.now() : 0; // 다시 온 방문: 0.6초 만에 자리 잡기
  const allLayers = stacks.flatMap((s) => s.layers.map((l) => ({ l, s })));
  if (tour) for (const { l } of allLayers) { l.visible = false; }
  const dropStart = (s: Stack, k: number) => 0.15 + (stacks.indexOf(s) % 16) * 0.07 + k * 0.11;
  const SEW_FROM = 3.2, SEW_DUR = 4.6;
  const sewSeam = seams[0];
  const seoul = sewSeam ? stackOf.get(sewSeam.sido)!.center.clone() : new THREE.Vector3();
  const sewMid = sewSeam ? sewSeam.path[Math.floor(sewSeam.path.length / 2)].clone() : seoul;
  const closeCam = { pos: sewMid.clone().add(new THREE.Vector3(2.4, 6.4, 7.2)), target: sewMid.clone() };
  const stopTour = () => { if (!tour) return; tour = false; knotMat.transparent = false; knotMat.opacity = 1; knotMat.depthWrite = true; knotGlow.transparent = false; knotGlow.opacity = 1; knotGlow.depthWrite = true; knotGlow.color.setScalar(5); knotMeshes.forEach((k) => (k.visible = true)); for (const { l } of allLayers) { l.visible = true; l.position.y = l.userData.finalY; (l.rotation as THREE.Euler).x = -Math.PI / 2; } seams.forEach((sm) => sm.stitches.forEach((x) => (x.visible = true))); needle.visible = false; };
  renderer.domElement.addEventListener('pointerdown', stopTour);
  renderer.domElement.addEventListener('wheel', stopTour, { passive: true });

  function intro(t: number) {
    // 1) 한지 내려앉기 (0–3초)
    for (const { l, s } of allLayers) {
      const k = l.userData.k as number, st0 = dropStart(s, k), p = (t - st0) / 0.55;
      l.visible = p > 0;
      l.position.y = l.userData.finalY + (1 - ease(p)) * 2.4;
      (l.rotation as THREE.Euler).x = -Math.PI / 2 + (1 - ease(p)) * 0.08;
    }
    for (const k of knotMeshes) { const s = k.userData.stack as Stack; k.visible = t > dropStart(s, s.layers.length - 1) + 0.5; }
    // 2) 카메라: 전체 → 첫 코스로 내려가 꿰매는 것을 보고 → 다시 전체
    const back = home;
    if (t < SEW_FROM - 0.6) { camera.position.lerpVectors(back.pos.clone().add(new THREE.Vector3(0, 30, 18)), back.pos, easeInOut(t / (SEW_FROM - 0.6))); controls.target.copy(back.target); }
    else if (t < SEW_FROM + 0.8) { const p = easeInOut((t - SEW_FROM + 0.6) / 1.4); camera.position.lerpVectors(back.pos, closeCam.pos, p); controls.target.lerpVectors(back.target, closeCam.target, p); }
    else if (t < SEW_FROM + SEW_DUR + 0.2) { const p = (t - SEW_FROM - 0.8) / (SEW_DUR - 0.6); camera.position.copy(closeCam.pos).add(new THREE.Vector3(Math.sin(p * 1.2) * 0.8, -p * 0.5, -p * 0.4)); controls.target.copy(closeCam.target); }
    else { const p = easeInOut((t - SEW_FROM - SEW_DUR - 0.2) / 2.2); camera.position.lerpVectors(closeCam.pos.clone().add(new THREE.Vector3(Math.sin(1.2) * 0.8, -0.5, -0.4)), back.pos, p); controls.target.lerpVectors(closeCam.target, back.target, p); if (p >= 1) stopTour(); }
    // 꿰매는 동안에는 다른 매듭을 옅게 해서 실이 보이게 한다
    const focus = Math.min(easeInOut((t - SEW_FROM + 0.4) / 0.8), 1 - easeInOut((t - SEW_FROM - SEW_DUR) / 1.2));
    const op = 1 - 0.78 * Math.max(0, focus);
    knotMat.transparent = op < 0.999; knotMat.opacity = op; knotMat.depthWrite = op > 0.999;
    knotGlow.transparent = knotMat.transparent; knotGlow.opacity = op; knotGlow.depthWrite = knotMat.depthWrite;
    knotGlow.color.setScalar(5 * (0.12 + 0.88 * op)); // 밤에는 밝기도 낮춰 실을 돋보이게
    // 3) 꿰매기: 첫 코스는 바늘이 따라가며, 나머지 코스는 같은 속도로 함께 나타난다
    for (const sm of seams) {
      const p = Math.min(1, Math.max(0, (t - SEW_FROM) / SEW_DUR));
      const n = Math.floor(p * sm.stitches.length);
      sm.stitches.forEach((x, i) => (x.visible = i < n));
      if (sm === sewSeam) {
        needle.visible = p > 0 && p < 1;
        const i = Math.min(sm.path.length - 2, Math.floor(p * (sm.path.length - 1)));
        const a = sm.path[i], b = sm.path[i + 1];
        const bob = Math.abs(Math.sin(p * sm.stitches.length * Math.PI)); // 땀마다 종이를 뚫고 들어갔다 나온다
        needle.position.set(a.x, a.y - 0.12 + bob * 0.16, a.z);
        needle.lookAt(b.x, a.y + 2, b.z); needle.rotateX(Math.PI / 2 - 0.55);
      }
    }
  }

  // ── 고르기: 시·도 위에 올리면 그 더미가 들리고, 누르면 지도로 ─────────
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2(); let hovered: Stack | null = null; let downAt = { x: 0, y: 0 };
  const hit = (e: PointerEvent) => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const h = ray.intersectObjects(stacks.flatMap((s) => s.layers), false)[0];
    return h ? stackOf.get(h.object.userData.sido) ?? null : null;
  };
  // 고르기(마우스 올리기·키보드 포커스·첫 번째 터치 공통): 그 더미를 들어 올리고 나머지는 살짝 흐리게
  function select(s: Stack | null) {
    if (s === hovered) return;
    if (hovered) { hovered.liftTo = 0; hovered.label.classList.remove('is-on'); }
    hovered = s;
    for (const x of stacks) x.dimTo = s && x !== s ? 1 : 0;
    labelHost.classList.toggle('has-on', !!s);
    if (s) { s.liftTo = 0.62; s.label.classList.add('is-on'); }
  }
  let armed: Stack | null = null; // 터치: 한 번 누르면 고르고, 같은 곳을 한 번 더 누르면 들어간다
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (tour || e.pointerType !== 'mouse') return;
    const s = hit(e);
    select(s);
    renderer.domElement.style.cursor = s ? 'pointer' : 'grab';
  });
  renderer.domElement.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') select(null); });
  renderer.domElement.addEventListener('pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY }));
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
    const s = hit(e);
    const go = (x: Stack) => (location.href = `/map?sido=${encodeURIComponent(x.name)}`);
    if (e.pointerType !== 'touch') { if (s) go(s); return; }
    if (s && armed === s) { go(s); return; }
    armed = s; select(s);
    opts.onHint?.(s ? `${s.name} ${s.places.length}곳 · 한 번 더 누르면 지도로 들어가요` : null);
  });

  // ── 그리기 ────────────────────────────────────────────────
  const v = new THREE.Vector3();
  let last = performance.now();
  const perf = { n: 0, sum: 0 };
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // ?frame=초: 등장 장면을 그 시점에 멈춰 그린다(스크린샷·검수용)
    const t = opts.frame ?? (now - t0) / 1000;
    if (tour) { intro(t); camera.lookAt(controls.target); } else controls.update();
    if (settleFrom) { const p = ease((now - settleFrom) / 600); if (p < 1) camera.position.lerpVectors(home.pos.clone().add(new THREE.Vector3(0, 5, 4)), home.pos, p); }
    const placed: { x: number; y: number; w: number }[] = [];
    // 라벨 겹침: 장소가 많은 시·도부터 자리를 차지하고, 겹치는 작은 라벨은 숨긴다(포커스·선택 시에는 보임)
    const order = stacks.slice().sort((a, b) => b.places.length - a.places.length);
    for (const s of order) {
      // 들어 올리기는 스프링(살짝 넘쳤다가 자리 잡음). 동작 줄이기면 바로 이동
      if (opts.reduced) { s.lift = s.liftTo; s.vel = 0; }
      else for (let i = 0; i < 2; i++) { const h = dt / 2; s.vel += (170 * (s.liftTo - s.lift) - 18 * s.vel) * h; s.lift += s.vel * h; }
      s.group.position.y = s.lift;
      s.dim += (s.dimTo - s.dim) * Math.min(1, dt * 10);
      if (Math.abs(s.dim - s.dimTo) > 0.001 || s.dimTo) for (const l of s.layers) (l.material as THREE.MeshStandardMaterial).color.copy(l.userData.base).multiplyScalar(1 - 0.1 * s.dim);
      v.copy(s.center).setY(s.top + s.lift + 0.25).project(camera);
      const x = (v.x * 0.5 + 0.5) * host.clientWidth, y = (-v.y * 0.5 + 0.5) * host.clientHeight;
      s.label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      s.w ||= s.label.offsetWidth;
      const clash = placed.some((q) => Math.abs(q.x - x) < (q.w + s.w) / 2 + 4 && Math.abs(q.y - y) < 20);
      const show = v.z < 1 && (!tour || t > 2.6);
      s.label.classList.toggle('is-hidden', !show || (clash && s !== hovered));
      if (show && !clash) placed.push({ x, y, w: s.w });
    }
    // 먼지는 아주 천천히 떠다닌다
    const pos = dustGeo.attributes.position as THREE.BufferAttribute;
    if (!opts.reduced) for (let i = 0; i < dustN; i++) {
      let y = pos.getY(i) + dt * (mode === 'night' ? 0.12 : 0.05);
      if (y > 15) y = 0.4;
      pos.setY(i, y); pos.setX(i, pos.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.05);
    }
    pos.needsUpdate = true;
    if (mode === 'night') composer.render(); else renderer.render(scene, camera);
    // 느린 기기: 처음 40프레임 평균이 45ms 를 넘으면 해상도와 그림자를 낮춘다
    if (perf.n < 40) { perf.sum += dt; if (++perf.n === 40 && perf.sum / 40 > 0.045 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); composer.setPixelRatio(1); sun.shadow.mapSize.set(1024, 1024); sun.shadow.map?.dispose(); sun.shadow.map = null as any; } }
    raf = requestAnimationFrame(frame);
  }
  let raf = requestAnimationFrame(frame);

  // 화면에 안 보이면 멈춘다(배터리)
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(frame); } });
  new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }).observe(host);

  if (!tour) { tour = true; stopTour(); controls.update(); }
  opts.onReady?.();
  return { setMode: applyMode, skip: stopTour };
}
