-- Seeds minimales pour tests locaux

insert into public.plans (id, code, name, features, is_active)
values
  (gen_random_uuid(), 'FREE', 'Free', '{"docs_limit":10}'::jsonb, true)
on conflict do nothing;

insert into public.plans (id, code, name, features, is_active)
values
  (gen_random_uuid(), 'PRO', 'Pro', '{"docs_limit":100}'::jsonb, true)
on conflict do nothing;

insert into public.plans (id, code, name, features, is_active)
values
  (gen_random_uuid(), 'BUSINESS', 'Business', '{"docs_limit":1000}'::jsonb, true)
on conflict do nothing;



