# 디자인 도구 설치와 점검

## 설치 (2026-11-19, 클라우드 컨테이너)

| 도구 | 출처 (커밋) | 설치 위치 | 상태 |
|---|---|---|---|
| emil-design-eng | github.com/emilkowalski/skills `skills/emil-design-eng` (64eb3de) | `~/.claude/skills/emil-design-eng` | 설치됨 (SKILL.md 1개, 스크립트 없음) |
| Impeccable | github.com/pbakaus/impeccable `.claude/skills/impeccable` (b49177d) | `~/.claude/skills/impeccable` | 설치됨. 점검 엔진은 실행 시 GitHub 릴리스에서 바이너리를 내려받는다(체크섬 검증) — **실행 전 허락 필요** |
| Taste | github.com/Leonxlnx/taste-skill `skills/taste-skill` (f6b7657, v2.5.1) | `~/.claude/skills/taste-skill` | 설치됨 |
| Playwright MCP | npm `@playwright/mcp@0.0.84` (2주 이상 지난 판으로 고정) | 저장소 `.mcp.json` | 설정만 함. 처음 열 때 Claude Code가 승인을 묻는다 |

> 스킬은 `~/.claude/skills/`(컨테이너 홈)에 있어 **컨테이너가 사라지면 같이 사라진다.** 다른 컴퓨터에서는 위 저장소에서 다시 복사한다.

### root 컨테이너용 Chromium 래퍼

`~/.claude/bin/chromium-nosandbox` — `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome --no-sandbox "$@"` 를 실행한다.

- Taste: `CHROME_PATH=~/.claude/bin/chromium-nosandbox`
- Impeccable: 브라우저 지정 변수로 같은 래퍼를 쓴다.

### 브리프와 달라진 점

- Taste 최신판(v2.5.1)에는 브리프에 적힌 `scripts/inspect.mjs`가 **없다**. 대신 `gate.mjs`(마무리 점검), `consistency.mjs`, `perf.mjs`, `shoot.mjs` 등이 있고, 모두 `CHROME_PATH`를 읽는다.
- Impeccable 최신판의 점검(`detect`)은 Node 스크립트가 아니라 내려받는 엔진 바이너리(`scripts/impeccable` 런처)로 돌아간다. `IMPECCABLE_BROWSER` 라는 변수 이름은 이 판에서 찾지 못했다 — 실행 단계에서 확인한다.

## 점검 결과 (2026-11-19, 브랜치 `design/b-refine`)

사용자 허락 후 실행. 대상: 홈(= 시안 B) 1440·390. Impeccable 텔레메트리는 끄고 실행했다(`impeccable telemetry off`).
배포 빌드는 `.vercel/output/static` 을 로컬 정적 서버로 띄워 점검했다.

### 1차 (수정 전) → 2차 (수정 후)

| 도구 | 1차 | 2차 |
|---|---|---|
| Impeccable detect (페이지) | 경고 4: 작은 글자 대비 부족 ×3, 크림 배경 ×1 | **크림 배경 1건만 남음**(의도, 아래) |
| Impeccable detect (소스 `src/`) | 0 | 0 |
| Taste consistency | FAIL 다수 — 대부분 오탐(아래) | 실제 문제는 고침, 남은 것 정리 |
| Taste perf | JS 9.8MB — **오탐**(개발 서버의 압축 안 된 번들) | 배포 빌드 기준 JS 약 310KB(gzip) |

### 실제 문제로 보고 고친 것

- **배포 빌드에서 지도가 안 그려짐** — MapLibre 워커 경로가 깨졌다(개발 서버에서는 정상이라 놓쳤음). `setWorkerUrl` 로 해결. 점검 덕분에 찾은 가장 큰 문제.
- 작은 글자 대비 부족 — 캡션 색 `#8C867B`(3.3:1) → ELSEWHERE의 Caption `#69655F`(5:1 이상).
- 11px 미만 글자(분류 영문 10px, 모바일 지역 이름 10.5px) → 11px.
- 버튼 모양이 세 가지로 섞임(검은 알약, 반투명 알약, 꽉 찬 버튼) → 가는 선 사각 버튼 하나로 정리.
- 페이지에 h1 없음 → 화면에는 숨긴 h1 추가.
- 링크가 없는 메뉴(목록·소개 `href="#"`) → 만들어질 때까지 메뉴에서 뺌.
- 모바일 확대 버튼 29px(손가락에 작음) → 모바일에서는 숨기고 두 손가락 확대만.
- 모바일에서 원 안 지역 이름이 잘림(전남광주) → 이름을 원 아래로 뺌.
- 붙은 시·도(세종·대전·충북, 부산·울산)의 원이 겹침 → 화면 좌표에서 서로 밀어내는 배치 추가.
- 공유 메타(og:title 등) 없음 → 추가.

