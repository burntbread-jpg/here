# 인수인계 (HANDOFF)

다른 컴퓨터나 다른 AI가 이 파일만 읽고 이어서 작업할 수 있게 적는다. **사용자와는 한국어로 대화한다.**

## 1. 프로젝트 한 줄

HERE — 국내의 맛집·카페·병원·산책로·숙소·생활 정보를 지도 위에 찍고 잇는 사이트. 해외 여행기 ELSEWHERE(github.com/burntbread-jpg/elsewhere, **수정 금지·읽기 전용 참고**)의 짝.

## 2. 사용자와 합의한 작업 방식

- 디자인 변경은 **브랜치**에서 하고, **스크린샷(1440·390)** 으로 확인받은 뒤 병합한다.
- 사용자가 말하지 않은 사실은 지어내지 않는다. 모르면 **[확인 필요]** 로 표시하고 묻는다.
- 시안은 여러 개를 보여 주고 **사용자가 고른다.**
- 이메일 등 개인 정보는 저장소에 넣지 않는다(저장소도 비공개).
- 점검 스크립트(디자인 도구)는 **실행 전에 허락**을 받는다.

## 3. 결정된 것

| 날짜 | 결정 |
|---|---|
| 2026-11-19 | 이름 **HERE** (docs/NAMING.md) |
| 2026-11-19 | 저장소 **비공개** (`burntbread-jpg/here` 예정) |
| 2026-11-19 | 관리자 계정 1개 등록 — 이메일은 로컬 `.env`의 `HERE_MEMBERS`에만 있음(커밋 안 됨). 새 환경에서는 사용자에게 다시 받거나 Vercel 환경 변수에서 설정 |
| 2026-11-19 | 역할: 관리자(디자인·설정·편집자 관리) / 편집자(글·장소 작성·수정) |
| 2026-11-19 | 배포는 Vercel(연결은 나중) |
| 2026-11-19 | 지도: 타일 없는 백지도 + 직접 등록한 위치 |

## 4. 사용자 선택을 기다리는 것

1. **홈 지도 시안 A / B / C** (또는 조합) — docs/MAP.md, 스크린샷 docs/drafts/
2. **분류 수정안** 9칸(추천) / 8칸 / 원안 유지 — docs/CATEGORIES.md
   - '흥'(원안 '놀'), '몸'(원안 '봄-돌봄') 이름
3. **인증 방식**: Supabase 추천 — docs/AUTH.md §3
4. 편집자가 남의 글을 **수정**할 수 있게 할지 — docs/AUTH.md §2
5. 디자인 점검 스크립트 실행 허락 — docs/DESIGN_AUDIT.md
6. 한글 보조 문구 "여기, 가까운 곳"(임시)
7. 각 분류의 작성 가이드라인(사용자가 나중에 줄 예정)

## 5. 현재 상태

- Astro 7 + Tailwind 4 + MapLibre 6. ELSEWHERE(Astro 5)와 같은 계열이지만, 새 프로젝트라 최신 판을 썼다.
- `/drafts/a|b|c` 시안 동작. `/` 는 임시로 시안 A.
- 장소 데이터는 전부 **샘플**(`src/data/sample-places.json`, 생성 스크립트 `scripts/make_sample_places.py`). 실제 장소·사진 없음. 썸네일은 분류색 그라데이션 자리표시.
- 로그인 없음. `/admin` 은 자리만.
- 행정구역 경계: SGIS → vuski/admdongkor 2026-10-01 판(CC BY 4.0). docs/MAP.md.

## 6. 다음 할 일 (시안 확정 후)

1. 고른 시안을 `/` 로 옮기고 나머지 시안 정리, DraftBadge 삭제
2. 장소 상세(사진·글) 페이지, 목록 페이지, 코스 페이지
3. Supabase 연결 → `/admin` 편집 화면(지도에서 위치 찍기, 사진 올리기)
4. Vercel 연결, 도메인 결정 후 `astro.config.mjs` 의 `site` 교체
5. 소개 페이지에 경계 데이터 출처 표기

## 7. 실행

```bash
pnpm install && pnpm dev                    # http://localhost:4321
node scripts/screenshots.mjs                # dev 서버 띄운 상태에서 → shots/
pnpm build                                  # Vercel 출력(.vercel/output)
```

클라우드 컨테이너 메모: Playwright·Chromium 은 전역 설치본(`/opt/pw-browsers`)을 쓰고 `playwright install` 은 하지 않는다. root 로 돌기 때문에 Chromium 은 `--no-sandbox` 가 필요하다.

## 8. 파일 지도

```
src/data/categories.ts        분류 9개(음절·영문·색) + 속성 태그
src/data/sample-places.json    샘플 장소·코스
src/scripts/map/base.ts        백지도(경계, 라벨, 확대 범위) — 모든 시안 공통
src/scripts/map/variant-*.ts   시안 A·B·C
src/components/MapShell.astro  지도 + 패널/시트 골격
src/lib/auth/roles.ts          역할·권한 판단
supabase/migrations/           DB 스키마 + RLS (배포 연결 때 적용)
public/geo/                    시·도, 시·군·구 GeoJSON
scripts/                       경계 변환, 샘플 생성, 스크린샷
docs/                          모든 결정·설계 문서
```
