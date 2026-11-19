# 디자인 체계 (초안)

ELSEWHERE와 한 집안처럼 보이되, 국내판은 **'종이 위의 지도'** 가 주인공이다.

## 색

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--color-paper` | `#F6F3ED` | 바다·바탕(ELSEWHERE와 같은 크림) |
| `--color-land` | `#FDFCF9` | 땅 |
| `--color-ink` | `#1E1D1A` | 본문, 활성 코스, 버튼 |
| `--color-ink-2` / `-3` | `#5A564E` / `#8C867B` | 보조 글자 / 캡션·지역 이름 |
| `--color-line` / `-2` | `#D9D2C5` / `#E8E2D7` | 시·도 경계 / 시·군·구 경계·구분선 |
| `--color-focus` | `#2457E6` | 선택된 마커 테두리, 포커스 링 |
| `--color-olive` | `#5F6B2E` | ELSEWHERE 포인트 계승(아직 미사용) |

분류 9색은 `src/data/categories.ts` (ink: 마커·글자, tint: 카드 바탕). 모두 흰 글자 대비 4.5:1 이상, ink-on-tint 4.5:1 이상.

## 글꼴 (모두 자체 호스팅, 외부 요청 없음)

- 본문: Pretendard Variable (`pretendard` 패키지, 동적 서브셋)
- 제목·지역 요약: Noto Serif KR 600 (`@fontsource/noto-serif-kr`)
- 워드마크·숫자: Manrope Variable (`@fontsource-variable/manrope`), 숫자는 `tabular-nums`

## 마커 규칙

1. 색만으로 구분하지 않는다 — 음절 글자를 함께 넣는다.
2. 숫자(묶음 개수)는 Manrope 800, 사진 위에서는 흰 글자 + 그림자.
3. 선택 상태는 `--color-focus` 테두리 하나로 통일한다.
4. 움직임: 160–320ms, `cubic-bezier(0.23,1,0.32,1)`. `prefers-reduced-motion`이면 끈다.

## 레이아웃

- 데스크톱: 지도 전체 + 왼쪽 떠 있는 패널 372px + 위 떠 있는 헤더.
- 모바일(390): 지도 전체 + 아래 시트(접힘 168px / 펼침 62dvh). 좌우 여백 12–16px.