### 오탐·의도로 판단해 그대로 둔 것

| 항목 | 판단 |
|---|---|
| Impeccable `cream-palette` (크림 배경은 AI 기본값) | **의도.** ELSEWHERE 디자인 기준의 Paper `#F6F3ED`를 그대로 잇는 자매 사이트 정체성. 바꿀지는 관리자(사용자) 판단 |
| Taste `hero-*`, `section-height`, `one-section`, `section-gaps`, `container-edges`, `row-lines`, `cta`, `copy-actions` | 오탐. 회사 소개용 '한 화면 한 섹션' 랜딩 페이지 기준. HERE 홈은 전체 화면 지도 + 떠 있는 패널이라 섹션 구조가 없다 |
| Taste `button-styles` (지역 원도 버튼으로 셈) | 오탐. 지도 마커는 버튼 역할이지만 디자인상 버튼이 아니다 |
| Taste `shader-lint`, `effect-kind` | 오탐. MapLibre CSS와 큰 번들을 셰이더 효과로 읽음 |
| Taste perf `font files`, `CSS 522KB` | 지금은 **글씨체 후보 3벌을 모두 싣고 있어서** 크다. 하나를 고르면 줄어든다. 로컬 정적 서버는 gzip을 하지 않아 실제(Vercel)보다 크게 잡힌다 |
| Taste `cut-text "05"` | 오탐. 목록이 패널 아래에서 스크롤로 잘린 것 |
| 웹폰트 차단 | 해당 없음. 글꼴을 모두 자체 호스팅한다 |

### 남은 것 (다음 단계)

- 모바일: 시트 손잡이 높이 28px, 지도 출처 ⓘ 버튼이 작음, 제주 원이 시트에 가까움.
- 경북 이름이 원 고리 위에 겹쳐 대비가 떨어지는 경우가 있음(밀어내기 범위 조정 필요).
- 글씨체 확정 후 쓰지 않는 글꼴 제거 → 글꼴 용량 다시 측정.

### 다시 돌리는 방법

```bash
pnpm build && (cd .vercel/output/static && python3 -m http.server 4401 &)
~/.claude/skills/impeccable/scripts/impeccable detect --viewport 390x844 --json http://localhost:4401/
CHROME_PATH=~/.claude/bin/chromium-nosandbox node ~/.claude/skills/taste-skill/scripts/consistency.mjs http://localhost:4401/ --widths 1440,390 --profile .taste-skill/chrome --no-sweep --no-slow
CHROME_PATH=~/.claude/bin/chromium-nosandbox node ~/.claude/skills/taste-skill/scripts/perf.mjs http://localhost:4401/ --profile .taste-skill/chrome
```

## 3D 홈 평가 (2026-11-19, 브랜치 `feat/home-3d`)

도구: Emil(emil-design-eng 기준으로 모션·인터랙션 검토), Impeccable detect(1440·390, 낮·밤), Taste consistency·perf, Playwright MCP(접근성 스냅샷·콘솔) + Playwright 스크립트(마우스 올리기·Tab·클릭·모바일·동작 줄이기).
⚠️ Impeccable critique 는 서브 에이전트 2개로 나눠 평가하도록 되어 있으나, 사용자가 서브 에이전트를 요청하지 않아 한 맥락에서 진행(degraded).
이 컨테이너는 GPU가 없어(SwiftShader, 초당 약 1프레임) 실제 프레임 속도·부드러움은 측정하지 못했다.

