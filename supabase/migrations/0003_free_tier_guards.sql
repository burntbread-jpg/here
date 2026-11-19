-- 무료(Free) 한도 안에서만 쓰도록 DB 가 스스로 막는다. 0001·0002 다음에 실행. docs/OPERATIONS.md §5
-- Supabase Free: DB 500MB, 파일 저장 1GB. 여기서는 그보다 낮은 선에서 미리 멈춘다.

-- 1) 사진 한 장 최대 3MB (편집 화면은 1600px webp 로 줄여 보통 0.2–0.4MB)
update storage.buckets set file_size_limit = 3145728 where id = 'photos';

-- 2) 사진 저장소 전체가 900MB 를 넘으면 새 사진 올리기를 막는다(1GB 한도 전에 멈춤)
create or replace function photos_used_bytes() returns bigint language sql stable security definer set search_path = public, storage as $$
  select coalesce(sum((metadata ->> 'size')::bigint), 0) from storage.objects where bucket_id = 'photos'
$$;
drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and my_role() is not null and photos_used_bytes() < 900 * 1024 * 1024);

-- 3) 장소는 1만 곳, 코스는 2천 개까지(글자만으로는 수십 MB 수준이라 500MB 한도와 거리가 멀다)
create or replace function places_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from places) >= 10000 then raise exception '장소는 최대 1만 곳까지예요(무료 한도 보호)'; end if;
  return new;
end $$;
drop trigger if exists places_limit on places;
create trigger places_limit before insert on places for each row execute function places_limit();

create or replace function courses_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from courses) >= 2000 then raise exception '코스는 최대 2천 개까지예요(무료 한도 보호)'; end if;
  return new;
end $$;
drop trigger if exists courses_limit on courses;
create trigger courses_limit before insert on courses for each row execute function courses_limit();

-- 4) 본문 길이 상한(앱에서도 2만 자로 막지만 DB 에서 한 번 더)
alter table places drop constraint if exists places_body_len;
alter table places add constraint places_body_len check (body is null or char_length(body) <= 20000);
