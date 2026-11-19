-- HERE 초기 스키마 (배포 연결 때 Supabase 에 적용) — docs/AUTH.md
-- 이메일은 이 파일에 쓰지 않는다. 첫 관리자는 Supabase SQL 편집기에서 직접 넣는다(문서 §5).

create type member_role as enum ('admin', 'editor');

create table members (
  email      text primary key check (email = lower(email)),
  role       member_role not null default 'editor',
  name       text,
  created_at timestamptz not null default now()
);

create type category_id as enum ('eat','rest','style','read','walk','stay','play','care','life');

create table places (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  primary_cat category_id not null,
  secondary   category_id[] not null default '{}' check (cardinality(secondary) <= 2),
  tags        text[] not null default '{}',
  lng         double precision not null check (lng between 124 and 132.1),
  lat         double precision not null check (lat between 33 and 38.7),
  sido        text, sgg text,
  photos      text[] not null default '{}',
  author      text not null references members(email),
  visited_on  date,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table courses (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  author     text not null references members(email),
  visited_on date,
  published  boolean not null default false
);

create table course_stops (
  course_id uuid references courses(id) on delete cascade,
  place_id  uuid references places(id) on delete cascade,
  position  int not null,
  primary key (course_id, position)
);

-- 현재 로그인한 사용자의 역할
create or replace function my_role() returns member_role language sql stable security definer set search_path = public as $$
  select role from members where email = lower(auth.jwt() ->> 'email')
$$;

alter table members enable row level security;
alter table places enable row level security;
alter table courses enable row level security;
alter table course_stops enable row level security;

-- members: 편집자는 목록만 보고, 관리자만 바꾼다. 최대 5명.
create policy members_read  on members for select using (my_role() is not null);
create policy members_write on members for all using (my_role() = 'admin') with check (my_role() = 'admin');
create or replace function members_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from members) >= 5 then raise exception '편집 가능 계정은 최대 5개입니다'; end if;
  return new;
end $$;
create trigger members_limit before insert on members for each row execute function members_limit();

-- places/courses: 공개된 글은 누구나 읽고, 멤버는 쓴다. 수정·삭제는 본인 글 또는 관리자만(2026-11-19 결정).
-- 테이블은 멤버만 직접 읽는다(작성자 이메일이 들어 있으므로). 방문자는 아래 공개 뷰로만 읽는다.
create policy places_read   on places for select using (my_role() is not null);
create policy places_insert on places for insert with check (my_role() is not null and author = lower(auth.jwt() ->> 'email'));
create policy places_update on places for update using (my_role() = 'admin' or author = lower(auth.jwt() ->> 'email'))
  with check (my_role() = 'admin' or author = lower(auth.jwt() ->> 'email'));
create policy places_delete on places for delete using (my_role() = 'admin' or author = lower(auth.jwt() ->> 'email'));

create policy courses_read   on courses for select using (my_role() is not null);
create policy courses_insert on courses for insert with check (my_role() is not null and author = lower(auth.jwt() ->> 'email'));
create policy courses_change on courses for update using (my_role() = 'admin' or author = lower(auth.jwt() ->> 'email'));
create policy courses_delete on courses for delete using (my_role() = 'admin' or author = lower(auth.jwt() ->> 'email'));
create policy stops_read     on course_stops for select using (my_role() is not null);
-- 코스 정류장은 그 코스의 작성자(또는 관리자)만 바꾼다. 연결은 작성자가 원할 때만 등록된다.
create policy stops_write    on course_stops for all
  using (my_role() = 'admin' or exists (select 1 from courses c where c.id = course_id and c.author = lower(auth.jwt() ->> 'email')))
  with check (my_role() = 'admin' or exists (select 1 from courses c where c.id = course_id and c.author = lower(auth.jwt() ->> 'email')));

-- ── 공개 뷰: 방문자(anon)가 읽는 유일한 통로 ─────────────────────────────
-- 공개(published)된 글만, 작성자는 이메일 대신 표시 이름(members.name)으로 내보낸다.
-- 뷰는 소유자 권한으로 실행되어 RLS를 거치지 않으므로, 여기서 고른 열만 밖으로 나간다.
create view public_places as
  select p.id, p.title, p.body, p.primary_cat, p.secondary, p.tags, p.lng, p.lat, p.sido, p.sgg, p.photos,
         coalesce(m.name, '익명') as author_name, p.visited_on, p.created_at
  from places p left join members m on m.email = p.author
  where p.published;

create view public_courses as
  select c.id, c.title, coalesce(m.name, '익명') as author_name, c.visited_on
  from courses c left join members m on m.email = c.author
  where c.published;

create view public_course_stops as
  select s.course_id, s.place_id, s.position
  from course_stops s join courses c on c.id = s.course_id join places p on p.id = s.place_id
  where c.published and p.published;

grant select on public_places, public_courses, public_course_stops to anon, authenticated;
