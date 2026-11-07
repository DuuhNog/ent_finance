begin;
select plan(5);

insert into households (id, name) values ('10000000-0000-0000-0000-000000000001', 'Casa 1');
select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');
insert into categories (id, household_id, name, kind) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mercado', 'expense');

-- Os checks de valor valem para qualquer papel, inclusive o dono da tabela
-- (postgres), então não precisa autenticar como household member aqui;
-- `created_by` é passado explicitamente porque não há `auth.uid()` fora de
-- uma sessão autenticada.

select throws_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method, created_by)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
             'expense', 0, current_date, 'pix', '20000000-0000-0000-0000-000000000001') $$,
  '23514',
  null,
  'amount_cents = 0 é rejeitado'
);

select throws_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method, created_by)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
             'expense', -500, current_date, 'pix', '20000000-0000-0000-0000-000000000001') $$,
  '23514',
  null,
  'amount_cents negativo é rejeitado'
);

select throws_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method, created_by)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
             'expense', 1000000001, current_date, 'pix', '20000000-0000-0000-0000-000000000001') $$,
  '23514',
  null,
  'amount_cents acima do limite é rejeitado'
);

select lives_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method, created_by)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
             'expense', 1000000000, current_date, 'pix', '20000000-0000-0000-0000-000000000001') $$,
  'amount_cents exatamente no limite é aceito'
);

select lives_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method, created_by)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
             'expense', 100, current_date, 'pix', '20000000-0000-0000-0000-000000000001') $$,
  'amount_cents normal é aceito'
);

select * from finish();
rollback;
