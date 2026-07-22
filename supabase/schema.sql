-- ============================================================================
-- USA Plates — schema for Supabase (run once in the SQL Editor)
-- Project: gkvakggwyzwqfcjxpcnh
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own username"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- prevent users from granting themselves admin via the update policy above
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_admin_trigger on public.profiles;
create trigger protect_is_admin_trigger
  before update on public.profiles
  for each row execute function public.protect_is_admin();

-- auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. states (seed data — 50 US states)
-- ----------------------------------------------------------------------------
create table if not exists public.states (
  code text primary key,
  name text not null,
  capital text not null,
  population bigint not null,
  sort_order int not null
);

alter table public.states enable row level security;

create policy "states are readable by any authenticated user"
  on public.states for select
  to authenticated
  using (true);

insert into public.states (code, name, capital, population, sort_order) values
  ('AL', 'Alabama', 'Montgomery', 5100000, 1),
  ('AK', 'Alaska', 'Juneau', 733000, 2),
  ('AZ', 'Arizona', 'Phoenix', 7400000, 3),
  ('AR', 'Arkansas', 'Little Rock', 3050000, 4),
  ('CA', 'California', 'Sacramento', 39000000, 5),
  ('CO', 'Colorado', 'Denver', 5900000, 6),
  ('CT', 'Connecticut', 'Hartford', 3600000, 7),
  ('DE', 'Delaware', 'Dover', 1020000, 8),
  ('FL', 'Florida', 'Tallahassee', 22600000, 9),
  ('GA', 'Georgia', 'Atlanta', 11000000, 10),
  ('HI', 'Hawaii', 'Honolulu', 1440000, 11),
  ('ID', 'Idaho', 'Boise', 1970000, 12),
  ('IL', 'Illinois', 'Springfield', 12500000, 13),
  ('IN', 'Indiana', 'Indianapolis', 6860000, 14),
  ('IA', 'Iowa', 'Des Moines', 3200000, 15),
  ('KS', 'Kansas', 'Topeka', 2940000, 16),
  ('KY', 'Kentucky', 'Frankfort', 4550000, 17),
  ('LA', 'Louisiana', 'Baton Rouge', 4570000, 18),
  ('ME', 'Maine', 'Augusta', 1395000, 19),
  ('MD', 'Maryland', 'Annapolis', 6180000, 20),
  ('MA', 'Massachusetts', 'Boston', 7000000, 21),
  ('MI', 'Michigan', 'Lansing', 10030000, 22),
  ('MN', 'Minnesota', 'Saint Paul', 5740000, 23),
  ('MS', 'Mississippi', 'Jackson', 2940000, 24),
  ('MO', 'Missouri', 'Jefferson City', 6190000, 25),
  ('MT', 'Montana', 'Helena', 1130000, 26),
  ('NE', 'Nebraska', 'Lincoln', 2000000, 27),
  ('NV', 'Nevada', 'Carson City', 3190000, 28),
  ('NH', 'New Hampshire', 'Concord', 1400000, 29),
  ('NJ', 'New Jersey', 'Trenton', 9290000, 30),
  ('NM', 'New Mexico', 'Santa Fe', 2110000, 31),
  ('NY', 'New York', 'Albany', 19570000, 32),
  ('NC', 'North Carolina', 'Raleigh', 10830000, 33),
  ('ND', 'North Dakota', 'Bismarck', 780000, 34),
  ('OH', 'Ohio', 'Columbus', 11780000, 35),
  ('OK', 'Oklahoma', 'Oklahoma City', 4050000, 36),
  ('OR', 'Oregon', 'Salem', 4240000, 37),
  ('PA', 'Pennsylvania', 'Harrisburg', 12960000, 38),
  ('RI', 'Rhode Island', 'Providence', 1095000, 39),
  ('SC', 'South Carolina', 'Columbia', 5370000, 40),
  ('SD', 'South Dakota', 'Pierre', 920000, 41),
  ('TN', 'Tennessee', 'Nashville', 7130000, 42),
  ('TX', 'Texas', 'Austin', 30500000, 43),
  ('UT', 'Utah', 'Salt Lake City', 3420000, 44),
  ('VT', 'Vermont', 'Montpelier', 648000, 45),
  ('VA', 'Virginia', 'Richmond', 8715000, 46),
  ('WA', 'Washington', 'Olympia', 7810000, 47),
  ('WV', 'West Virginia', 'Charleston', 1770000, 48),
  ('WI', 'Wisconsin', 'Madison', 5910000, 49),
  ('WY', 'Wyoming', 'Cheyenne', 585000, 50)
on conflict (code) do update set
  name = excluded.name,
  capital = excluded.capital,
  population = excluded.population,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- 3. plates (one photo submission per user per state)
-- ----------------------------------------------------------------------------
create table if not exists public.plates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  state_code text not null references public.states (code),
  photo_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  unique (user_id, state_code)
);

alter table public.plates enable row level security;

create policy "plates are readable by any authenticated user"
  on public.plates for select
  to authenticated
  using (true);

create policy "users can submit their own plate"
  on public.plates for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy "users can resubmit a rejected plate"
  on public.plates for update
  to authenticated
  using (user_id = auth.uid() and status = 'rejected')
  with check (user_id = auth.uid() and status = 'pending');

create policy "admins can review plates"
  on public.plates for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (true);

-- ----------------------------------------------------------------------------
-- 4. quiz_answers (one attempt per user per state per question type)
-- ----------------------------------------------------------------------------
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  state_code text not null references public.states (code),
  question_type text not null check (question_type in ('capital', 'population')),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, state_code, question_type)
);

alter table public.quiz_answers enable row level security;

create policy "quiz answers are readable by any authenticated user"
  on public.quiz_answers for select
  to authenticated
  using (true);

create policy "users can submit their own quiz answers"
  on public.quiz_answers for insert
  to authenticated
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. storage bucket for plate photos
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('plates', 'plates', true)
on conflict (id) do nothing;

create policy "plate photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'plates');

create policy "users can upload plate photos into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'plates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can replace their own plate photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'plates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own plate photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'plates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 6. make yourself admin (run manually after you've signed up once)
-- ----------------------------------------------------------------------------
-- update public.profiles set is_admin = true where username = 'your-username';
