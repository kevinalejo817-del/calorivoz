-- =====================================================================
-- CaloriVoz — esquema inicial
-- Ejecutable con `supabase db push` o pegado en Supabase > SQL Editor.
-- =====================================================================

-- ---------- Tablas ----------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  daily_goal  integer not null default 2000
              check (daily_goal between 800 and 8000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.meals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  meal_type    text not null
               check (meal_type in ('Desayuno', 'Almuerzo', 'Cena', 'Snack')),
  description  text not null check (char_length(description) between 1 and 1000),
  source       text not null default 'text'
               check (source in ('text', 'voice', 'voice_simulated', 'quick_example')),
  -- Motor que produjo la estimación: IA (Gemini) o motor local de respaldo.
  engine       text not null default 'gemini'
               check (engine in ('gemini', 'fallback')),
  tip          text,
  consumed_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create table if not exists public.meal_items (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid not null references public.meals (id) on delete cascade,
  name        text not null,
  portion     text not null,
  calories    numeric(8, 2) not null check (calories >= 0),
  protein     numeric(8, 2) not null default 0 check (protein >= 0),
  carbs       numeric(8, 2) not null default 0 check (carbs >= 0),
  fat         numeric(8, 2) not null default 0 check (fat >= 0),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- Índices ---------------------------------------------------

create index if not exists meals_user_consumed_at_idx
  on public.meals (user_id, consumed_at desc);
create index if not exists meal_items_meal_id_idx
  on public.meal_items (meal_id, sort_order);

-- ---------- updated_at ------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Perfil automático al registrarse --------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, daily_goal)
  values (new.id, new.email, 2000)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuarios que ya existían antes de esta migración.
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- ---------- Row Level Security ----------------------------------------

alter table public.profiles   enable row level security;
alter table public.meals      enable row level security;
alter table public.meal_items enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- meals
drop policy if exists "meals_select_own" on public.meals;
create policy "meals_select_own" on public.meals
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own" on public.meals
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own" on public.meals
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own" on public.meals
  for delete to authenticated using (auth.uid() = user_id);

-- meal_items: acceso solo a través de comidas propias
drop policy if exists "meal_items_select_own" on public.meal_items;
create policy "meal_items_select_own" on public.meal_items
  for select to authenticated using (
    exists (select 1 from public.meals m
            where m.id = meal_items.meal_id and m.user_id = auth.uid()));

drop policy if exists "meal_items_insert_own" on public.meal_items;
create policy "meal_items_insert_own" on public.meal_items
  for insert to authenticated with check (
    exists (select 1 from public.meals m
            where m.id = meal_items.meal_id and m.user_id = auth.uid()));

drop policy if exists "meal_items_update_own" on public.meal_items;
create policy "meal_items_update_own" on public.meal_items
  for update to authenticated
  using (exists (select 1 from public.meals m
                 where m.id = meal_items.meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.meals m
                      where m.id = meal_items.meal_id and m.user_id = auth.uid()));

drop policy if exists "meal_items_delete_own" on public.meal_items;
create policy "meal_items_delete_own" on public.meal_items
  for delete to authenticated using (
    exists (select 1 from public.meals m
            where m.id = meal_items.meal_id and m.user_id = auth.uid()));

-- ---------- Privilegios -----------------------------------------------

revoke all on public.profiles, public.meals, public.meal_items from anon;
grant select, insert, update, delete on public.profiles, public.meals, public.meal_items
  to authenticated;

-- ---------- RPC transaccional: comida + alimentos ---------------------
-- Una sola transacción: nunca queda una comida sin sus alimentos.
-- SECURITY INVOKER: las políticas RLS se aplican con el usuario que llama.

create or replace function public.create_meal_with_items(
  p_meal_type    text,
  p_description  text,
  p_source       text,
  p_engine       text,
  p_tip          text,
  p_consumed_at  timestamptz,
  p_items        jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_meal_id uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'items_required' using errcode = '22023';
  end if;

  insert into public.meals (user_id, meal_type, description, source, engine, tip, consumed_at)
  values (v_user, p_meal_type, p_description, p_source, p_engine, p_tip,
          coalesce(p_consumed_at, now()))
  returning id into v_meal_id;

  insert into public.meal_items (meal_id, name, portion, calories, protein, carbs, fat, sort_order)
  select v_meal_id,
         left(trim(i.value ->> 'name'), 200),
         left(trim(i.value ->> 'portion'), 200),
         (i.value ->> 'calories')::numeric,
         coalesce((i.value ->> 'protein')::numeric, 0),
         coalesce((i.value ->> 'carbs')::numeric, 0),
         coalesce((i.value ->> 'fat')::numeric, 0),
         (i.ord - 1)::integer
  from jsonb_array_elements(p_items) with ordinality as i(value, ord);

  return v_meal_id;
end;
$$;

revoke all on function public.create_meal_with_items(text, text, text, text, text, timestamptz, jsonb) from public, anon;
grant execute on function public.create_meal_with_items(text, text, text, text, text, timestamptz, jsonb) to authenticated;
