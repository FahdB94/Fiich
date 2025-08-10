-- Restaurer les politiques CUD manquantes pour invitations (supprimées par 0014)

-- Politique pour créer/modifier/supprimer des invitations (OWNER/ADMIN uniquement)
drop policy if exists invitations_cud_admin on public.invitations;
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
