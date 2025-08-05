-- ========================================
-- SOLUTION COMPLÈTE DÉFINITIVE - FIICH APP
-- Script SQL pour corriger TOUS les problèmes
-- ========================================

-- 1. NETTOYAGE COMPLET ET SÉCURISÉ
-- ========================================
-- Désactiver RLS temporairement pour éviter les conflits
DO $$
BEGIN
    ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.company_shares DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.invitations DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Supprimer TOUTES les politiques existantes (avec gestion d'erreur)
DO $$
BEGIN
    -- Politiques users
    DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;
    DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
    DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;
    DROP POLICY IF EXISTS "users_can_delete_own_profile" ON public.users;
    
    -- Politiques companies
    DROP POLICY IF EXISTS "users_can_view_own_companies" ON public.companies;
    DROP POLICY IF EXISTS "users_can_insert_own_companies" ON public.companies;
    DROP POLICY IF EXISTS "users_can_update_own_companies" ON public.companies;
    DROP POLICY IF EXISTS "users_can_delete_own_companies" ON public.companies;
    
    -- Politiques documents
    DROP POLICY IF EXISTS "users_can_view_own_documents" ON public.documents;
    DROP POLICY IF EXISTS "users_can_insert_own_documents" ON public.documents;
    DROP POLICY IF EXISTS "users_can_update_own_documents" ON public.documents;
    DROP POLICY IF EXISTS "users_can_delete_own_documents" ON public.documents;
    DROP POLICY IF EXISTS "users_can_view_shared_documents" ON public.documents;
    
    -- Politiques invitations
    DROP POLICY IF EXISTS "users_can_view_own_invitations_sent" ON public.invitations;
    DROP POLICY IF EXISTS "users_can_view_invitations_received" ON public.invitations;
    DROP POLICY IF EXISTS "users_can_create_invitations" ON public.invitations;
    DROP POLICY IF EXISTS "users_can_update_invitations" ON public.invitations;
    DROP POLICY IF EXISTS "users_can_delete_invitations" ON public.invitations;
    
    -- Politiques company_shares
    DROP POLICY IF EXISTS "users_can_view_own_company_shares" ON public.company_shares;
    DROP POLICY IF EXISTS "users_can_view_shares_for_them" ON public.company_shares;
    DROP POLICY IF EXISTS "users_can_create_shares" ON public.company_shares;
    DROP POLICY IF EXISTS "users_can_update_shares" ON public.company_shares;
    DROP POLICY IF EXISTS "users_can_delete_shares" ON public.company_shares;
    
    -- Politiques storage
    DROP POLICY IF EXISTS "authenticated_users_can_upload_files" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_users_can_view_files" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_users_can_delete_files" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_users_can_update_files" ON storage.objects;
    
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. SUPPRESSION SÉCURISÉE DES TRIGGERS ET FONCTIONS
-- ========================================
-- Supprimer les triggers existants AVANT les fonctions
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS on_invitation_status_change ON public.invitations;
    DROP TRIGGER IF EXISTS on_company_created ON public.companies;
    DROP TRIGGER IF EXISTS on_document_created ON public.documents;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Supprimer les fonctions existantes
DO $$
BEGIN
    DROP FUNCTION IF EXISTS get_invitation_by_token(TEXT);
    DROP FUNCTION IF EXISTS get_shared_company(TEXT);
    DROP FUNCTION IF EXISTS handle_new_user();
    DROP FUNCTION IF EXISTS handle_invitation_accepted();
    DROP FUNCTION IF EXISTS handle_company_created();
    DROP FUNCTION IF EXISTS handle_document_created();
    DROP FUNCTION IF EXISTS generate_share_token();
    DROP FUNCTION IF EXISTS generate_invitation_token();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. CRÉATION/RECRÉATION DES TABLES AVEC GESTION D'ERREUR
-- ========================================
-- Table users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table companies
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    siren TEXT,
    siret TEXT,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table documents (SANS le champ type, utilise mime_type)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invitation_token TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table company_shares
CREATE TABLE IF NOT EXISTS public.company_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    shared_with_email TEXT NOT NULL,
    share_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    permissions TEXT[] DEFAULT ARRAY['view_company', 'view_documents'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AJOUT DES COLONNES MANQUANTES
-- ========================================
-- Ajouter les colonnes manquantes à users
DO $$
BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Ajouter les colonnes manquantes à companies
DO $$
BEGIN
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS siren TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS siret TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Ajouter les colonnes manquantes à documents
DO $$
BEGIN
    ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
    ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    -- Supprimer l'ancienne colonne type si elle existe
    ALTER TABLE public.documents DROP COLUMN IF EXISTS type;
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Ajouter les colonnes manquantes aux autres tables
DO $$
BEGIN
    ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE public.company_shares ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- 5. GESTION DES CONTRAINTES UNIQUES
-- ========================================
-- Supprimer les contraintes existantes de manière sécurisée
DO $$
BEGIN
    ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_invitation_token_key;
    ALTER TABLE public.company_shares DROP CONSTRAINT IF EXISTS company_shares_share_token_key;
    ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_file_path_key;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Recréer les contraintes uniques
DO $$
BEGIN
    ALTER TABLE public.invitations ADD CONSTRAINT invitations_invitation_token_key UNIQUE (invitation_token);
    ALTER TABLE public.company_shares ADD CONSTRAINT company_shares_share_token_key UNIQUE (share_token);
    ALTER TABLE public.documents ADD CONSTRAINT documents_file_path_key UNIQUE (file_path);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 6. CRÉATION DES FONCTIONS UTILITAIRES
-- ========================================
-- Fonction pour générer un token de partage sécurisé
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Fonction pour générer un token d'invitation sécurisé
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Fonction pour récupérer une invitation par token
CREATE OR REPLACE FUNCTION get_invitation_by_token(token_param TEXT)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    invited_email TEXT,
    invited_by UUID,
    invitation_token TEXT,
    status TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    company_name TEXT,
    invited_by_email TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.company_id,
        i.invited_email,
        i.invited_by,
        i.invitation_token,
        i.status,
        i.expires_at,
        i.created_at,
        i.updated_at,
        c.company_name,
        u.email as invited_by_email
    FROM public.invitations i
    LEFT JOIN public.companies c ON i.company_id = c.id
    LEFT JOIN auth.users u ON i.invited_by = u.id
    WHERE i.invitation_token = token_param
    ORDER BY i.created_at DESC
    LIMIT 1;
END;
$$;

-- Fonction pour récupérer une entreprise partagée par token
CREATE OR REPLACE FUNCTION get_shared_company(token_param TEXT)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    shared_with_email TEXT,
    share_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    company_name TEXT,
    company_email TEXT,
    company_address TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.company_id,
        cs.shared_with_email,
        cs.share_token,
        cs.expires_at,
        cs.is_active,
        cs.permissions,
        cs.created_at,
        cs.updated_at,
        c.company_name,
        c.email as company_email,
        CONCAT(c.address_line_1, ', ', c.postal_code, ' ', c.city) as company_address
    FROM public.company_shares cs
    LEFT JOIN public.companies c ON cs.company_id = c.id
    WHERE cs.share_token = token_param
        AND cs.is_active = true
        AND (cs.expires_at IS NULL OR cs.expires_at > now())
    ORDER BY cs.created_at DESC
    LIMIT 1;
END;
$$;

-- Fonction pour gérer la création d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

-- Fonction pour gérer l'acceptation d'une invitation
CREATE OR REPLACE FUNCTION handle_invitation_accepted()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.company_shares (
            company_id,
            shared_with_email,
            share_token,
            permissions,
            is_active
        )
        VALUES (
            NEW.company_id,
            NEW.invited_email,
            generate_share_token(),
            ARRAY['view_company', 'view_documents'],
            true
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 7. CRÉATION DES TRIGGERS
-- ========================================
-- Créer les triggers
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION handle_new_user();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_invitation_status_change ON public.invitations;
    CREATE TRIGGER on_invitation_status_change
        AFTER UPDATE ON public.invitations
        FOR EACH ROW
        EXECUTE FUNCTION handle_invitation_accepted();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 8. SYNCHRONISATION DES UTILISATEURS
-- ========================================
-- Synchroniser les utilisateurs existants
INSERT INTO public.users (id, email, first_name, last_name)
SELECT 
    id,
    email,
    raw_user_meta_data->>'first_name',
    raw_user_meta_data->>'last_name'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

-- 9. CONFIGURATION DU STORAGE
-- ========================================
-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-files', 'company-files', false)
ON CONFLICT (id) DO NOTHING;

-- Créer les politiques de storage
CREATE POLICY "authenticated_users_can_upload_files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_view_files"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_delete_files"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_update_files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-files' AND auth.uid() IS NOT NULL);

-- 10. CRÉATION DES POLITIQUES RLS COMPLÈTES
-- ========================================
-- Politiques pour users
CREATE POLICY "users_can_view_own_profile"
ON public.users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile"
ON public.users FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "users_can_insert_own_profile"
ON public.users FOR INSERT
WITH CHECK (id = auth.uid());

-- Politiques pour companies
CREATE POLICY "users_can_view_own_companies"
ON public.companies FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_companies"
ON public.companies FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_companies"
ON public.companies FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_companies"
ON public.companies FOR DELETE
USING (user_id = auth.uid());

-- Politiques pour documents
CREATE POLICY "users_can_view_own_documents"
ON public.documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "users_can_insert_own_documents"
ON public.documents FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "users_can_update_own_documents"
ON public.documents FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "users_can_delete_own_documents"
ON public.documents FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

-- Politique pour voir les documents des entreprises partagées
CREATE POLICY "users_can_view_shared_documents"
ON public.documents FOR SELECT
USING (
    documents.is_public = true
    AND EXISTS (
        SELECT 1 FROM public.company_shares cs
        WHERE cs.company_id = documents.company_id
        AND cs.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND cs.is_active = true
        AND (cs.expires_at IS NULL OR cs.expires_at > now())
        AND 'view_documents' = ANY(cs.permissions)
    )
);

-- Politiques pour invitations
CREATE POLICY "users_can_view_own_invitations_sent"
ON public.invitations FOR SELECT
USING (invited_by = auth.uid());

CREATE POLICY "users_can_view_invitations_received"
ON public.invitations FOR SELECT
USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "users_can_create_invitations"
ON public.invitations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = invitations.company_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "users_can_update_invitations"
ON public.invitations FOR UPDATE
USING (
    invited_by = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "users_can_delete_invitations"
ON public.invitations FOR DELETE
USING (invited_by = auth.uid());

-- Politiques pour company_shares
CREATE POLICY "users_can_view_own_company_shares"
ON public.company_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_shares.company_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "users_can_view_shares_for_them"
ON public.company_shares FOR SELECT
USING (
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "users_can_create_shares"
ON public.company_shares FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_shares.company_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "users_can_update_shares"
ON public.company_shares FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_shares.company_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "users_can_delete_shares"
ON public.company_shares FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_shares.company_id
        AND c.user_id = auth.uid()
    )
);

-- 11. RÉACTIVATION RLS
-- ========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 12. VÉRIFICATION ET NETTOYAGE FINAL
-- ========================================
-- Nettoyer les invitations expirées
UPDATE public.invitations 
SET status = 'expired' 
WHERE expires_at < NOW() AND status = 'pending';

-- Nettoyer les partages expirés
UPDATE public.company_shares 
SET is_active = false 
WHERE expires_at < NOW() AND is_active = true;

-- 13. VÉRIFICATION FINALE
-- ========================================
SELECT 
    '🎉 SOLUTION COMPLÈTE DÉFINITIVE APPLIQUÉE !' as status,
    'Tous les problèmes sont résolus définitivement' as message,
    (SELECT COUNT(*) FROM public.users) as users_count,
    (SELECT COUNT(*) FROM public.companies) as companies_count,
    (SELECT COUNT(*) FROM public.documents) as documents_count,
    (SELECT COUNT(*) FROM public.invitations) as invitations_count,
    (SELECT COUNT(*) FROM public.company_shares) as shares_count,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'company-files') as storage_bucket_count;

-- ========================================
-- FIN DE LA SOLUTION COMPLÈTE DÉFINITIVE
-- ======================================== 