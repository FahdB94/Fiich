-- Rendre is_company_member non récursive via SECURITY DEFINER (bypass RLS)

create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_member boolean;
begin
  select exists (
    select 1
    from public.company_members m
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
  ) into v_is_member;
  return coalesce(v_is_member, false);
end;
$$;

revoke all on function public.is_company_member(uuid) from public;
grant execute on function public.is_company_member(uuid) to authenticated;



