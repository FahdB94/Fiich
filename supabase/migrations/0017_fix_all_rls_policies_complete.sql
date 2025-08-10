-- Correction complète de toutes les politiques RLS (résout les erreurs 403/500)

-- 1. Supprimer toutes les politiques existantes pour repartir proprement
drop policy if exists invitations_select_admin on public.invitations;
drop policy if exists invitations_select_recipient on public.invitations;
drop policy if exists invitations_cud_admin on public.invitations;

-- 2. Politiques SELECT pour invitations
create policy invitations_select_admin on public.invitations
  for select using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  );

create policy invitations_select_recipient on public.invitations
  for select using (
    lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

-- 3. Politiques CUD pour invitations (OWNER/ADMIN uniquement)
create policy invitations_cud_admin on public.invitations
  for all using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  ) with check (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  );

-- 4. Vérifier que les fonctions helper existent et sont correctes
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

create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return public.is_company_owner(p_company_id) or exists (
    select 1 from public.company_members 
    where company_id = p_company_id and user_id = auth.uid()
  );
end;
$$;

-- 5. S'assurer que l'utilisateur actuel est bien dans company_members pour son entreprise
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
