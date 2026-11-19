// 분류 체계 (수정안 v1, 사용자 확정 전 — docs/CATEGORIES.md)
// 장소마다 주 분류(primary) 1개 + 보조 분류(secondary) 최대 2개 + 속성 태그.
// 지도 위 색은 '보조 신호'다. 마커에는 반드시 음절 글자가 함께 들어가므로
// 색을 구분하지 못해도 분류를 읽을 수 있다.

export type CategoryId =
  | 'eat' | 'rest' | 'style' | 'read' | 'walk' | 'stay' | 'play' | 'care' | 'life';

export interface Category {
  id: CategoryId;      // URL·DB 키 (영문 소문자)
  syllable: string;    // 1음절 표기
  en: string;          // 영문 라벨 (로마자 대신 사용)
  meaning: string;     // 뜻
  examples: string;    // 예시
  ink: string;         // 마커·글자색 (흰 배경 대비 3:1 이상)
  tint: string;        // 카드 배경 파스텔
}

export const CATEGORIES: Category[] = [
  { id: 'eat',   syllable: '맛', en: 'Eat',    meaning: '먹는 즐거움',   examples: '식당 · 디저트 · 빵',          ink: '#B44226', tint: '#FBE7E0' },
  { id: 'rest',  syllable: '쉼', en: 'Rest',   meaning: '머물러 쉬는 곳', examples: '카페 · 찻집 · 쉼터',          ink: '#237461', tint: '#DFF1EA' },
  { id: 'style', syllable: '멋', en: 'Style',  meaning: '취향과 감각',   examples: '편집숍 · 건축 · 갤러리',      ink: '#7E47B8', tint: '#EEE4F8' },
  { id: 'read',  syllable: '책', en: 'Read',   meaning: '지식과 사색',   examples: '서점 · 도서관 · 북카페',      ink: '#3A4FB0', tint: '#E3E7F8' },
  { id: 'walk',  syllable: '길', en: 'Walk',   meaning: '걷고 바라보기', examples: '산책로 · 골목 · 전망 · 꽃길', ink: '#56751A', tint: '#ECF2DC' },
  { id: 'stay',  syllable: '잠', en: 'Stay',   meaning: '머무는 공간',   examples: '숙소 · 스테이',               ink: '#A73E77', tint: '#F8E1EE' },
  { id: 'play',  syllable: '흥', en: 'Play',   meaning: '즐거운 경험',   examples: '체험 · 공연 · 놀이',          ink: '#936208', tint: '#FBF0D6' },
  { id: 'care',  syllable: '몸', en: 'Care',   meaning: '건강과 돌봄',   examples: '병원 · 의원 · 약국',          ink: '#1B7094', tint: '#DDEFF7' },
  { id: 'life',  syllable: '삶', en: 'Living', meaning: '생활의 발견',   examples: '세탁 · 수선 · 주차 · 화장실', ink: '#6F635A', tint: '#EEEAE5' },
];

/** 분류가 아니라 '속성'으로 옮긴 것들(원안의 득·팁·봄-풍경). 어느 분류와도 겹쳐 붙는다. */
export const ATTRIBUTE_TAGS = [
  { id: 'deal',   label: '실속', from: '득', note: '할인·저렴함' },
  { id: 'tip',    label: '꿀팁', from: '팁', note: '알아두면 좋은 정보' },
  { id: 'season', label: '계절', from: '봄(풍경)', note: '봄·여름·가을·겨울 중 선택' },
] as const;

export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;
