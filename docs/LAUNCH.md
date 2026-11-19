# 시범 운영 체크리스트

사용자가 직접 하는 일(계정·결제·비밀 값)과 그 순서. 끝나면 Claude에게 **배포 주소**와 **문제가 생긴 단계**를 알려 준다.
비밀 값(토큰·Secret·키)은 채팅에 붙여 넣지 않는다.

## 0. 무료 플랜 확인 (5분)
- Supabase 조직 Billing: **Free**, Compute **Nano**. 결제 수단·Add-ons 없음.
- Vercel: 가입할 때 **Hobby** 선택. Pro 체험은 시작하지 않는다.
- GitHub: Settings → Billing and licensing → Budgets 에서 Actions 예산 **$0**.

## 1. Supabase DB 만들기 (10분)
1. Supabase → `here` 프로젝트 → **Table Editor**. `members`, `places`, `courses` 표가 이미 있으면 GitHub 연결이 마이그레이션을 적용한 것이다 → 2로.
2. 없으면 **SQL Editor** → New query 에 아래 파일 내용을 **차례로** 붙여 넣고 Run:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_storage_and_touch.sql`
   3. `supabase/migrations/0003_free_tier_guards.sql`
3. 관리자 등록(같은 SQL Editor, 이메일·이름은 직접 입력):
   ```sql
   insert into members (email, role, name) values ('관리자 Google 이메일', 'admin', '공개 페이지에 보일 이름');
   ```

## 2. Google 로그인 켜기 (15분)
1. console.cloud.google.com → 새 프로젝트(예: `here-login`). **결제 계정은 연결하지 않는다.**
2. **APIs & Services → OAuth consent screen**: User type **External**, 앱 이름 `HERE`, 지원 이메일 입력.
   - 게시 상태는 **Testing** 그대로 두고, **Test users** 에 함께 쓸 5명의 Google 이메일을 추가한다(Testing 상태에서는 여기 등록한 사람만 로그인 가능).
3. **Credentials → Create credentials → OAuth client ID** → Application type **Web application**.
   - Authorized redirect URIs: `https://olbwwfnxcoecxtoukhyz.supabase.co/auth/v1/callback`
4. 만들어진 **Client ID**, **Client secret** 을 복사 → Supabase → **Authentication → Sign In / Providers → Google** → Enable, 붙여 넣고 Save.

## 3. Vercel 에 올리기 (10분)
1. vercel.com → GitHub 로 가입(Hobby) → **Add New → Project** → `burntbread-jpg/here` Import.
   - 저장소가 목록에 없으면 "Adjust GitHub App Permissions" 에서 이 저장소 접근을 허용.
2. Framework 는 **Astro** 로 자동 인식. Build Command 는 그대로(`pnpm build`).
3. **Environment Variables**:
   | 이름 | 값 |
   |---|---|
   | `PUBLIC_SUPABASE_URL` | `https://olbwwfnxcoecxtoukhyz.supabase.co` |
   | `PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys 의 anon(public) 또는 Publishable 키 |
4. **Deploy**. 끝나면 주소(예: `here-xxxx.vercel.app`)를 복사.
   - 이때부터 사이트는 샘플이 아니라 Supabase 의 **공개 글**을 보여 준다. 아직 글이 없으면 지도가 비어 보이는 것이 정상.

## 4. 로그인 돌아올 주소 등록 (3분)
Supabase → **Authentication → URL Configuration**
- Site URL: `https://<배포 주소>`
- Redirect URLs 추가: `https://<배포 주소>/api/auth/callback`, `http://localhost:4321/api/auth/callback`

## 5. 글 공개 → 자동 재배포 (5분)
1. Vercel → 프로젝트 → **Settings → Git → Deploy Hooks** → 이름 `publish`, 브랜치 `main` → Create → 주소 복사.
2. **Settings → Environment Variables** → `VERCEL_DEPLOY_HOOK_URL` 에 붙여 넣기(Production).
3. **Deployments → 최신 배포 → Redeploy** (환경 변수 반영).

## 6. 주 1회 백업·일시 정지 방지 (5분)
1. GitHub → `burntbread-jpg/here` → **Settings → Secrets and variables → Actions → New repository secret**
   - `SUPABASE_URL` = `https://olbwwfnxcoecxtoukhyz.supabase.co`
   - `SUPABASE_ANON_KEY` = 3-3의 키
2. **Actions → Supabase weekly → Run workflow**. 초록 체크가 뜨고 `backup` 브랜치가 생기면 성공.

## 7. 시범 운영 확인 (20분)
1. 휴대폰과 PC 에서 `https://<배포 주소>` → 3D 홈이 부드럽게 움직이는지, 낮/밤 전환.
2. `/admin` → Google 로그인 → '관리자' 로 보이는지.
3. **새 장소**: 지도에서 위치 찍기, 사진 2–3장, 공개하기 체크 → 저장.
4. 1–2분 뒤(재배포) `/places`, `/map`, 3D 홈에 나타나는지.
5. 두 번째 글을 공개한 뒤 Vercel 빌드 로그에서 사진 줄에 `reused` / `revalidated cache entry` 가 보이는지 확인(사진을 매번 다시 받지 않는지 — docs/OPERATIONS.md §1).

## 8. 함께 쓸 사람 초대
1. `/admin → 계정 관리` 에서 최대 4명 추가(이메일·이름·역할 '편집자').
2. 같은 이메일을 2-2 의 Google **Test users** 에도 추가해야 로그인할 수 있다.

## Claude 에게 알려 줄 것
- 배포 주소 → `astro.config.mjs` 의 `site` 교체, 공유 미리보기 정리
- 단계별 오류 메시지(화면 캡처 가능)
- 관리자 표시 이름 확정 여부
