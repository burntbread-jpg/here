# 디자인 체계 (초안 v2, 2026-11-19)

ELSEWHERE와 한 집안처럼 보이도록 **ELSEWHERE 디자인 기준의 색 이름·값, 글꼴 굵기, 가는 선 문법**을 그대로 잇는다. 국내판은 '종이 위의 지도'가 주인공이다.
v1에서 바꾼 것: 굵은 글자(700–800)와 그림자, 검은 알약 버튼, 둥근 카드를 걷어 내고 가는 선(Linen) + 얇은 숫자 + 명조 제목으로 바꿨다(사용자 피드백 "ELSEWHERE보다 감도가 떨어진다").

## 색 (ELSEWHERE와 같은 이름)

| 토큰 | 값 | 쓰임 |
|---|---|---|
| Paper `--color-paper` | `#F6F3ED` | 바탕·바다 |
| Land `--color-land` | `#FBF9F5` | 땅(HERE 전용) |
| Linen `--color-linen` | `#E4E0D6` | 가는 선, 패널 테두리, 시·군·구 경계 |
| Taupe `--color-taupe` | `#A69D8D` | 장식 전용(글자에 쓰지 않음), 비활성 코스 선 |
| Olive `--color-olive` | `#4F594C` | 포인트(예약) |
| Ink `--color-ink` | `#24231F` | 본문, 활성 상태, 버튼 테두리 |
| Caption `--color-caption` | `#69655F` | 작은 글자(대비 5:1 이상) |
| `--color-focus` | `#2457E6` | 키보드 포커스 링만 |

분류 9색은 `src/data/categories.ts` (ink: 마커·글자, tint: 칩 바탕). 모두 AA 대비 통과.

## 글꼴 — **② 함렛 확정** (2026-11-19)

| 쓰임 | 글꼴 |
|---|---|
| 제목·음절·숫자 | Hahmlet Variable (제목 380, 숫자 420, 표 형식 숫자) |
| 본문 | Pretendard Variable 400 |
| 워드마크·영문 라벨 | Manrope Variable |

모두 자체 호스팅(`@fontsource-variable/hahmlet`, `pretendard`, `@fontsource-variable/manrope`). 후보였던 Noto Serif KR, IBM Plex는 삭제했다.

## 바탕색 — 후보 5개 (사용자 선택 대기)

주소 `?bg=paper|hanji|sea|ssuk|meok` 또는 `<html data-bg>`. 정의는 `src/styles/global.css`. 모든 후보에서 본문 13:1 이상, 캡션 5.2:1 이상(AA).

| 후보 | 바탕/패널 | 바다 | 땅 | 성격 |
|---|---|---|---|---|
| 크림 `paper` | #F6F3ED | 바탕과 같음 | #FBF9F5 | 현행. ELSEWHERE와 같은 Paper. 디자인 점검에서 'AI 기본 색'으로 지적됨 |
| 한지 `hanji` | #F4F4F1 | 바탕과 같음 | #FFFFFF | 누런 기를 뺀 중성 백색. 가장 깔끔, 분류 색이 정확하게 보임 |
| 청회 `sea` | #F8F8F6 | #DCE4E6 | #FDFDFB | 바다만 차가운 회청색. 땅과 바다가 가장 잘 갈려 지도로 읽힘 |
| 쑥 `ssuk` | #EEF0E9 | 바탕과 같음 | #F9FAF6 | 옅은 회녹색. ELSEWHERE 올리브와 같은 계열이라 자매 느낌 유지 |
| 먹 `meok` | #1E1E1C | #161615 | #272725 | 어두운 지도. 분류 색이 가장 또렷, 밤에 보기 좋음. 사진이 들어오면 무게가 커짐 |

## 문법

- 상자보다 **가는 선**: 패널은 1px Linen 테두리 + 아주 옅은 그림자, 목록은 행 사이 선, 분포는 1px 선 위 2px 막대.
- **작은 영문 대문자 라벨**(eyebrow, 11px, 자간 0.06–0.16em)과 **표 형식 숫자**(01, 02… / 개수).
- 버튼은 한 가지: 1px Ink 테두리, 모서리 2px, 마우스를 올리면 채워짐.
- 지도 원: 3px 분류 고리 + Land 바탕 + 숫자, 지역 이름은 원 아래.
- 움직임: 160–320ms, `cubic-bezier(0.23,1,0.32,1)`, 누르면 0.97배. `prefers-reduced-motion`이면 끈다.

## 레이아웃

- 데스크톱: 지도 전체 + 왼쪽 패널 360px(여백 24px) + 상자 없는 헤더(종이색 그라데이션 위 글자).
- 모바일(390): 지도 전체 + 아래 시트(접힘 176px / 펼침 64dvh). 확대 버튼은 숨기고 두 손가락 확대만 쓴다.
