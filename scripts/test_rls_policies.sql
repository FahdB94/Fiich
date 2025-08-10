-- Script de test pour vérifier les politiques RLS
-- À exécuter dans le tableau de bord Supabase SQL Editor

-- 1. Vérifier que RLS est activé sur les tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('invitations', 'companies', 'company_members');

-- 2. Lister toutes les politiques RLS sur la table invitations
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'invitations' AND schemaname = 'public';

-- 3. Vérifier les permissions sur la table invitations
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'invitations' AND table_schema = 'public';

-- 4. Tester la fonction is_company_owner
-- Remplacez 'USER_ID_HERE' par l'ID d'un utilisateur réel
SELECT 
  c.id as company_id,
  c.company_name,
  public.is_company_owner(c.id) as is_owner
FROM public.companies c
LIMIT 5;

-- 5. Vérifier la structure de la table invitations
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Vérifier les contraintes sur la table invitations
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'invitations' AND table_schema = 'public';

-- 7. Tester une insertion simulée (à adapter selon vos données)
-- INSERT INTO public.invitations (
--   company_id,
--   invited_email,
--   invited_by,
--   invitation_token,
--   role_requested,
--   expires_at
-- ) VALUES (
--   'COMPANY_ID_HERE',
--   'test@example.com',
--   'USER_ID_HERE',
--   'test-token',
--   'VIEWER',
--   NOW() + INTERVAL '7 days'
-- );
