-- Corrige l'erreur 42P17: infinite recursion detected in policy for relation "company_members"
-- Idée: ne plus référencer company_members depuis une policy de company_members

-- 1) Supprimer les policies problématiques
drop policy if exists members_select on public.company_members;
drop policy if exists members_cud_admin on public.company_members;

-- 2) Nouvelle policy SELECT: chaque utilisateur voit sa propre ligne d'adhésion
create policy members_select_self on public.company_members
  for select using (user_id = auth.uid());

-- 3) Nouvelle policy CUD: seul le OWNER (companies.user_id) peut gérer les membres (iteration 1)
-- (Nous réintroduirons ADMIN dans une itération ultérieure sans recursion)
create policy members_cud_owner on public.company_members
  for all using (
    (select c.user_id from public.companies c where c.id = company_id) = auth.uid()
  ) with check (
    (select c.user_id from public.companies c where c.id = company_id) = auth.uid()
  );



