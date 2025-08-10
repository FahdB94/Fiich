-- Simplifie les policies UPDATE/DELETE sur companies pour éviter toute récursion

drop policy if exists companies_update_admin on public.companies;
drop policy if exists companies_delete_owner on public.companies;

create policy companies_update_owner_only on public.companies
  for update using (user_id = auth.uid());

create policy companies_delete_owner_only on public.companies
  for delete using (user_id = auth.uid());



