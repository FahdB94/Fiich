-- Ajout de colonnes profil côté invitations pour pré-remplir à l'acceptation

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='invitations' and column_name='first_name'
  ) then
    alter table public.invitations add column first_name text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='invitations' and column_name='last_name'
  ) then
    alter table public.invitations add column last_name text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='invitations' and column_name='department'
  ) then
    alter table public.invitations add column department text;
  end if;
end $$;


