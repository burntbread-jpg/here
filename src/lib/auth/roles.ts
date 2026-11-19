// 역할 모델 — docs/AUTH.md
// 이메일 목록은 저장소에 두지 않는다. 초안 단계: 환경 변수 HERE_MEMBERS 에서 읽는다.
// 배포 연결 후: Supabase `members` 테이블(RLS)로 옮기고, 이 파일은 권한 판단 로직만 유지한다.

export type Role = 'admin' | 'editor';

export type Action =
  | 'place.create' | 'place.update.own' | 'place.update.any' | 'place.delete.own' | 'place.delete.any'
  | 'course.create' | 'course.update.own' | 'course.update.any'
  | 'category.manage'   // 분류 이름·색·작성 가이드
  | 'design.manage'     // 홈 시안 선택, 디자인 토큰, 레이아웃
  | 'settings.manage'   // 사이트 제목·소개·공개 설정
  | 'member.manage';    // 편집 가능 계정 추가·삭제·역할 변경

const MATRIX: Record<Role, ReadonlySet<Action>> = {
  editor: new Set<Action>([
    'place.create', 'place.update.own', 'place.delete.own',
    'course.create', 'course.update.own',
    // 공동 작업이므로 다른 사람 글 '수정'은 허용하고 '삭제'는 관리자만 — [확인 필요] docs/AUTH.md §3
    'place.update.any', 'course.update.any',
  ]),
  admin: new Set<Action>([
    'place.create', 'place.update.own', 'place.update.any', 'place.delete.own', 'place.delete.any',
    'course.create', 'course.update.own', 'course.update.any',
    'category.manage', 'design.manage', 'settings.manage', 'member.manage',
  ]),
};

export const MAX_MEMBERS = 5;

export function can(role: Role | null | undefined, action: Action): boolean {
  return !!role && MATRIX[role].has(action);
}

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

/** "a@x.com:admin,b@y.com:editor" → Map. 역할이 없으면 editor. */
export function parseMembers(raw: string | undefined): Map<string, Role> {
  const m = new Map<string, Role>();
  for (const part of (raw ?? '').split(',')) {
    const [email, role] = part.split(':').map((s) => s?.trim());
    if (!email || !email.includes('@')) continue;
    m.set(normalizeEmail(email), role === 'admin' ? 'admin' : 'editor');
  }
  if (m.size > MAX_MEMBERS) console.warn(`[here] 편집 가능 계정이 ${m.size}개로, 계획한 ${MAX_MEMBERS}개를 넘었습니다.`);
  if (![...m.values()].includes('admin')) console.warn('[here] 관리자 계정이 없습니다.');
  return m;
}

export function roleOf(email: string | null | undefined, members: Map<string, Role>): Role | null {
  return email ? members.get(normalizeEmail(email)) ?? null : null;
}
