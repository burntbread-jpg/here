# HERE

국내의 맛·쉼·멋·길… 가까운 곳들을 **지도 위에 찍고 잇는** 기록. 해외 여행기 아카이브 [ELSEWHERE](https://elsewhere-travel-archive.vercel.app/)의 짝 사이트다.

> 상태: **초안**. 홈 지도 시안 B, 글씨체 함렛, 바탕색 한지로 결정. 지도 위 장소는 모두 **샘플 데이터**다.

## 빠른 시작

```bash
pnpm install
cp .env.example .env    # Supabase URL·anon 키 (커밋 금지). 없으면 샘플 데이터로 동작
pnpm dev                # http://localhost:4321
```

| 주소 | 내용 |
|---|---|
| `/` | 홈 지도 (`?at=seoul`: 서울 확대) |
| `/places`, `/places/[분류]` | 목록 |
| `/place/[id]` | 장소 상세 |
| `/course` | 코스 지도 (`?c=코스ID`) |
| `/admin` | 편집 입구 (Supabase Google 로그인) |

데이터 흐름은 [docs/DATA.md](docs/DATA.md).

스크린샷: `pnpm dev` 를 띄운 상태에서 `node scripts/screenshots.mjs` → `shots/*.png` (1440·390).

## 스택

Astro 7 + TypeScript + Tailwind 4, pnpm. 글꼴 함렛 + Pretendard + Manrope, Node 24(로컬은 22 이상). 지도는 MapLibre GL(타일 없이 행정구역 GeoJSON만으로 그린 백지도) + supercluster.
배포는 Vercel(`@astrojs/vercel`): 공개 페이지는 정적, `/admin`·`/api` 는 서버 함수. 이유는 [docs/AUTH.md](docs/AUTH.md).

## 문서

- [docs/HANDOFF.md](docs/HANDOFF.md) — **이어받는 사람은 여기부터.** 현재 상태, 결정 사항, 확인이 필요한 것
- [docs/NAMING.md](docs/NAMING.md) — 사이트 이름 후보와 결정
- [docs/CATEGORIES.md](docs/CATEGORIES.md) — 1음절 분류 가안 평가와 수정안
- [docs/MAP.md](docs/MAP.md) — 백지도, 경계 데이터 출처·라이선스, 시안 A·B·C
- [docs/AUTH.md](docs/AUTH.md) — 편집 권한(관리자·편집자) 모델과 인증 방식 비교
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — 색·글꼴·마커 규칙
- [docs/DESIGN_AUDIT.md](docs/DESIGN_AUDIT.md) — 디자인 도구 설치·점검 결과
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — 무료 운영(사진 복사, 주 1회 백업·일시 정지 방지)
- [docs/DATA.md](docs/DATA.md) — 데이터 흐름과 주소

## 데이터 출처

행정구역 경계: 통계청 통계지리정보서비스(SGIS) 행정동 경계(공공누리 제1유형)를 가공한 [vuski/admdongkor](https://github.com/vuski/admdongkor) 2026-10-01 판(CC BY 4.0). 자세한 내용은 docs/MAP.md.

## 개인 정보

편집 가능 계정 이메일은 **저장소에 커밋하지 않는다.** 로컬은 `.env`, 배포는 Vercel 환경 변수, 이후에는 Supabase `members` 테이블에만 둔다.
