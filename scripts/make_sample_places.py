"""시안용 샘플 장소 데이터를 만든다. 실제 장소가 아니다(이름은 '샘플 …').
좌표는 시·군·구 경계 안에서 무작위로 뽑는다. 결과: src/data/sample-places.json
사용: python3 -I scripts/make_sample_places.py  (shapely 필요)
"""
import json, random
from pathlib import Path
from shapely.geometry import shape, Point

root = Path(__file__).resolve().parent.parent
sgg = json.loads((root / "public/geo/sgg.geojson").read_text())["features"]
random.seed(7)
cats = ["eat", "rest", "style", "read", "walk", "stay", "play", "care", "life"]
cw = [26, 18, 9, 6, 10, 6, 6, 8, 11]
authors = ["편집자 A", "편집자 B", "편집자 C", "편집자 D", "편집자 E"]

def weight(f):
    p = f["properties"]
    if p["sidocd"] == "11": return 14          # 서울
    if p["sggcd"][:2] in ("26", "50"): return 4  # 부산, 제주
    if p["sidocd"] in ("31", "41", "23", "28"): return 2.5  # 경기·인천
    return 1

def rand_in(f):
    g = shape(f["geometry"]); minx, miny, maxx, maxy = g.bounds
    for _ in range(400):
        pt = Point(random.uniform(minx, maxx), random.uniform(miny, maxy))
        if g.contains(pt): return pt
    return g.representative_point()

ws = [weight(f) for f in sgg]
places = []
for i in range(420):
    f = random.choices(sgg, ws)[0]; pt = rand_in(f)
    prim = random.choices(cats, cw)[0]
    sec = random.sample([c for c in cats if c != prim], k=random.choice([0, 0, 0, 1, 1, 2]))
    tags = [t for t in ("deal", "tip", "season") if random.random() < 0.12]
    places.append({"id": f"p{i:03d}", "title": f"샘플 장소 {i+1}", "primary": prim, "secondary": sec, "tags": tags,
                   "lng": round(pt.x, 5), "lat": round(pt.y, 5), "sido": f["properties"]["sidonm"], "sgg": f["properties"]["sggnm"],
                   "author": random.choice(authors), "date": f"2026-{random.randint(1,11):02d}-{random.randint(1,28):02d}"})

# 코스: 가까운 지점을 이어 만든 샘플 경로
def course(cid, name, sido, sggs, n, author, date):
    fs = [f for f in sgg if f["properties"]["sggnm"] in sggs and f["properties"]["sidocd"] == sido]
    pts = [rand_in(random.choice(fs)) for _ in range(n)]
    # 가장 서쪽에서 출발해 가까운 곳부터 잇는다(최근접 이웃)
    pts.sort(key=lambda p: p.x); path = [pts.pop(0)]
    while pts:
        nxt = min(pts, key=lambda q: q.distance(path[-1])); pts.remove(nxt); path.append(nxt)
    pts = path
    for k, pt in enumerate(pts):
        prim = random.choices(cats, cw)[0]
        f = next(f for f in fs if shape(f["geometry"]).contains(pt)) if any(shape(f["geometry"]).contains(pt) for f in fs) else fs[0]
        places.append({"id": f"{cid}-{k}", "title": f"{name} {k+1}", "primary": prim, "secondary": [], "tags": [],
                       "lng": round(pt.x, 5), "lat": round(pt.y, 5), "sido": f["properties"]["sidonm"], "sgg": f["properties"]["sggnm"],
                       "author": author, "date": date, "course": cid, "order": k + 1})

course("c1", "샘플 코스 가", "11", ["종로구", "중구"], 6, "편집자 A", "2026-10-03")
course("c2", "샘플 코스 나", "11", ["마포구", "서대문구"], 5, "편집자 B", "2026-10-12")
course("c3", "샘플 코스 다", "11", ["성동구", "광진구"], 4, "편집자 A", "2026-10-03")
course("c4", "샘플 코스 라", "26", ["해운대구", "수영구"], 5, "편집자 C", "2026-09-20")
courses = [
    {"id": "c1", "title": "샘플 코스 가", "author": "편집자 A", "date": "2026-10-03"},
    {"id": "c2", "title": "샘플 코스 나", "author": "편집자 B", "date": "2026-10-12"},
    {"id": "c3", "title": "샘플 코스 다", "author": "편집자 A", "date": "2026-10-03"},
    {"id": "c4", "title": "샘플 코스 라", "author": "편집자 C", "date": "2026-09-20"},
]
out = root / "src/data/sample-places.json"
out.write_text(json.dumps({"_note": "시안용 샘플. 실제 장소 아님.", "places": places, "courses": courses}, ensure_ascii=False, indent=0))
print(len(places), "places")
