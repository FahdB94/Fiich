-- Autoriser l'OWNER (companies.user_id) même si l'entrée company_members manque

create or replace function public.get_company_members(p_company_id uuid)
returns table(
  user_id uuid,
  email text,
  role text,
  status text
) language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_company_member(p_company_id) or public.is_company_owner(p_company_id)) then
    raise exception 'FORBIDDEN';
  end if;
  return query
  select m.user_id,
         u.email,
         m.role,
         m.status
  from public.company_members m
  left join auth.users u on u.id = m.user_id
  where m.company_id = p_company_id
  order by case m.role when 'OWNER' then 0 when 'ADMIN' then 1 when 'MEMBER' then 2 else 3 end,
           u.email nulls last;
end$$;

revoke all on function public.get_company_members(uuid) from public;
grant execute on function public.get_company_members(uuid) to authenticated;



