# 편집 권한과 인증

상태: **구조와 역할 모델만 있음.** 실제 로그인은 Vercel 배포를 연결할 때 붙인다.

## 1. 요구 사항

- 공동 작업자 최대 5명. 이메일을 '글 편집 가능 계정'으로 등록하면 편집 권한이 생긴다.
- 지금은 계정 1개(관리자)만 등록. 관리자 이메일은 사용자에게 받았고 **저장소에는 없다**(로컬 `.env`에만 있음).
- 이메일은 개인 정보 → 저장소 비공개 + 이메일은 환경 변수·DB에만.

## 2. 역할

| 할 수 있는 일 | 관리자 `admin` | 편집자 `editor` |
|---|:-:|:-:|
| 장소·코스 작성 | ● | ● |
| 내 글 수정·삭제 | ● | ● |
| 다른 사람 글 수정 | ● | ● ※ |
| 다른 사람 글 삭제 | ● | |
| 분류(이름·색·가이드) 관리 | ● | |
| 디자인 결정(홈 시안, 색·글꼴·레이아웃) | ● | |
| 사이트 설정(제목·소개·공개 여부) | ● | |
| 편집 가능 계정 추가·삭제·역할 변경 | ● | |

※ 공동 작업이라 오타 수정 등을 허용하는 쪽으로 두었다. 막고 싶으면 `src/lib/auth/roles.ts`에서 `*.update.any` 를 빼면 된다 — [확인 필요].

코드: `src/lib/auth/roles.ts` (`can(role, action)`), DB 정책: `supabase/migrations/0001_init.sql`.

## 3. 인증 방식 비교 (Vercel 배포 전제)

| 방식 | 장점 | 단점 | 적합도 |
|---|---|---|---|
| **Supabase** (Google 로그인 + Postgres + RLS + Storage) | 로그인·글 저장·사진 저장·권한 규칙을 한 곳에서. 이메일 허용 목록을 DB 행 수준 보안(RLS)으로 강제. 무료 등급으로 5명 충분. Vercel 연동 공식 지원 | 외부 서비스 하나 추가. 무료 프로젝트는 1주일 넘게 안 쓰면 일시 정지(다시 켜면 됨) | **추천** |
| Auth.js(`auth-astro`) + 이메일 허용 목록 | 로그인만 가볍게. 허용 목록을 환경 변수로 관리 | 글·사진 저장소를 따로 골라야 함(Vercel Postgres/Blob 등). 권한 규칙을 직접 짜야 함 | 보통 |
| Git 기반 CMS (Keystatic, Decap, Tina) | 글이 저장소 파일로 남아 ELSEWHERE와 같은 방식. 서버·DB 불필요 | **편집자 모두 GitHub 계정 필요** → '이메일 등록' 요구와 어긋남. 사진이 많으면 저장소가 무거워짐. 지도에서 위치 찍는 편집 화면을 만들기 어려움 | 낮음 |
| Clerk 등 로그인 전문 서비스 | 로그인 화면이 완성품, 허용 목록 기능 | 데이터 저장은 또 따로. 유료 구간 진입이 빠름 | 보통 |

**추천: Supabase.** 이번 사이트는 글보다 '장소 + 위치 + 사진'이 중심이고, 편집자가 지도에서 점을 찍어야 하므로 웹 편집 화면 + DB가 필요하다. Git 기반 방식은 ELSEWHERE에는 맞았지만 여기에는 맞지 않는다.

### 그래서 스택이 달라지는 점

ELSEWHERE는 정적 출력만 썼다. HERE는 `@astrojs/vercel` 어댑터를 붙여 **공개 페이지는 정적, `/admin`·`/api`만 서버 함수**(`export const prerender = false`)로 둔다. 공개 지도는 빌드 때 DB에서 공개 글을 읽어 정적으로 만들고, 글이 바뀌면 Vercel 재배포 훅으로 다시 만든다(또는 지도 데이터만 API로 읽음) — 배포 연결 때 결정.

## 4. 지금 상태 (초안)

- `HERE_MEMBERS="이메일:역할,…"` 환경 변수 → `parseMembers()` 로 읽음. 예시는 `.env.example`.
- `/admin` 은 서버에서만 이 값을 읽고(빌드 결과물에 이메일이 남지 않음을 확인), 등록 수만 보여 준다.

## 5. 배포 연결 때 할 일

1. Supabase 프로젝트 생성 → `supabase/migrations/0001_init.sql` 적용.
2. Supabase Auth에서 Google 로그인 켜기(Google Cloud OAuth 클라이언트 필요).
3. 첫 관리자 등록: Supabase SQL 편집기에서 `insert into members (email, role) values ('<관리자 이메일>', 'admin');` — 이메일은 대화나 저장소에 남기지 말고 대시보드에서 직접 입력.
4. Vercel 환경 변수: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용).
5. `/admin` 에 로그인 → `members`에 없는 이메일은 거부. 이후 `HERE_MEMBERS` 는 비상용으로만 남기거나 삭제.
6. 사진: Supabase Storage 버킷 `photos`(공개 읽기, 멤버만 쓰기).
