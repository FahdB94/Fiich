-- Correction complète des problèmes RLS des invitations
-- Cette migration résout le problème "permission denied for table users"

-- 1. Nettoyer toutes les politiques existantes
drop policy if exists invitations_select_admin on public.invitations;
drop policy if exists invitations_select_recipient on public.invitations;
drop policy if exists invitations_cud_admin on public.invitations;
drop policy if exists invitations_cud_admin_function on public.invitations;

-- 2. S'assurer que RLS est activé
alter table public.invitations enable row level security;

-- 3. Créer une politique simple et efficace basée sur la propriété directe de l'entreprise
create policy invitations_owner_access on public.invitations
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

-- 4. Politique alternative pour les membres ADMIN (si nécessaire)
create policy invitations_admin_access on public.invitations
  for all using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id 
        and cm.user_id = auth.uid() 
        and cm.role = 'ADMIN'
        and cm.status = 'ACTIVE'
    )
  ) with check (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id 
        and cm.user_id = auth.uid() 
        and cm.role = 'ADMIN'
        and cm.status = 'ACTIVE'
    )
  );

-- 5. Politique pour permettre aux destinataires de voir leurs invitations
create policy invitations_recipient_view on public.invitations
  for select using (
    lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

-- 6. S'assurer que les permissions sont correctes
grant usage on schema public to authenticated;
grant all on public.invitations to authenticated;
grant all on public.companies to authenticated;
grant all on public.company_members to authenticated;

-- 7. Vérifier que la fonction helper fonctionne
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

-- 8. Créer une fonction pour vérifier les permissions d'invitation
create or replace function public.can_manage_invitations(p_company_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  -- Propriétaire de l'entreprise
  if exists (
    select 1 from public.companies 
    where id = p_company_id and user_id = auth.uid()
  ) then
    return true;
  end if;
  
  -- Membre ADMIN de l'entreprise
  if exists (
    select 1 from public.company_members 
    where company_id = p_company_id 
      and user_id = auth.uid() 
      and role = 'ADMIN' 
      and status = 'ACTIVE'
  ) then
    return true;
  end if;
  
  return false;
end;
$$;

-- 9. Politique utilisant la fonction helper (optionnel)
create policy invitations_function_based on public.invitations
  for all using (
    public.can_manage_invitations(company_id)
  ) with check (
    public.can_manage_invitations(company_id)
  );

-- 10. S'assurer que les utilisateurs sont bien dans company_members
insert into public.company_members (company_id, user_id, role, status)
select 
  c.id as company_id,
  c.user_id,
  'OWNER'::text as role,
  'ACTIVE'::text as status
from public.companies c
where c.user_id = auth.uid()
  and not exists (
    select 1 from public.company_members cm 
    where cm.company_id = c.id and cm.user_id = c.user_id
  )
on conflict (company_id, user_id) do nothing;

-- 11. Vérifier que la table invitations a la bonne structure
-- (ajouter des colonnes manquantes si nécessaire)
do $$
begin
  -- Ajouter la colonne invited_by si elle n'existe pas
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'invitations' 
      and column_name = 'invited_by'
      and table_schema = 'public'
  ) then
    alter table public.invitations add column invited_by uuid references auth.users(id);
  end if;
  
  -- Ajouter la colonne expires_at si elle n'existe pas
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'invitations' 
      and column_name = 'expires_at'
      and table_schema = 'public'
  ) then
    alter table public.invitations add column expires_at timestamp with time zone;
  end if;
end $$;
