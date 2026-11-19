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

-- places/courses: 공개된 글은 누구나 읽고, 멤버는 쓰고 고친다. 삭제는 본인 글 또는 관리자.
create policy places_read   on places for select using (published or my_role() is not null);
create policy places_insert on places for insert with check (my_role() is not null and author = lower(auth.jwt() ->> 'email'));
create policy places_update on places for update using (my_role() is not null);
create policy places_delete on places for delete using (my_role() = 'admin' or author = lower(auth.jwt() ->> 'email'));

create policy courses_read   on courses for select using (published or my_role() is not null);
create policy courses_write  on courses for all using (my_role() is not null) with check (my_role() is not null);
create policy stops_read     on course_stops for select using (true);
create policy stops_write    on course_stops for all using (my_role() is not null) with check (my_role() is not null);
