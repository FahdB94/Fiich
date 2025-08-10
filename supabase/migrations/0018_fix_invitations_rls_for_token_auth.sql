-- Correction de la politique RLS des invitations pour l'authentification par token
-- Problème: auth.uid() ne fonctionne pas correctement avec les tokens utilisateur dans l'API

-- 1. Supprimer la politique problématique
drop policy if exists invitations_cud_admin on public.invitations;

-- 2. Créer une nouvelle politique qui fonctionne avec l'authentification par token
create policy invitations_cud_admin on public.invitations
  for all using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id 
        and cm.user_id = auth.uid() 
        and cm.role in ('OWNER','ADMIN')
        and cm.status = 'ACTIVE'
    )
  ) with check (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id 
        and cm.user_id = auth.uid() 
        and cm.role in ('OWNER','ADMIN')
        and cm.status = 'ACTIVE'
    )
  );

-- 3. Alternative: Politique basée sur la vérification directe de l'entreprise
-- Si la politique ci-dessus ne fonctionne toujours pas, utiliser celle-ci:
-- create policy invitations_cud_admin_alt on public.invitations
--   for all using (
--     exists (
--       select 1 from public.companies c
--       where c.id = company_id 
--         and c.user_id = auth.uid()
--     )
--   ) with check (
--     exists (
--       select 1 from public.companies c
--       where c.id = company_id 
--         and c.user_id = auth.uid()
--     )
--   );

-- 4. Vérifier que RLS est activé sur la table invitations
alter table public.invitations enable row level security;

-- 5. S'assurer que la table company_members a les bonnes politiques
create policy if not exists company_members_select_owner on public.company_members
  for select using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.user_id = auth.uid()
    )
  );

create policy if not exists company_members_insert_owner on public.company_members
  for insert with check (
    exists (
      select 1 from public.companies c
      where c.id = company_id and c.user_id = auth.uid()
    )
  );