### 실제 문제 (우선순위)
1. **키보드·화면 낭독기로 시·도에 들어갈 수 없음** — 핵심 동작이 캔버스에만 있음. Tab 순서에 시·도가 없고 라벨은 aria-hidden.
2. **홈이 지도 라이브러리(MapLibre)까지 내려받음** — `shortSido` 하나 때문에 `map/base.ts` 를 import → 약 290KB(gzip) 낭비.
3. **글꼴 740–790KB** — 함렛 가변 글꼴의 한글 조각을 많이 받음(22–24개 파일). 실제로 쓰는 글자만 남기는 서브셋 필요.
4. **동작 줄이기 설정에서도 먼지 입자가 계속 움직임**.
5. **등장 연출(약 10초)이 방문할 때마다 재생** — 처음 한 번은 좋지만 다시 올 때는 방해.
6. **마우스 올렸을 때 더미가 들리는 정도(0.32)가 너무 작아 거의 안 보임**, 선형 보간이라 무게감 없음.
7. **터치 기기**: 첫 탭에 바로 이동 → 무엇을 누르는지 확인할 틈이 없음.
8. **라벨 숫자 대비 부족**(종이·그림자 위 캡션색, 약 3:1).
9. **모바일 분류 범례 탭 영역 21px**(44px 권장), 서울·인천·경기 라벨 겹침.
10. 감지용 WebGL 문맥을 하나 더 만들고 해제하지 않음, 낮/밤 전환마다 재질을 복제(메모리 누수).

### 확인된 정상 동작
- 마우스 올리기: 경기 더미 강조, 커서 pointer. 클릭 → `/map?sido=경기도` 이동.
- 동작 줄이기 설정: 등장 연출 없이 완성 장면.
- 콘솔 오류 0 (GPU 성능 경고만 — SwiftShader 특성).
- Impeccable detect: 1440·390 × 낮·밤 모두 0건.

### 오탐으로 판단
- Taste `shader-lint`(three.js 내부 셰이더), `no-visual`·`overlap-text`·`collide`(라벨을 의도적으로 캔버스 위에 띄움), `hero-*`·`section-*`·`container-edges`(랜딩 페이지 규칙), `copy-headline`(h1은 숨김 처리된 사이트 제목).
- Taste perf의 전송량은 로컬 서버가 gzip을 하지 않아 실제보다 큼.

### 3D 홈 수정 결과 (10가지 모두)

| # | 문제 | 고친 방법 | 확인 |
|---|---|---|---|
| 1 | 키보드로 시·도에 못 감 | 이름표를 진짜 링크(`/map?sido=`)로, 포커스하면 그 더미가 들림. Tab 순서는 머리말·소개·범례 다음 | Tab 으로 16개 시·도 이동, Enter 로 이동 |
| 2 | 홈이 MapLibre 를 받음 | `shortSido` 를 `src/lib/regions.ts` 로 분리 | 홈 번들에 지도 라이브러리 없음 |
| 3 | 글꼴 764KB | 빌드 후 `scripts/subset-fonts.mjs` 가 쓰인 글자만 남긴 함렛·Pretendard 를 만들고 preload. 없는 글자는 원래 글꼴로 | 함렛 57KB + Pretendard 123KB + Manrope 24KB = 204KB |
| 4 | 동작 줄이기에서 먼지가 움직임 | 동작 줄이기면 입자·스프링 멈춤 | 등장 연출 없음, 입자 정지 |
| 5 | 등장 연출이 매번 | 세션당 한 번(`sessionStorage`), 다시 오면 0.6초 자리 잡기. `?intro` 로 다시 보기 | 두 번째 방문 tour 없음 |
| 6 | 들림이 미미·선형 | 0.62 높이, 스프링(k=170, c=18: 살짝 넘쳤다 자리), 나머지 더미는 10% 어둡게·이름표 흐리게 | 화면 확인 |
| 7 | 터치 첫 탭에 바로 이동 | 첫 탭은 고르기 + 안내("한 번 더 누르면 지도로"), 같은 곳 두 번째 탭에 이동. 이름표(링크)는 바로 이동 | 모바일 에뮬레이션 확인 |
| 8 | 이름표 숫자 대비 | 종이색 바탕 칩, 숫자는 ink-2 | Taste contrast 통과 |
| 9 | 모바일 범례 21px·이름표 겹침 | 범례 44px, 이름표 누르는 영역 확장, 장소 많은 순으로 자리 잡고 겹치는 작은 이름표 숨김(포커스·선택 시 보임) | 범례 44px |
| 10 | WebGL 문맥 2개·재질 복제 누수 | 확인용 문맥 즉시 반환, 재질은 처음 한 번만 복제 | 코드 확인 |

추가로 고친 것: 소개 글 대비(소개 영역 바탕 그라데이션 강화), 목록 페이지 선택 상자 포커스 링, 모바일 버튼 44px.
재점검: Impeccable detect 낮·밤 × 1440·390 **0건**, Taste contrast·focus-ring **통과**, 남은 Taste 경고는 머리말 링크 터치 크기(경고 수준).
