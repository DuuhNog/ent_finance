begin;
select plan(5);

-- Duas casas, cada uma com sua categoria.
insert into households (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Casa 1'),
  ('10000000-0000-0000-0000-000000000002', 'Casa 2');

select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');

insert into household_members (household_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');

insert into categories (id, household_id, name, kind) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mercado', 'expense'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Mercado da Casa 2', 'expense');

select tests.authenticate_as('20000000-0000-0000-0000-000000000001');

-- Usuário A (só da Casa 1) não consegue lançar na própria casa usando uma
-- categoria que pertence à Casa 2.
select throws_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
             'expense', 1000, current_date, 'pix') $$,
  '42501',
  null,
  'lançamento com categoria de outra casa é rejeitado'
);

select throws_ok(
  $$ insert into recurring_bills (household_id, category_id, name, amount_cents, due_day, payment_method)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
             'Conta teste', 5000, 10, 'pix') $$,
  '42501',
  null,
  'conta recorrente com categoria de outra casa é rejeitada'
);

select throws_ok(
  $$ insert into goals (household_id, kind, amount_cents, category_id)
     values ('10000000-0000-0000-0000-000000000001', 'category_limit', 100000,
             '30000000-0000-0000-0000-000000000002') $$,
  '42501',
  null,
  'meta de categoria de outra casa é rejeitada'
);

select throws_ok(
  $$ select create_installment_purchase(
       '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002',
       9000, 3, current_date, 'teste'
     ) $$,
  '42501',
  null,
  'compra parcelada com categoria de outra casa é rejeitada'
);

-- Confere que a própria categoria continua funcionando (não quebramos o
-- caminho feliz ao corrigir a checagem).
select lives_ok(
  $$ insert into transactions (household_id, category_id, kind, amount_cents, occurred_on, payment_method)
     values ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
             'expense', 1000, current_date, 'pix') $$,
  'lançamento com categoria da própria casa continua aceito'
);

select * from finish();
rollback;
