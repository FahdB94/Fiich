-- Autoriser les destinataires à lire leurs invitations (évite 403 sur /api/invitations et hooks)

drop policy if exists invitations_select_admin on public.invitations;
create policy invitations_select_admin on public.invitations
  for select using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  );

drop policy if exists invitations_select_recipient on public.invitations;
create policy invitations_select_recipient on public.invitations
  for select using (
    lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );


