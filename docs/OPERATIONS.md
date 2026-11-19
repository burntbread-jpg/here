# 운영 — 무료로 유지하기

목표: Supabase 무료(Free) + Vercel 무료(Hobby) 안에서 운영한다(2026-11-19 사용자 요청).
한도는 바뀔 수 있으니 supabase.com/pricing, vercel.com/pricing 에서 다시 확인한다.

| 서비스 | 무료 한도(2026 기준, 요약) | HERE에서 신경 쓸 점 |
|---|---|---|
| Supabase Free | DB 500MB, 파일 1GB, 외부 전송 월 5GB, 프로젝트 2개, **7일 활동 없으면 일시 정지**, 자동 백업 없음 | 사진 전송량, 일시 정지, 백업 → 아래 1·2 |
| Vercel Hobby | 비상업적 개인 용도만. 대역폭·빌드 시간 한도 있음 | 광고·유료화 하면 Pro 필요 |
| GitHub Actions(비공개 저장소) | 월 무료 사용 시간 있음 | 주 1회 몇 분이라 충분 |

## 1. 사진은 배포할 때 사이트 안으로 복사

- 편집 화면에서 올린 사진(긴 변 1600px webp)은 Supabase Storage `photos` 버킷에 원본으로 남는다.
- **배포(빌드)할 때** `src/lib/photos.ts` 가 공개 사진을 내려받아 줄인 사본을 만든다.
  - 목록·지도용 썸네일: 320×320
  - 상세용: 가로 1600px, webp 품질 78
  - 사본은 `dist/_astro/*.webp` 로 들어가 **Vercel이 방문자에게 보낸다**. 방문자 때문에 Supabase 전송량이 늘지 않는다.
- **Supabase가 일시 정지돼도** 공개 사이트는 사진까지 정상이다. 편집 화면 로그인만 안 된다.
- 사진을 받지 못하면(지워졌거나 정지 중) 빌드는 멈추지 않고 원본 주소로 대체하며, 로그에 `[here] 사진 사본을 만들지 못해` 경고를 남긴다.
- 다시 빌드할 때는 Astro 캐시(`node_modules/.astro`)가 바뀌었는지만 확인한다(사진을 다시 받지 않음). 로컬 시험에서 확인했다.
  - Vercel이 빌드 캐시로 이 폴더를 보존하는지는 첫 배포 후 빌드 로그의 `reused/revalidated cache entry` 로 확인한다 — [확인 필요].
- 허용 호스트는 `astro.config.mjs` 의 `image.remotePatterns` 로, `PUBLIC_SUPABASE_URL` 에서 자동으로 만든다.

## 2. 주 1회 자동 작업 (`.github/workflows/supabase-weekly.yml`)

매주 월요일 03:17(한국 시간), 또는 GitHub → Actions → "Supabase weekly" → Run workflow 로 직접 실행한다.

1. Supabase 공개 뷰를 읽는다 → 프로젝트가 '활동 중'으로 유지되어 7일 일시 정지를 피한다.
2. 읽은 공개 데이터(공개 글·코스, 이메일 없음)를 **`backup` 브랜치**에 JSON으로 커밋한다. main이 아니므로 재배포가 일어나지 않는다.
3. (선택) `SUPABASE_DB_URL` 이 있으면 `pg_dump` 로 public 스키마 전체(비공개 글, 멤버 포함)를 백업한다.
   - 이메일이 들어 있으므로 **저장소에 커밋하지 않고** 90일 보관되는 Actions 아티팩트로만 남긴다.
   - 사진 파일 자체는 백업하지 않는다(Storage). 필요해지면 따로 추가.

### 설정 (사용자, 한 번만)

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

| 이름 | 값 | 필수 |
|---|---|---|
| `SUPABASE_URL` | `https://olbwwfnxcoecxtoukhyz.supabase.co` | 예 |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API 의 `anon public` 키 | 예 |
| `SUPABASE_DB_URL` | Supabase → Connect → Session pooler 연결 문자열(비밀번호 포함) | 아니오(전체 백업용) |

예약 실행은 기본 브랜치(main)에 이 파일이 있어야 돈다.

## 3. 비용이 생길 수 있는 경우

- 사진이 1GB(약 6,000장, 장당 약 170KB 기준)를 넘을 때 → 오래된 원본 정리 또는 Supabase Pro
- 광고·후원 등 수익이 생길 때 → Vercel Pro
- 새 '생각' 사이트까지 Supabase를 쓰면 무료 프로젝트 2개를 다 쓴다 → 그 사이트는 DB 없는 방식(Git + MDX) 권장

## 4. 글꼴은 쓰인 글자만

`pnpm build` = `astro build && node scripts/subset-fonts.mjs`.
빌드된 HTML·`/data/places.json`·소스의 한글 문자열에서 글자를 모아 함렛(`fonts-src/Hahmlet-Regular.woff2`, OFL, 굵기 400 고정)과 Pretendard 의 작은 판을 만든다(약 60KB + 120KB).
미리 알 수 없는 글자(편집 화면에서 새로 쓴 글)는 원래 글꼴(fontsource·pretendard 의 쪼갠 파일)로 넘어간다. 개발 서버에서는 원래 글꼴만 쓴다.

## 5. 유료로 넘어가지 않게 막기 (2026-11-19 사용자 요청)

### 코드·DB 안전장치 (`supabase/migrations/0003_free_tier_guards.sql`)
- 사진 한 장 3MB 이하, 사진 저장소 합계 **900MB** 넘으면 새 사진 올리기 거부(Free 1GB 전에 멈춤). 편집 화면에 이유를 보여 준다.
- 장소 1만 곳·코스 2천 개 상한, 본문 2만 자 상한.
- 방문자 사진은 빌드 때 사본을 만들어 Vercel 이 보낸다(Supabase 전송량 5GB 보호). Vercel 이미지 최적화(유료 계량 항목)는 쓰지 않는다.
- GitHub Actions 는 주 1회, 15분 제한.

### 계정에서 사용자가 확인할 것 (제가 접근할 수 없음)
| 서비스 | 할 것 | 하지 말 것 |
|---|---|---|
| Supabase | 조직 Billing 에서 플랜이 **Free** 인지 확인. Compute 는 **Nano**(무료) 그대로 | Pro 업그레이드, 결제 수단 등록, Add-ons(PITR·Custom domain·IPv4·Compute 업그레이드) |
| Vercel | 팀이 **Hobby** 인지 확인 | Pro 체험(Trial)·업그레이드, Speed Insights·Web Analytics 유료 사용, 광고 등 상업적 이용 |
| GitHub | Settings → Billing and licensing → Budgets 에서 Actions 예산 **$0**(사용량 다 쓰면 멈춤) | 결제 수단 등록 후 예산 해제 |
| Google Cloud | OAuth 동의 화면·클라이언트만 만든다(결제 계정 불필요) | 결제 계정(Billing) 연결, 유료 API 사용 |

무료 플랜은 결제 수단이 없으면 한도를 넘어도 청구되지 않고, 대신 기능이 제한·일시 정지된다. 결제 수단을 등록하거나 업그레이드하지 않는 것이 가장 확실한 차단이다 — 각 서비스의 현재 약관은 [확인 필요].
