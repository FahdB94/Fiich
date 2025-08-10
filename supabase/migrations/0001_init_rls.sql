-- Itération 1: RLS minimal et structures de base manquantes
-- Idempotent via IF NOT EXISTS

-- 1) Tables manquantes minimales
create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('OWNER','ADMIN','MEMBER','VIEWER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PENDING')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code in ('FREE','PRO','BUSINESS')),
  name text not null,
  features jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.company_subscriptions (
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','CANCELED','TRIALING')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  primary key (company_id, plan_id)
);

-- Colonnes manquantes potentielles sur documents
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='documents' and column_name='category'
  ) then
    alter table public.documents add column category text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='documents' and column_name='mime'
  ) then
    alter table public.documents add column mime text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='documents' and column_name='size'
  ) then
    alter table public.documents add column size bigint;
  end if;
end $$;

-- 2) RLS activation
alter table if exists public.companies enable row level security;
alter table if exists public.company_members enable row level security;
alter table if exists public.documents enable row level security;
alter table if exists public.invitations enable row level security;
alter table if exists public.company_subscriptions enable row level security;

-- 3) Policies minimales
-- Helper: est-membre(company_id)
create or replace function public.is_company_member(p_company_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.company_members m
    where m.company_id = p_company_id and m.user_id = auth.uid()
  )
$$;

-- companies
drop policy if exists companies_select_members on public.companies;
create policy companies_select_members on public.companies
  for select using (
    public.is_company_member(id) OR user_id = auth.uid()
  );

drop policy if exists companies_insert_owner on public.companies;
create policy companies_insert_owner on public.companies
  for insert with check (user_id = auth.uid());

drop policy if exists companies_update_admin on public.companies;
create policy companies_update_admin on public.companies
  for update using (
    user_id = auth.uid() OR exists (
      select 1 from public.company_members cm
      where cm.company_id = id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  );

drop policy if exists companies_delete_owner on public.companies;
create policy companies_delete_owner on public.companies
  for delete using (
    user_id = auth.uid() OR exists (
      select 1 from public.company_members cm
      where cm.company_id = id and cm.user_id = auth.uid() and cm.role = 'OWNER'
    )
  );

-- company_members
drop policy if exists members_select on public.company_members;
create policy members_select on public.company_members
  for select using (public.is_company_member(company_id));

drop policy if exists members_cud_admin on public.company_members;
create policy members_cud_admin on public.company_members
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

-- documents
drop policy if exists documents_select_members on public.documents;
create policy documents_select_members on public.documents
  for select using (public.is_company_member(company_id));

drop policy if exists documents_cud_member on public.documents;
create policy documents_cud_member on public.documents
  for all using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN','MEMBER')
    )
  ) with check (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN','MEMBER')
    )
  );

-- invitations (ADMIN+)
drop policy if exists invitations_select_admin on public.invitations;
create policy invitations_select_admin on public.invitations
  for select using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  );

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

-- company_subscriptions (ADMIN+)
drop policy if exists subs_select_admin on public.company_subscriptions;
create policy subs_select_admin on public.company_subscriptions
  for select using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  );

drop policy if exists subs_upsert_admin on public.company_subscriptions;
create policy subs_upsert_admin on public.company_subscriptions
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


