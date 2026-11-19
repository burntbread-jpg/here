# 데이터 흐름

```
[편집자] → /admin (서버 함수, Supabase Auth) → Supabase 테이블 places·courses·course_stops (RLS)
                                                        │ 공개 뷰 public_* (공개된 글만, 이메일 제외)
[빌드: Vercel] src/lib/data.ts  ←───────────────────────┘   (키가 없으면 src/data/sample-places.json)
      ├─ /places, /places/[분류]   목록 (정적)
      ├─ /place/[id]               장소 상세 (정적, 장소마다 한 장)
      └─ /data/places.json         지도용 가벼운 데이터 (본문 제외)
                                     ↑ 홈 지도(/), 코스 지도(/course)가 브라우저에서 읽음
```

## 주소

| 주소 | 내용 |
|---|---|
| `/` | 3D 홈(한지 바느질 지도) |
| `/map` | 지도(시·도 → 시·군·구 → 장소), `?sido=` 로 지역 바로 열기 |
| `/places` | 모든 곳 목록, 지역 거르기 |
| `/places/eat` … `/places/life` | 분류별 목록(주 분류 + 보조 분류 포함) |
| `/place/[id]` | 장소 상세: 분류, 지역·날짜·쓴 사람, 사진, 본문, 작은 지도, 속한 코스, 같은 시·군·구의 다른 곳 |
| `/course` | 코스 지도. `?c=코스ID`로 특정 코스를 열 수 있다. 선택된 코스의 번호를 누르면 장소 상세로 |
| `/admin` | 편집 입구(로그인, 내 장소 목록) |
| `/admin/places/new`, `/admin/places/[id]` | 장소 쓰기·고치기 |
| `/admin/members` | 계정 관리(관리자) |

## 사진

원본은 Supabase Storage, 방문자에게는 빌드 때 만든 사본(썸네일 320, 상세 1600)이 나간다. 자세한 내용은 docs/OPERATIONS.md §1.

## 장소 필드

`src/lib/data.ts`의 `Place`. DB 열 이름과의 대응: `primary_cat → primary`, `visited_on → date`, `author_name → author`, 코스는 `course_stops`에서 `course`, `order`로 붙는다.
