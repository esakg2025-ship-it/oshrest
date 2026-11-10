-- ============================================================
-- OshRest: схема базы данных Supabase
-- Выполнить целиком в Supabase -> SQL Editor (один раз).
-- Скрипт можно запускать повторно.
-- ============================================================
create extension if not exists pgcrypto;

-- ---------- Таблицы ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'tourist' check (role in ('tourist','owner','admin')),
  full_name text,
  login text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  category text not null,
  region text not null,
  name text not null,
  description text,
  price_from int not null default 0,
  rating numeric(2,1) not null default 0,
  lat double precision,
  lng double precision,
  hours text,
  phone text,
  whatsapp text,
  services jsonb not null default '[]'::jsonb,   -- [{"k":"bf","p":350,"per":"p"}]
  photos text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists places_owner_idx on public.places(owner_id);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  name text not null,
  area int,
  capacity int not null default 2,
  beds int not null default 1,
  bed_type text,
  price int not null default 0,
  amenities text[] not null default '{}',
  photos text[] not null default '{}',
  available boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists rooms_place_idx on public.rooms(place_id);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('booking','inquiry')),
  place_id uuid not null references public.places(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tourist_id uuid references public.profiles(id) on delete set null,
  tourist_name text,
  tourist_phone text,
  message text,
  d1 date,
  d2 date,
  guests int,
  services text[] not null default '{}',
  total int,
  status text not null default 'new' check (status in ('new','confirmed','declined','cancelled','answered')),
  reply text,
  seen_by_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists requests_place_idx on public.requests(place_id, created_at desc);
create index if not exists requests_tourist_idx on public.requests(tourist_id, created_at desc);
create index if not exists requests_room_idx on public.requests(room_id, d1, d2);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  primary key (user_id, place_id)
);

create table if not exists public.password_requests (
  id uuid primary key default gen_random_uuid(),
  login text not null,
  note text,
  status text not null default 'new' check (status in ('new','done')),
  created_at timestamptz not null default now()
);

-- ---------- Вспомогательные функции ----------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.owns_place(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.places where id = pid and owner_id = auth.uid())
$$;

-- Свободна ли комната на даты (туристы не видят чужие брони, только ответ да/нет)
create or replace function public.room_busy(p_room uuid, p_d1 date, p_d2 date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.requests
    where room_id = p_room and kind = 'booking' and status in ('new','confirmed')
      and d1 < p_d2 and d2 > p_d1
  )
$$;
grant execute on function public.room_busy(uuid, date, date) to authenticated;

