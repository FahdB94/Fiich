-- 🧹 Script de Nettoyage Complet de la Base de Données Fiich
-- Ce script supprime toutes les tables existantes et recrée un schéma propre

-- 1. Désactiver RLS temporairement
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. Supprimer toutes les tables existantes
DROP TABLE IF EXISTS 
    company_shares,
    company_members,
    company_contacts,
    documents,
    invitations,
    notifications,
    companies,
    users,
    plans,
    company_subscriptions,
    CASCADE;

-- 3. Supprimer toutes les fonctions
DROP FUNCTION IF EXISTS 
    get_invitation_by_token,
    get_invitation_by_token_simple,
    CASCADE;

-- 4. Supprimer tous les triggers
DROP TRIGGER IF EXISTS 
    update_updated_at_column,
    update_updated_at_column_documents,
    update_updated_at_column_companies,
    CASCADE;

-- 5. Supprimer tous les types personnalisés
DROP TYPE IF EXISTS 
    document_type,
    invitation_status,
    share_permission,
    user_role,
    CASCADE;

-- 6. Nettoyer le storage
-- Note: Ceci sera fait via l'API Supabase

-- 7. Réinitialiser les séquences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE;';
    END LOOP;
END $$;

-- 8. Nettoyer les extensions inutiles
-- Garder seulement les extensions essentielles

-- 9. Vérifier qu'il ne reste rien
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 10. Vérifier les fonctions restantes
SELECT 
    n.nspname as schema,
    p.proname as function_name
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '🧹 Base de données nettoyée avec succès !';
    RAISE NOTICE '📋 Prêt pour la création du nouveau schéma propre.';
END $$;
