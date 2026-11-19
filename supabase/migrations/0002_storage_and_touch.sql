-- 사진 저장소와 수정 시각. 0001 다음에 실행한다. docs/AUTH.md §5

-- 사진 버킷: 누구나 읽고(공개 페이지), 멤버만 올린다. 지우기는 올린 사람 또는 관리자.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and my_role() is not null);
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (owner = auth.uid() or my_role() = 'admin'));

-- 고칠 때마다 updated_at 갱신
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger places_touch before update on places for each row execute function touch_updated_at();

-- 작성자는 바꿀 수 없다(관리자가 고쳐도 원래 작성자 유지)
create or replace function keep_author() returns trigger language plpgsql as $$
begin new.author = old.author; return new; end $$;
create trigger places_keep_author before update on places for each row execute function keep_author();
create trigger courses_keep_author before update on courses for each row execute function keep_author();

-- 관리자가 자기 자신을 지우거나 강등해 관리자가 0명이 되는 것을 막는다
create or replace function keep_one_admin() returns trigger language plpgsql as $$
begin
  if (select count(*) from members where role = 'admin') = 0 then raise exception '관리자는 최소 1명 있어야 합니다'; end if;
  return null;
end $$;
create constraint trigger members_keep_admin after update or delete on members
  deferrable initially deferred for each row execute function keep_one_admin();