-- ---------- Триггеры ----------
-- Новый пользователь auth -> профиль. Роль берётся ТОЛЬКО из app_metadata (его задаёт сервер),
-- поэтому турист не может сделать себя владельцем или админом.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, login, phone)
  values (
    new.id,
    coalesce(new.raw_app_meta_data->>'role', 'tourist'),
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'login', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.profiles_guard() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.login := old.login;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_t on public.profiles;
create trigger profiles_guard_t before update on public.profiles
  for each row execute function public.profiles_guard();

create or replace function public.places_guard() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.owner_id := auth.uid();
      new.rating := 0;
    else
      new.owner_id := old.owner_id;
      new.rating := old.rating;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists places_guard_t on public.places;
create trigger places_guard_t before insert or update on public.places
  for each row execute function public.places_guard();

-- Проверка и расчёт брони на сервере (цены нельзя подделать с клиента)
create or replace function public.requests_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.rooms; svc int := 0; nights int;
begin
  if auth.uid() is not null then new.tourist_id := auth.uid(); end if;
  new.status := 'new'; new.seen_by_owner := false; new.reply := null;
  if new.kind = 'booking' then
    select * into r from public.rooms where id = new.room_id and place_id = new.place_id and available;
    if not found then raise exception 'Комната недоступна'; end if;
    if new.d1 is null or new.d2 is null or new.d2 <= new.d1 then raise exception 'Неверные даты'; end if;
    if new.d1 < current_date then raise exception 'Дата в прошлом'; end if;
    if coalesce(new.guests,1) < 1 or coalesce(new.guests,1) > r.capacity then raise exception 'Слишком много гостей'; end if;
    if public.room_busy(new.room_id, new.d1, new.d2) then raise exception 'Комната занята на эти даты'; end if;
    nights := new.d2 - new.d1;
    select coalesce(sum((s->>'p')::int * case when s->>'per' = 'p' then coalesce(new.guests,1) else 1 end), 0)
      into svc
      from public.places pl, jsonb_array_elements(pl.services) s
      where pl.id = new.place_id and (s->>'k') = any(new.services);
    new.total := r.price * nights + svc;
  else
    new.room_id := null; new.d1 := null; new.d2 := null; new.total := null;
  end if;
  return new;
end $$;
drop trigger if exists requests_bi on public.requests;
create trigger requests_bi before insert on public.requests
  for each row execute function public.requests_before_insert();

-- Кто что может менять в заявке
create or replace function public.requests_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare st text := new.status; rp text := new.reply; sn boolean := new.seen_by_owner;
begin
  if auth.uid() is not null and not public.is_admin() then
    if public.owns_place(old.place_id) then
      new := old; new.status := st; new.reply := rp; new.seen_by_owner := sn;
    elsif old.tourist_id = auth.uid() then
      new := old;
      if st = 'cancelled' then new.status := 'cancelled'; end if;
    else
      new := old;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists requests_bu on public.requests;
create trigger requests_bu before update on public.requests
  for each row execute function public.requests_before_update();

-- ---------- Row Level Security ----------
alter table public.profiles          enable row level security;
alter table public.places            enable row level security;
alter table public.rooms             enable row level security;
alter table public.requests          enable row level security;
alter table public.favorites         enable row level security;
alter table public.password_requests enable row level security;

drop policy if exists profiles_sel on public.profiles;
drop policy if exists profiles_upd on public.profiles;
drop policy if exists profiles_all_admin on public.profiles;
create policy profiles_sel on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_upd on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_all_admin on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists places_sel on public.places;
drop policy if exists places_ins on public.places;
drop policy if exists places_upd on public.places;
drop policy if exists places_del on public.places;
create policy places_sel on public.places for select to authenticated using (active or owner_id = auth.uid() or public.is_admin());
create policy places_ins on public.places for insert to authenticated with check (public.my_role() in ('owner','admin'));
create policy places_upd on public.places for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy places_del on public.places for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

drop policy if exists rooms_sel on public.rooms;
drop policy if exists rooms_wr on public.rooms;
create policy rooms_sel on public.rooms for select to authenticated using (
  exists (select 1 from public.places p where p.id = place_id and (p.active or p.owner_id = auth.uid() or public.is_admin()))
);
create policy rooms_wr on public.rooms for all to authenticated
  using (public.owns_place(place_id) or public.is_admin())
  with check (public.owns_place(place_id) or public.is_admin());

drop policy if exists fav_all on public.favorites;
create policy fav_all on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists req_sel on public.requests;
drop policy if exists req_ins on public.requests;
drop policy if exists req_upd on public.requests;
drop policy if exists req_del on public.requests;
create policy req_sel on public.requests for select to authenticated using (tourist_id = auth.uid() or public.owns_place(place_id) or public.is_admin());
create policy req_ins on public.requests for insert to authenticated with check (tourist_id = auth.uid() or tourist_id is null);
create policy req_upd on public.requests for update to authenticated using (tourist_id = auth.uid() or public.owns_place(place_id) or public.is_admin());
create policy req_del on public.requests for delete to authenticated using (public.is_admin());

drop policy if exists pwreq_admin on public.password_requests;
create policy pwreq_admin on public.password_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- вставка в password_requests идёт только через сервер (service role), анонимам доступа нет

-- ---------- Realtime (уведомления сверху) ----------
do $$ begin
  begin alter publication supabase_realtime add table public.requests; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.password_requests; exception when duplicate_object then null; end;
end $$;

-- ---------- Хранилище фото ----------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
drop policy if exists photos_read on storage.objects;
drop policy if exists photos_ins on storage.objects;
drop policy if exists photos_del on storage.objects;
create policy photos_read on storage.objects for select using (bucket_id = 'photos');
create policy photos_ins on storage.objects for insert to authenticated with check (bucket_id = 'photos' and public.my_role() in ('owner','admin'));
create policy photos_del on storage.objects for delete to authenticated using (bucket_id = 'photos' and (owner = auth.uid() or public.is_admin()));

-- ---------- Усиление безопасности функций ----------
alter function public.places_guard() set search_path = public;
alter function public.profiles_guard() set search_path = public;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.requests_before_insert() from public, anon, authenticated;
revoke execute on function public.requests_before_update() from public, anon, authenticated;
revoke execute on function public.places_guard() from public, anon, authenticated;
revoke execute on function public.profiles_guard() from public, anon, authenticated;
revoke execute on function public.room_busy(uuid, date, date) from public, anon;
revoke execute on function public.my_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.owns_place(uuid) from public, anon;
grant execute on function public.room_busy(uuid, date, date), public.my_role(), public.is_admin(), public.owns_place(uuid) to authenticated;
