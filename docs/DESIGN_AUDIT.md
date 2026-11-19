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
