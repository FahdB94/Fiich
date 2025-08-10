-- Évite la récursion en limitant la policy CUD de company_members à INSERT/UPDATE/DELETE (plus de FOR ALL)

-- 1) Supprimer la policy fourre-tout
drop policy if exists members_cud_owner on public.company_members;

-- 2) Recréer des policies spécifiques
create policy members_insert_owner on public.company_members
  for insert
  with check ((select c.user_id from public.companies c where c.id = company_id) = auth.uid());

create policy members_update_owner on public.company_members
  for update
  using ((select c.user_id from public.companies c where c.id = company_id) = auth.uid())
  with check ((select c.user_id from public.companies c where c.id = company_id) = auth.uid());

create policy members_delete_owner on public.company_members
  for delete
  using ((select c.user_id from public.companies c where c.id = company_id) = auth.uid());



