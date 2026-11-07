begin;
select plan(3);

insert into households (id, name) values ('10000000-0000-0000-0000-000000000001', 'Casa 1');
select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');
insert into household_members (household_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');

select tests.authenticate_as('20000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ insert into categories (id, household_id, name, kind)
     values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Lazer', 'expense') $$,
  'criação de categoria é aceita'
);

select is(
  (select count(*)::int from audit_log
     where table_name = 'categories' and action = 'insert'
       and row_id = '30000000-0000-0000-0000-000000000001'),
  1,
  'a criação gerou uma linha em audit_log'
);

update categories set name = 'Lazer e hobbies'
  where id = '30000000-0000-0000-0000-000000000001';

select is(
  (select count(*)::int from audit_log
     where table_name = 'categories' and action = 'update'
       and row_id = '30000000-0000-0000-0000-000000000001'),
  1,
  'a alteração gerou uma linha em audit_log'
);

select * from finish();
rollback;
