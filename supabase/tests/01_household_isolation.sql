begin;
select plan(9);

-- Fixtures como postgres (dono das tabelas, contorna RLS).
insert into households (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Casa 1'),
  ('10000000-0000-0000-0000-000000000002', 'Casa 2');

select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');
select tests.create_user('20000000-0000-0000-0000-000000000002', 'c@example.com');

insert into household_members (household_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002');

insert into categories (id, household_id, name, kind) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mercado', 'expense');

-- Usuário A, membro da casa 1: lê e escreve dados da casa 1.
select tests.authenticate_as('20000000-0000-0000-0000-000000000001');

select is(
  (select count(*)::int from households where id = '10000000-0000-0000-0000-000000000001'),
  1,
  'usuário A vê a própria casa'
);

select lives_ok(
  $$ insert into transactions (id, household_id, category_id, kind, amount_cents, occurred_on, payment_method)
     values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
             '30000000-0000-0000-0000-000000000001', 'expense', 5000, current_date, 'pix') $$,
  'usuário A consegue criar lançamento na própria casa'
);

-- Não é possível mudar household_id de um lançamento para uma casa da qual
-- o usuário não é membro (a política de update também valida o novo valor).
select throws_ok(
  $$ update transactions set household_id = '10000000-0000-0000-0000-000000000002'
     where id = '40000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'usuário A não consegue mover lançamento para casa da qual não é membro'
);

-- Usuário C, de outra casa: não vê nem altera nada da casa 1.
select tests.authenticate_as('20000000-0000-0000-0000-000000000002');

select is(
  (select count(*)::int from households where id = '10000000-0000-0000-0000-000000000001'),
  0,
  'usuário C não vê a casa 1'
);

select is(
  (select count(*)::int from transactions where household_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'usuário C não vê lançamentos da casa 1'
);

select throws_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
             'expense', 1000, current_date, 'pix') $$,
  '42501',
  null,
  'usuário C não consegue inserir lançamento na casa 1'
);

select is(
  (select count(*)::int from transactions
     where id = '40000000-0000-0000-0000-000000000001' and household_id = '10000000-0000-0000-0000-000000000002'),
  0,
  'o lançamento da casa 1 não foi movido para a casa 2'
);

-- Papel anon não lê nada.
select tests.authenticate_as_anon();

select throws_ok(
  $$ select 1 from households $$,
  '42501',
  null,
  'anon não tem acesso a households'
);

select throws_ok(
  $$ select 1 from transactions $$,
  '42501',
  null,
  'anon não tem acesso a transactions'
);

select * from finish();
rollback;
