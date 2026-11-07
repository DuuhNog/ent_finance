begin;
select plan(4);

insert into households (id, name) values ('10000000-0000-0000-0000-000000000001', 'Casa 1');
select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');
insert into household_members (household_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
insert into categories (id, household_id, name, kind) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Compras', 'expense');

select tests.authenticate_as('20000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ select create_installment_purchase(
       '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
       10000, 3, '2024-01-31', 'Compra teste'
     ) $$,
  'compra parcelada válida é criada'
);

select is(
  (select sum(amount_cents)::int from transactions
     where household_id = '10000000-0000-0000-0000-000000000001'),
  10000,
  'a soma das parcelas é exatamente igual ao total'
);

-- Número de parcelas inválido (fora de 2..24): falha inteira, nada é criado.
select throws_ok(
  $$ select create_installment_purchase(
       '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
       10000, 25, '2024-01-31', 'Compra inválida'
     ) $$,
  'P0001',
  null,
  'número de parcelas inválido é rejeitado'
);

select is(
  (select count(*)::int from transactions
     where household_id = '10000000-0000-0000-0000-000000000001'),
  3,
  'a tentativa inválida não criou nenhuma linha'
);

select * from finish();
rollback;
