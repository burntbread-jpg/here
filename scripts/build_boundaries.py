"""행정구역 경계(시·도, 시·군·구)를 지도용 GeoJSON으로 변환한다.

입력: vuski/admdongkor 의 parquet/simplified/{sido,sgg}_YYYYMMDD_light.parquet
  (원자료: 통계청 SGIS 행정동 경계, 공공누리 제1유형 / 가공물 CC BY 4.0)
출력: public/geo/sido.geojson, public/geo/sgg.geojson

사용: python3 -I scripts/build_boundaries.py <admdongkor 경로> [기준일=20261001]
geopandas, pyarrow 가 필요하다(가상환경 권장). 자세한 내용은 docs/MAP.md.
"""
import json, sys
from pathlib import Path
import geopandas as gpd

src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("../admdongkor")
ver = sys.argv[2] if len(sys.argv) > 2 else "20261001"
out = Path(__file__).resolve().parent.parent / "public" / "geo"
out.mkdir(parents=True, exist_ok=True)

def rnd(o, nd=4):
    if isinstance(o, float):
        return round(o, nd)
    if isinstance(o, (list, tuple)):
        return [rnd(x, nd) for x in o]
    return o

for level, cols, tol in [("sido", ["sidocd", "sidonm"], 0.004), ("sgg", ["sggcd", "sggnm", "sidocd", "sidonm"], 0.0015)]:
    g = gpd.read_parquet(src / "parquet" / "simplified" / f"{level}_{ver}_light.parquet").to_crs(4326)
    g["geometry"] = g.geometry.simplify(tol, preserve_topology=True)
    feats = []
    for _, r in g.iterrows():
        geom = r.geometry.__geo_interface__
        c = r.geometry.representative_point()
        props = {k: str(r[k]) for k in cols}
        props["lng"], props["lat"] = round(c.x, 4), round(c.y, 4)
        feats.append({"type": "Feature", "id": len(feats), "properties": props,
                      "geometry": {"type": geom["type"], "coordinates": rnd(geom["coordinates"])}})
    fc = {"type": "FeatureCollection",
          "source": f"SGIS 행정동 경계(공공누리 1유형) 가공: vuski/admdongkor {ver} (CC BY 4.0)",
          "features": feats}
    p = out / f"{level}.geojson"
    p.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")))
    print(level, len(feats), f"{p.stat().st_size/1024:.0f} KB")
