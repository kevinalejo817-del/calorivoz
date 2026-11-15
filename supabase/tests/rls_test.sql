-- Pruebas de la migración (perfil automático, RPC transaccional, RLS, cascada).
-- Uso local: psql -v ON_ERROR_STOP=1 -f local_auth_stub.sql -f ../migrations/*.sql -f rls_test.sql
\set ON_ERROR_STOP on
begin;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test.com');

do $$ begin
  assert (select count(*) from public.profiles) = 2, 'el trigger debe crear un perfil por usuario';
  assert (select min(daily_goal) from public.profiles) = 2000, 'meta inicial 2000';
  raise notice 'OK  perfil automático con meta 2000';
end $$;

-- ===== Usuario A =====
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);

do $$
declare v_id uuid;
begin
  v_id := public.create_meal_with_items('Desayuno', 'huevos y pan', 'text', 'gemini', 'tip', now(),
    '[{"name":"Huevo","portion":"2","calories":170,"protein":13,"carbs":1.4,"fat":12},
      {"name":"Pan","portion":"1","calories":85,"protein":3.5,"carbs":15,"fat":1.2}]'::jsonb);
  assert (select count(*) from public.meals) = 1, 'A ve su comida';
  assert (select count(*) from public.meal_items) = 2, 'A ve sus 2 alimentos';
  assert (select name from public.meal_items order by sort_order limit 1) = 'Huevo', 'orden de alimentos';
  raise notice 'OK  RPC guarda comida + alimentos';

  -- Rollback: item inválido no deja comida huérfana.
  begin
    perform public.create_meal_with_items('Cena', 'x', 'text', 'gemini', '', now(), '[{"name":"n","portion":"p","calories":-5}]'::jsonb);
    raise exception 'debió fallar';
  exception when check_violation then null; end;
  assert (select count(*) from public.meals) = 1, 'sin comida huérfana tras error en items';
  raise notice 'OK  la RPC es atómica (sin comidas sin alimentos)';

  begin
    perform public.create_meal_with_items('Brunch', 'x', 'text', 'gemini', '', now(), '[{"name":"n","portion":"p","calories":1}]'::jsonb);
    raise exception 'debió fallar';
  exception when check_violation then null; end;
  raise notice 'OK  tipo de comida inválido rechazado';

  begin
    perform public.create_meal_with_items('Cena', 'x', 'text', 'gemini', '', now(), '[]'::jsonb);
    raise exception 'debió fallar';
  exception when sqlstate '22023' then null; end;
  raise notice 'OK  lista de alimentos vacía rechazada';

  begin
    update public.profiles set daily_goal = 100 where id = auth.uid();
    raise exception 'debió fallar';
  exception when check_violation then null; end;
  update public.profiles set daily_goal = 2500 where id = auth.uid();
  assert (select daily_goal from public.profiles) = 2500, 'A actualiza su meta';
  raise notice 'OK  meta validada (800–8000) y editable por su dueño';
end $$;

-- ===== Usuario B: no ve ni toca lo de A =====
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', true);

do $$
declare n int;
begin
  assert (select count(*) from public.meals) = 0, 'B no ve comidas de A';
  assert (select count(*) from public.meal_items) = 0, 'B no ve alimentos de A';
  assert (select count(*) from public.profiles) = 1, 'B solo ve su perfil';
  assert (select daily_goal from public.profiles) = 2000, 'perfil de B intacto';

  update public.profiles set daily_goal = 3000 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count; assert n = 0, 'B no modifica el perfil de A';
  delete from public.meals; get diagnostics n = row_count; assert n = 0, 'B no borra comidas de A';
  update public.meals set description = 'hack'; get diagnostics n = row_count; assert n = 0, 'B no edita comidas de A';
  delete from public.meal_items; get diagnostics n = row_count; assert n = 0, 'B no borra alimentos de A';

  begin
    insert into public.meals (user_id, meal_type, description) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Cena', 'suplantación');
    raise exception 'debió fallar';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.meal_items (meal_id, name, portion, calories)
      select id, 'x', 'y', 1 from (select id from public.meals) s;  -- 0 filas visibles
  end;
  raise notice 'OK  B no puede leer, editar, borrar ni insertar datos de A';
end $$;

-- ===== anon sin acceso =====
reset role;
set local role anon;
do $$ begin
  begin
    perform count(*) from public.meals;
    raise exception 'anon no debería leer meals';
  exception when insufficient_privilege then null; end;
  raise notice 'OK  anon sin acceso a las tablas';
end $$;

-- ===== Cascada: borrar la comida elimina sus alimentos =====
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
do $$ begin
  delete from public.meals;
  assert (select count(*) from public.meals) = 0, 'comida borrada';
  reset role;
  assert (select count(*) from public.meal_items) = 0, 'ON DELETE CASCADE elimina los alimentos';
  raise notice 'OK  ON DELETE CASCADE';
end $$;

rollback;
