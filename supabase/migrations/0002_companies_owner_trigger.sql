-- Trigger: à la création d'une entreprise, créer l'entrée OWNER dans company_members

create or replace function public.add_owner_membership()
returns trigger language plpgsql security definer as $$
begin
  -- si déjà présent, ignorer
  if exists (
    select 1 from public.company_members m
    where m.company_id = new.id and m.user_id = new.user_id
  ) then
    return new;
  end if;

  insert into public.company_members (company_id, user_id, role, status)
  values (new.id, new.user_id, 'OWNER', 'ACTIVE')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_companies_add_owner on public.companies;
create trigger trg_companies_add_owner
after insert on public.companies
for each row execute function public.add_owner_membership();



