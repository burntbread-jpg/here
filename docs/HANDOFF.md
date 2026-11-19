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
| 2026-11-19 | GitHub 연결: `burntbread-jpg/here` (비공개) |
| 2026-11-19 | 홈 지도는 **시안 B**(음절 · 행정 묶음). A·C 중 C는 '코스' 탭으로 남김 |
| 2026-11-19 | 코스 탭의 선은 **작성자가 원해서 직접 등록한 코스만** 그린다. 같은 날·같은 작성자 자동 연결은 하지 않음 |
| 2026-11-19 | 인증은 **Supabase**. 연결은 나중에(사용자가 추가) |
| 2026-11-19 | 분류 **9칸**(맛·쉼·멋·책·길·잠·흥·몸·삶) + 속성 태그(실속·꿀팁·계절) 확정 |
| 2026-11-19 | 편집자는 **다른 사람의 글을 수정·삭제할 수 없다**(관리자만 가능) |
| 2026-11-19 | 글씨체 **② 함렛** 확정(제목·음절·숫자). 크림 대신 다른 바탕색 후보 요청 → 5개 시안 |
| 2026-11-19 | 바탕색 **한지**(#F4F4F1, 땅 #FFFFFF) 확정, `design/b-refine` → main 병합 |
| 2026-11-19 | Supabase 프로젝트 `olbwwfnxcoecxtoukhyz` 제공. 장소 목록·상세 페이지 추가, 시안 A 삭제, 코스 탭 `/course` 로 이동 |
| 2026-11-19 | 편집 화면: 장소 쓰기·고치기·지우기, 사진 올리기, 계정 관리. 본문은 HTML이 아닌 일반 글자로 저장 |
| 2026-11-19 | 사용자 피드백: "ELSEWHERE보다 감도가 떨어진다", "글씨체가 마음에 안 든다" → ELSEWHERE 톤으로 다듬고 글씨체 후보 3개 제시 |

## 4. 사용자 선택을 기다리는 것

1. 한글 보조 문구(지금은 헤더에서 뺐음)
2. 각 분류의 작성 가이드라인(사용자가 나중에 줄 예정)
3. Supabase 프로젝트 연결(사용자가 나중에 추가)

## 5. 현재 상태

- Astro 7 + Tailwind 4 + MapLibre 6. ELSEWHERE(Astro 5)와 같은 계열이지만, 새 프로젝트라 최신 판을 썼다.
- `/` 홈 지도, `/places` 목록, `/place/[id]` 상세, `/course` 코스, `/admin` 편집 입구. docs/DATA.md
- 디자인 점검(Impeccable·Taste) 실행 완료 — 결과와 오탐 정리는 docs/DESIGN_AUDIT.md.
- 장소 데이터는 전부 **샘플**(`src/data/sample-places.json`, 생성 스크립트 `scripts/make_sample_places.py`). 실제 장소·사진 없음. 썸네일은 분류색 그라데이션 자리표시.
- 로그인 코드는 있음(Supabase Google). anon 키·DB 설정 전이라 실제로는 동작하지 않음.
- 행정구역 경계: SGIS → vuski/admdongkor 2026-10-01 판(CC BY 4.0). docs/MAP.md.

## 6. 다음 할 일 (시안 확정 후)

1. Supabase 설정(사용자): docs/AUTH.md §5 의 1–5단계, anon 키를 Vercel·로컬 `.env`에
2. **`here` 클라우드 환경으로 새 세션을 시작**해 실제 로그인·저장·사진 올리기를 시험(이 세션은 기본 환경이라 Supabase 접속 불가)
3. 코스 만들기·고치기 화면(작성자가 장소를 골라 순서대로 잇기)
4. Vercel 연결과 Deploy Hook(`VERCEL_DEPLOY_HOOK_URL`)
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
src/scripts/map/home-map.ts    홈 지도
src/scripts/map/course-map.ts  코스 지도
src/scripts/map/mini-map.ts    상세의 작은 지도
src/lib/data.ts                데이터 읽기(Supabase 공개 뷰 또는 샘플)
src/lib/supabase.ts            로그인용 서버 클라이언트
src/components/MapShell.astro  지도 + 패널/시트 골격
src/lib/auth/roles.ts          역할·권한 판단
supabase/migrations/           DB 스키마 + RLS (배포 연결 때 적용)
public/geo/                    시·도, 시·군·구 GeoJSON
scripts/                       경계 변환, 샘플 생성, 스크린샷
docs/                          모든 결정·설계 문서
```
