# 지도

## 원칙

- **백지도**: 외부 지도 타일 없이 행정구역 경계만으로 그린다. 장소 위치는 우리가 직접 등록한다(외부 지도 검색·불러오기 없음).
- 전국 → 시·도 → 시·군·구로 확대되고, 마커는 확대 수준에 따라 묶였다 풀린다.
- 엔진: MapLibre GL v6(벡터 렌더링, 확대·이동·터치) + supercluster(거리 기반 묶음). 글리프 서버가 없으므로 글자(지역 이름, 개수)는 모두 HTML 마커로 그린다.

## 경계 데이터와 라이선스

| 항목 | 내용 |
|---|---|
| 원자료 | 통계청 통계지리정보서비스(SGIS) 행정동 경계 — **공공누리 제1유형(출처표시)** |
| 가공본 | [vuski/admdongkor](https://github.com/vuski/admdongkor) `parquet/simplified/{sido,sgg}_20261001_light.parquet` — **CC BY 4.0** |
| 기준일 | 2026-10-01 (시·도 16개, 시·군·구 256개) |
| 우리 파일 | `public/geo/sido.geojson`, `public/geo/sgg.geojson` (좌표 소수 4자리, 추가 단순화) |
| 출처 표기 | 지도 오른쪽 아래 ⓘ에 표시. 문구: "경계: 통계청 SGIS(공공누리 1유형) · vuski/admdongkor (CC BY 4.0)" |

필수 표기 원문(admdongkor LICENSE-DATA): "본 데이터는 통계청 통계지리정보서비스(SGIS, https://sgis.kostat.go.kr)에서 공공누리 제1유형으로 개방한 행정동 경계를 가공한 것이며(가공: vuski/admdongkor, https://github.com/vuski/admdongkor), CC BY 4.0으로 배포됩니다." — 소개 페이지에도 넣는다.

참고: 2026-10-01 판에는 '전남광주통합특별시', 인천 '제물포구·영종구·검단구' 등 최근 개편이 반영되어 있다. 이름 줄임은 `src/scripts/map/base.ts`의 `shortSido`.

### 다시 만들기

```bash
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/vuski/admdongkor ../admdongkor
cd ../admdongkor && git checkout HEAD -- LICENSE-DATA parquet/simplified/sido_20261001_light.parquet parquet/simplified/sgg_20261001_light.parquet && cd -
python3 -m venv .venv-geo && .venv-geo/bin/pip install geopandas pyarrow shapely
.venv-geo/bin/python -I scripts/build_boundaries.py ../admdongkor 20261001
.venv-geo/bin/python -I scripts/make_sample_places.py   # 시안용 샘플 장소(실제 장소 아님)
```

## 시안 — **B로 결정** (2026-11-19)

홈은 시안 B. 시안 C는 '코스' 탭의 바탕으로 쓴다. 시안 A는 비교용으로만 남겨 둔다.

| | A · 사진 핀 | B · 음절 + 행정 묶음 | C · 잇기 |
|---|---|---|---|
| 참고 | 사용자가 보여 준 지도 앱 사진 핀 화면 | 원안의 1음절 파스텔 카드 | '연결'이라는 콘셉트 |
| 마커 | 사진 썸네일 카드 + 큰 숫자. 낱개는 모서리에 음절 배지 | 전국: 시·도 원, 확대: 시·군·구 원(분류 비율 도넛), 더 확대: 음절 점 | 코스 순번 + 음절 꼬리표, 나머지 장소는 작은 점 |
| 묶는 기준 | 화면 거리(supercluster, 64px) | 행정구역(시·도 → 시·군·구) → 거리 | 묶지 않음(코스 중심) |
| 선택 | 파란 테두리 + 아래 시트 '항목 N개' | 지역 요약(분류별 막대) + 목록 | 코스 카드 강조, 다른 코스 흐리게 |
| 필터 | 없음(추가 가능) | 음절 칩 9개 | 잇는 기준 3개 |
| 장점 | 가장 직관적, 사진이 쌓일수록 좋아짐 | 분류 체계가 지도에 바로 드러남, 지역별 분포 파악 | '찍고 잇는다'는 콘셉트가 가장 선명 |
| 약점 | 사진 없는 장소가 많으면 빈약. 분류가 덜 보임 | 수도권처럼 붙은 시·도는 원이 겹침 | 코스가 없는 장소는 존재감이 약함 |

조합도 가능하다: 예) 기본은 A, 상단에 B의 음절 칩, '코스' 탭에서 C.

### 잇는 표현 (코스 탭)

**작성자가 원해서 직접 코스로 등록한 경우에만** 장소 사이에 선을 긋는다(2026-11-19 결정). 같은 날·같은 작성자처럼 자동으로 잇는 기능은 넣지 않는다.
선택한 코스는 진한 실선(Ink), 나머지 코스는 옅은 실선(Taupe). 코스는 그 작성자만 고칠 수 있다(docs/AUTH.md).

## 모바일

아래 시트는 168px(접힘) ↔ 62dvh(펼침). 손잡이를 누르면 바뀐다. 끌어서 올리는 제스처는 시안 확정 후 붙인다.
