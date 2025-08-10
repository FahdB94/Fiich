-- Approche alternative pour la politique RLS des invitations
-- Utilise une vérification directe de la propriété de l'entreprise

-- 1. Supprimer la politique précédente
drop policy if exists invitations_cud_admin on public.invitations;

-- 2. Créer une politique simplifiée basée sur la propriété directe de l'entreprise
create policy invitations_cud_admin on public.invitations
  for all using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.user_id = auth.uid()
    )
  );

-- 3. Politique alternative plus permissive pour les tests (à supprimer en production)
-- create policy invitations_cud_admin_test on public.invitations
--   for all using (true) with check (true);

-- 4. Vérifier que la fonction is_company_owner fonctionne correctement
create or replace function public.is_company_owner(p_company_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.companies 
    where id = p_company_id and user_id = auth.uid()
  );
end;
$$;

-- 5. Politique utilisant la fonction helper
create policy invitations_cud_admin_function on public.invitations
  for all using (
    public.is_company_owner(company_id)
  ) with check (
    public.is_company_owner(company_id)
  );

-- 6. S'assurer que les permissions sont correctes
grant usage on schema public to authenticated;
grant all on public.invitations to authenticated;
grant all on public.companies to authenticated;
grant all on public.company_members to authenticated;
