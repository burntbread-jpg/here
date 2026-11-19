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

## 점검 결과

**아직 실행하지 않음 — 사용자 허락 대기.** 실행하면 이 절에 결과를 채우고, 샌드박스 탓에 생기는 오탐(웹폰트 차단 등)은 걸러서 따로 적는다.
참고: 이 사이트는 글꼴을 모두 자체 호스팅하므로 웹폰트 차단 오탐은 적을 것이다.

### 직접 확인한 것 (스크립트 없이)

- 분류 9색: 흰 글자 대비 5.2–7.2:1, 연한 바탕 위 글자 4.6–5.8:1 (WCAG AA 통과). `docs/CATEGORIES.md` §5.
- 시안 3개 모두 1440·390에서 콘솔 오류 없음.
- 알려진 약점: 시안 B 전국 보기에서 서울·인천·경기 원이 겹친다. 시안 A 모바일에서 수도권 핀이 몰린다.
