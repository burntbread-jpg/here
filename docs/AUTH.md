# 편집 권한과 인증

상태: **구조와 역할 모델만 있음.** 인증은 **Supabase로 결정**(2026-11-19). 연결은 사용자가 나중에 추가한다.

## 1. 요구 사항

- 공동 작업자 최대 5명. 이메일을 '글 편집 가능 계정'으로 등록하면 편집 권한이 생긴다.
- 지금은 계정 1개(관리자)만 등록. 관리자 이메일은 사용자에게 받았고 **저장소에는 없다**(로컬 `.env`에만 있음).
- 이메일은 개인 정보 → 저장소 비공개 + 이메일은 환경 변수·DB에만.

## 2. 역할

| 할 수 있는 일 | 관리자 `admin` | 편집자 `editor` |
|---|:-:|:-:|
| 장소·코스 작성 | ● | ● |
| 내 글 수정·삭제 | ● | ● |
| 다른 사람 글 수정 | ● | |
| 다른 사람 글 삭제 | ● | |
| 분류(이름·색·가이드) 관리 | ● | |
| 디자인 결정(홈 시안, 색·글꼴·레이아웃) | ● | |
| 사이트 설정(제목·소개·공개 여부) | ● | |
| 편집 가능 계정 추가·삭제·역할 변경 | ● | |

편집자는 **자기 글만** 수정·삭제한다(2026-11-19 사용자 결정). 코스와 코스 정류장(장소 사이의 연결)도 그 코스를 만든 작성자만 바꿀 수 있다.

코드: `src/lib/auth/roles.ts` (`can(role, action)`), DB 정책: `supabase/migrations/0001_init.sql`.

## 3. 인증 방식 비교 (Vercel 배포 전제)

| 방식 | 장점 | 단점 | 적합도 |
|---|---|---|---|
| **Supabase** (Google 로그인 + Postgres + RLS + Storage) | 로그인·글 저장·사진 저장·권한 규칙을 한 곳에서. 이메일 허용 목록을 DB 행 수준 보안(RLS)으로 강제. 무료 등급으로 5명 충분. Vercel 연동 공식 지원 | 외부 서비스 하나 추가. 무료 프로젝트는 1주일 넘게 안 쓰면 일시 정지(다시 켜면 됨) | **추천** |
| Auth.js(`auth-astro`) + 이메일 허용 목록 | 로그인만 가볍게. 허용 목록을 환경 변수로 관리 | 글·사진 저장소를 따로 골라야 함(Vercel Postgres/Blob 등). 권한 규칙을 직접 짜야 함 | 보통 |
| Git 기반 CMS (Keystatic, Decap, Tina) | 글이 저장소 파일로 남아 ELSEWHERE와 같은 방식. 서버·DB 불필요 | **편집자 모두 GitHub 계정 필요** → '이메일 등록' 요구와 어긋남. 사진이 많으면 저장소가 무거워짐. 지도에서 위치 찍는 편집 화면을 만들기 어려움 | 낮음 |
| Clerk 등 로그인 전문 서비스 | 로그인 화면이 완성품, 허용 목록 기능 | 데이터 저장은 또 따로. 유료 구간 진입이 빠름 | 보통 |

**결정: Supabase.** 이번 사이트는 글보다 '장소 + 위치 + 사진'이 중심이고, 편집자가 지도에서 점을 찍어야 하므로 웹 편집 화면 + DB가 필요하다. Git 기반 방식은 ELSEWHERE에는 맞았지만 여기에는 맞지 않는다.

### 그래서 스택이 달라지는 점

ELSEWHERE는 정적 출력만 썼다. HERE는 `@astrojs/vercel` 어댑터를 붙여 **공개 페이지는 정적, `/admin`·`/api`만 서버 함수**(`export const prerender = false`)로 둔다. 공개 지도는 빌드 때 DB에서 공개 글을 읽어 정적으로 만들고, 글이 바뀌면 Vercel 재배포 훅으로 다시 만든다(또는 지도 데이터만 API로 읽음) — 배포 연결 때 결정.

## 4. 지금 상태

