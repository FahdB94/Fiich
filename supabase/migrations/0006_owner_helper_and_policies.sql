-- Helper sécurisé pour éviter la récursion: vérifie si l'utilisateur courant est OWNER d'une company
-- SECURITY DEFINER => le SELECT sur companies ne déclenche pas les policies RLS (pas de boucle)

create or replace function public.is_company_owner(p_company_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_owner boolean;
begin
  select exists (
    select 1 from public.companies c
    where c.id = p_company_id and c.user_id = auth.uid()
  ) into v_is_owner;
  return coalesce(v_is_owner, false);
end;
$$;

revoke all on function public.is_company_owner(uuid) from public;
grant execute on function public.is_company_owner(uuid) to authenticated;

-- Recréer les policies company_members CUD en utilisant la fonction (pas de sous-requête companies)
drop policy if exists members_insert_owner on public.company_members;
drop policy if exists members_update_owner on public.company_members;
drop policy if exists members_delete_owner on public.company_members;

create policy members_insert_owner on public.company_members
  for insert
  with check (public.is_company_owner(company_id));

create policy members_update_owner on public.company_members
  for update
  using (public.is_company_owner(company_id))
  with check (public.is_company_owner(company_id));

create policy members_delete_owner on public.company_members
  for delete
  using (public.is_company_owner(company_id));



