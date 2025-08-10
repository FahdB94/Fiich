-- Inclure l'OWNER même si aucune ligne dans company_members

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
  with owner as (
    select c.user_id as user_id,
           u.email,
           'OWNER'::text as role,
           'ACTIVE'::text as status
    from public.companies c
    left join auth.users u on u.id = c.user_id
    where c.id = p_company_id
  ), members as (
    select m.user_id,
           u.email,
           m.role,
           m.status
    from public.company_members m
    left join auth.users u on u.id = m.user_id
    where m.company_id = p_company_id
  )
  select * from members
  union all
  select o.user_id, o.email, o.role, o.status
  from owner o
  where not exists (
    select 1 from public.company_members m
    where m.company_id = p_company_id and m.user_id = o.user_id
  )
  order by case role when 'OWNER' then 0 when 'ADMIN' then 1 when 'MEMBER' then 2 else 3 end,
           email nulls last;
end$$;

revoke all on function public.get_company_members(uuid) from public;
grant execute on function public.get_company_members(uuid) to authenticated;



