begin;
select plan(2);

insert into households (id, name) values ('10000000-0000-0000-0000-000000000001', 'Casa 1');
select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');
insert into household_members (household_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
insert into categories (id, household_id, name, kind) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Contas da casa', 'expense');
insert into recurring_bills (id, household_id, category_id, name, amount_cents, due_day, payment_method)
values ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001', 'Internet', 15000, 10, 'boleto');

select tests.authenticate_as('20000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ select pay_recurring_bill('50000000-0000-0000-0000-000000000001', '2024-03-01', 15000) $$,
  'primeiro pagamento da conta em março é aceito'
);

select throws_ok(
  $$ select pay_recurring_bill('50000000-0000-0000-0000-000000000001', '2024-03-01', 15000) $$,
  '23505',
  null,
  'pagar a mesma conta duas vezes na mesma competência é rejeitado'
);

select * from finish();
rollback;
