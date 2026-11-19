# 디자인 체계 (초안 v2, 2026-11-19)

ELSEWHERE와 한 집안처럼 보이도록 **ELSEWHERE 디자인 기준의 색 이름·값, 글꼴 굵기, 가는 선 문법**을 그대로 잇는다. 국내판은 '종이 위의 지도'가 주인공이다.
v1에서 바꾼 것: 굵은 글자(700–800)와 그림자, 검은 알약 버튼, 둥근 카드를 걷어 내고 가는 선(Linen) + 얇은 숫자 + 명조 제목으로 바꿨다(사용자 피드백 "ELSEWHERE보다 감도가 떨어진다").

## 색 — **한지 확정** (2026-11-19)

색 이름(Paper, Linen, Taupe, Ink, Caption)은 ELSEWHERE 디자인 기준을 잇되, 값은 누런 기를 뺀 중성 백색 '한지'로 바꿨다. 디자인 점검에서 크림 바탕이 'AI 기본 색'으로 지적된 것도 함께 해소된다.

| 토큰 | 값 | 쓰임 |
|---|---|---|
| Paper `--color-paper` | `#F4F4F1` | 바탕·패널·바다 |
| Land `--color-land` | `#FFFFFF` | 땅 |
| Linen `--color-linen` | `#E3E3DE` | 가는 선, 패널 테두리 |
| Taupe `--color-taupe` | `#A3A39B` | 장식 전용(글자에 쓰지 않음), 비활성 코스 선 |
| Olive `--color-olive` | `#4F594C` | 포인트(예약) |
| Ink `--color-ink` | `#1F1F1D` | 본문(대비 15:1), 활성 상태, 버튼 테두리 |
| Caption `--color-caption` | `#64645E` | 작은 글자(대비 5.4:1) |
| `--color-line` / `-line-2` / `-coast` | `#CFCFC8` / `#E6E6E1` / `#C4C4BC` | 시·도 경계 / 시·군·구 경계 / 해안선 |
| `--color-focus` | `#2457E6` | 키보드 포커스 링만 |

분류 9색은 `src/data/categories.ts` (ink: 마커·글자, tint: 칩 바탕). 모두 AA 대비 통과.

검토했던 다른 후보(크림·청회·쑥·먹)의 값은 git 기록(커밋 f6202da)의 `src/styles/global.css`에 남아 있다.

## 글꼴 — **② 함렛 확정** (2026-11-19)

| 쓰임 | 글꼴 |
|---|---|
| 제목·음절·숫자 | Hahmlet Variable (제목 380, 숫자 420, 표 형식 숫자) |
| 본문 | Pretendard Variable 400 |
| 워드마크·영문 라벨 | Manrope Variable |

모두 자체 호스팅(`@fontsource-variable/hahmlet`, `pretendard`, `@fontsource-variable/manrope`). 후보였던 Noto Serif KR, IBM Plex는 삭제했다.

## 문법

- 상자보다 **가는 선**: 패널은 1px Linen 테두리 + 아주 옅은 그림자, 목록은 행 사이 선, 분포는 1px 선 위 2px 막대.
- **작은 영문 대문자 라벨**(eyebrow, 11px, 자간 0.06–0.16em)과 **표 형식 숫자**(01, 02… / 개수).
- 버튼은 한 가지: 1px Ink 테두리, 모서리 2px, 마우스를 올리면 채워짐.
- 지도 원: 3px 분류 고리 + Land 바탕 + 숫자, 지역 이름은 원 아래.
- 움직임: 160–320ms, `cubic-bezier(0.23,1,0.32,1)`, 누르면 0.97배. `prefers-reduced-motion`이면 끈다.

## 레이아웃

- 데스크톱: 지도 전체 + 왼쪽 패널 360px(여백 24px) + 상자 없는 헤더(종이색 그라데이션 위 글자).
- 모바일(390): 지도 전체 + 아래 시트(접힘 176px / 펼침 64dvh). 확대 버튼은 숨기고 두 손가락 확대만 쓴다.
