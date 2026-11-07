begin;
select plan(2);

insert into households (id, name) values ('10000000-0000-0000-0000-000000000001', 'Casa 1');
select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');
insert into household_members (household_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
insert into categories (id, household_id, name, kind) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mercado', 'expense');
insert into transactions (id, household_id, category_id, kind, amount_cents, occurred_on, payment_method, created_by)
values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001', 'expense', 5000, current_date, 'pix',
        '20000000-0000-0000-0000-000000000001');

select tests.authenticate_as('20000000-0000-0000-0000-000000000001');

-- Exclusão é sempre soft delete: não existe política de delete, e o
-- privilégio é revogado explicitamente para `authenticated`.
select throws_ok(
  $$ delete from transactions where id = '40000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'authenticated não consegue fazer delete em transactions'
);

select lives_ok(
  $$ update transactions set deleted_at = now() where id = '40000000-0000-0000-0000-000000000001' $$,
  'soft delete via update continua permitido'
);

select * from finish();
rollback;