- Supabase 프로젝트: `https://olbwwfnxcoecxtoukhyz.supabase.co` (2026-11-19 사용자 제공). URL은 공개 값이다.
- 코드는 연결 준비 완료, **anon 키와 DB 설정은 아직**:
  - `src/lib/supabase.ts` — 서버용 클라이언트(@supabase/ssr, 세션은 쿠키)
  - `/api/auth/signin` → Google → `/api/auth/callback` → `/admin`, `/api/auth/signout`
  - `/admin` — 로그인 → 내가 쓴 곳 목록(관리자는 전체), 새 장소, 계정 관리
  - `/admin/places/new`, `/admin/places/[id]` — 장소 쓰기·고치기·지우기(지도에서 위치 찍기, 시·도/시·군·구 자동, 사진은 브라우저에서 2000px webp로 줄여 Storage에 바로 올림)
  - `/admin/members` — 관리자만: 계정 추가·이름·역할·빼기(최대 5명, 관리자 최소 1명은 DB가 지킴)
  - 저장 API: `/api/places`, `/api/places/[id]`, `/api/places/[id]/delete`, `/api/members` — 앱에서 권한을 한 번 확인하고, DB의 RLS가 다시 막는다
  - `src/lib/data.ts` — 빌드할 때 공개 뷰에서 장소·코스를 읽는다. 키가 없거나 실패하면 샘플 데이터.
- `HERE_MEMBERS` 환경 변수 방식은 더 이상 `/admin`에서 쓰지 않는다(`roles.ts`의 `parseMembers`는 비상용으로 남김).
- 클라우드 환경: `here` 환경(개인)에 `olbwwfnxcoecxtoukhyz.supabase.co`, `api.supabase.com` 접속을 허용해 두었다(2026-11-19). 기본 환경(Default)에서는 막혀 있으므로 **새 세션을 `here` 환경으로 시작**해야 실제 로그인·조회를 시험할 수 있다.

## 5. 연결 순서 (사용자가 Supabase·Vercel 대시보드에서)

1. **DB 만들기**: Supabase → SQL Editor 에 `supabase/migrations/0001_init.sql`, 이어서 `0002_storage_and_touch.sql` 을 차례로 붙여 넣고 실행. (`api.supabase.com` 개인 액세스 토큰을 주면 Claude가 관리 API로 대신 실행할 수 있다)
2. **첫 관리자 등록**: 같은 SQL Editor에서 직접 입력(이메일은 저장소·대화에 남기지 않는다).
   `insert into members (email, role, name) values ('<관리자 이메일>', 'admin', '<표시 이름>');`
   `name`은 공개 페이지에 '쓴 사람'으로 보이는 이름이다.
3. **Google 로그인 켜기**: Google Cloud 콘솔에서 OAuth 클라이언트(웹)를 만들고, 승인된 리디렉션 URI에
   `https://olbwwfnxcoecxtoukhyz.supabase.co/auth/v1/callback` 을 넣는다. 받은 Client ID/Secret을 Supabase → Authentication → Providers → Google 에 입력.
4. **돌아올 주소 허용**: Supabase → Authentication → URL Configuration
   - Site URL: 배포 주소(예: `https://here-….vercel.app`)
   - Redirect URLs: `https://<배포 주소>/api/auth/callback`, `http://localhost:4321/api/auth/callback`
5. **키 넣기**: Supabase → Project Settings → API 의 `anon public` 키를
   - Vercel → Settings → Environment Variables: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
   - 로컬: `.env` (커밋 금지)
   `service_role` 키는 지금 단계에서 필요 없다. 쓰게 되더라도 `PUBLIC_` 이름으로 두지 않는다.
6. **사진**: `0002` 마이그레이션이 Storage 버킷 `photos`(공개 읽기, 멤버만 올리기, 8MB, jpeg·png·webp)를 만든다.
7. **글이 바뀌면 다시 빌드**: Vercel → Settings → Git → Deploy Hooks 에서 훅을 만들고, 그 주소를 Vercel 환경 변수 `VERCEL_DEPLOY_HOOK_URL`(서버 전용, `PUBLIC_` 아님)에 넣는다. 공개 글을 저장·공개·지우면 편집 화면이 자동으로 부른다.

## 6. 방문자에게 이메일이 새지 않게

- `places`·`courses`·`course_stops` 테이블은 **멤버만** 직접 읽는다(작성자 이메일 열이 있으므로).
- 방문자(anon)는 공개 뷰 `public_places`, `public_courses`, `public_course_stops`로만 읽는다. 공개된 글만, 작성자는 `members.name`(표시 이름)으로 나간다.
