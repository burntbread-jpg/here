// 한지 질감을 코드로 만든다(이미지 파일 없음). 닥섬유처럼 길고 가는 섬유가 엉킨 결.
import * as THREE from 'three';

function rand(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** 색 텍스처와 요철(bump) 텍스처를 함께 만든다 */
export function hanjiTextures(size = 1024, seed = 7) {
  const r = rand(seed);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!;
  // 바탕: 아주 옅은 얼룩(종이를 뜰 때 생기는 두께 차이)
  g.fillStyle = '#f5f3ec'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 140; i++) {
    const x = r() * size, y = r() * size, rad = 30 + r() * 160;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const a = 0.025 + r() * 0.04;
    grd.addColorStop(0, r() > 0.5 ? `rgba(255,255,250,${a})` : `rgba(214,206,190,${a})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  // 섬유: 길게 휘어진 가는 선. 이음매가 생기지 않도록 가장자리를 넘는 선은 반대편에도 그린다
  const fiber = (alpha: number, w: number, n: number, len: number) => {
    for (let i = 0; i < n; i++) {
      const x0 = r() * size, y0 = r() * size;
      const ang = r() * Math.PI * 2, L = len * (0.4 + r());
      const bend = (r() - 0.5) * 0.9;
      g.strokeStyle = r() > 0.35 ? `rgba(196,186,166,${alpha})` : `rgba(255,255,252,${alpha * 1.6})`;
      g.lineWidth = w * (0.5 + r());
      for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
        const x = x0 + dx, y = y0 + dy;
        if (x < -L || x > size + L || y < -L || y > size + L) continue;
        g.beginPath(); g.moveTo(x, y);
        g.quadraticCurveTo(x + Math.cos(ang + bend) * L * 0.5, y + Math.sin(ang + bend) * L * 0.5, x + Math.cos(ang) * L, y + Math.sin(ang) * L);
        g.stroke();
      }
    }
  };
  fiber(0.10, 0.7, 2600, 60);
  fiber(0.16, 1.1, 500, 120);
  fiber(0.22, 1.6, 60, 220);
  // 작은 티끌(닥 껍질 조각)
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(150,136,110,${0.12 + r() * 0.2})`; g.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 1.5); }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;

  // 요철: 같은 그림을 회색조로(섬유가 도드라지게)
  const b = document.createElement('canvas'); b.width = b.height = size;
  const bg = b.getContext('2d')!;
  bg.filter = 'grayscale(1) contrast(1.8)'; bg.drawImage(c, 0, 0);
  const bump = new THREE.CanvasTexture(b);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return { map, bump };
}
