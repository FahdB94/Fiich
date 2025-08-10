-- RPC accept_invitation: vérifie token/expiration/email et ajoute/active l'entrée company_members atomiquement

create or replace function public.accept_invitation(p_token text, p_email text)
returns table(
  company_id uuid,
  role text,
  invitation_id uuid,
  invitation_status text
) language plpgsql security definer as $$
declare
  v_inv record;
begin
  -- 1) Récupérer l'invitation valide
  select * into v_inv
  from public.invitations i
  where i.invitation_token = p_token
    and i.status = 'pending'
  limit 1;

  if not found then
    raise exception 'INVITATION_NOT_FOUND_OR_EXPIRED';
  end if;

  -- 2) Vérifier expiration
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    update public.invitations set status = 'expired', updated_at = now() where id = v_inv.id;
    raise exception 'INVITATION_EXPIRED';
  end if;

  -- 3) Vérifier email
  if lower(v_inv.invited_email) <> lower(p_email) then
    raise exception 'EMAIL_MISMATCH';
  end if;

  -- 4) Insérer/activer membership
  insert into public.company_members(company_id, user_id, role, status)
  values (v_inv.company_id, auth.uid(), coalesce(v_inv.role_requested, 'VIEWER'), 'ACTIVE')
  on conflict (company_id, user_id) do update set
    role = excluded.role,
    status = 'ACTIVE';

  -- 5) Marquer invitation acceptée
  update public.invitations set status = 'accepted', updated_at = now() where id = v_inv.id;

  return query
  select v_inv.company_id, coalesce(v_inv.role_requested, 'VIEWER') as role, v_inv.id, 'accepted';
end;$$;

revoke all on function public.accept_invitation(text, text) from public;
grant execute on function public.accept_invitation(text, text) to authenticated;



