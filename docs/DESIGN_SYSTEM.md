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

## 글꼴 — 후보 3개 (사용자 선택 대기)

`<html data-type>` 또는 주소 `?type=1|2|3` 으로 바꾼다. 토큰: `--f-display`(제목·음절), `--f-body`(본문), `--f-latin`(워드마크·영문 라벨), `--f-num`(숫자).

| | 제목·음절 | 본문 | 영문·숫자 | 느낌 |
|---|---|---|---|---|
| ① 명조 | Noto Serif KR 400 | Pretendard | Manrope 500 | ELSEWHERE와 같은 조합. 가장 조용하고 문학적 |
| ② 함렛 | Hahmlet(가변) 380 | Pretendard | 숫자도 Hahmlet, 영문 Manrope | 획 대비가 큰 현대 명조. 숫자가 잡지처럼 보임 |
| ③ 플렉스 | IBM Plex Sans KR 500 | IBM Plex Sans KR | IBM Plex Mono | 지도 라벨·도면 같은 단정한 고딕. ELSEWHERE와 대비 |

모두 자체 호스팅(fontsource / pretendard 패키지). 하나를 고르면 나머지는 `global.css`에서 지운다.

## 문법

- 상자보다 **가는 선**: 패널은 1px Linen 테두리 + 아주 옅은 그림자, 목록은 행 사이 선, 분포는 1px 선 위 2px 막대.
- **작은 영문 대문자 라벨**(eyebrow, 11px, 자간 0.06–0.16em)과 **표 형식 숫자**(01, 02… / 개수).
- 버튼은 한 가지: 1px Ink 테두리, 모서리 2px, 마우스를 올리면 채워짐.
- 지도 원: 3px 분류 고리 + Land 바탕 + 숫자, 지역 이름은 원 아래.
- 움직임: 160–320ms, `cubic-bezier(0.23,1,0.32,1)`, 누르면 0.97배. `prefers-reduced-motion`이면 끈다.

## 레이아웃

- 데스크톱: 지도 전체 + 왼쪽 패널 360px(여백 24px) + 상자 없는 헤더(종이색 그라데이션 위 글자).
- 모바일(390): 지도 전체 + 아래 시트(접힘 176px / 펼침 64dvh). 확대 버튼은 숨기고 두 손가락 확대만 쓴다.
