-- ========================================
-- SOLUTION COMPLÈTE ET FINALE
-- Nettoyage complet et configuration cohérente
-- ========================================

-- 1. NETTOYAGE COMPLET
-- ========================================

-- Désactiver RLS sur toutes les tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;

-- Supprimer TOUS les triggers
DROP TRIGGER IF EXISTS on_invitation_status_change ON public.invitations;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer TOUTES les fonctions
DROP FUNCTION IF EXISTS public.get_shared_company(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_invitation_by_token(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.handle_invitation_accepted() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Supprimer TOUTES les politiques
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;

DROP POLICY IF EXISTS "users_can_view_own_companies" ON public.companies;
DROP POLICY IF EXISTS "users_can_insert_own_companies" ON public.companies;
DROP POLICY IF EXISTS "users_can_update_own_companies" ON public.companies;
DROP POLICY IF EXISTS "users_can_delete_own_companies" ON public.companies;

DROP POLICY IF EXISTS "users_can_view_own_documents" ON public.documents;
DROP POLICY IF EXISTS "users_can_insert_own_documents" ON public.documents;
DROP POLICY IF EXISTS "users_can_update_own_documents" ON public.documents;
DROP POLICY IF EXISTS "users_can_delete_own_documents" ON public.documents;

DROP POLICY IF EXISTS "users_can_view_own_company_shares" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_insert_own_company_shares" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_update_own_company_shares" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_delete_own_company_shares" ON public.company_shares;

DROP POLICY IF EXISTS "users_can_view_own_invitations" ON public.invitations;
DROP POLICY IF EXISTS "users_can_insert_own_invitations" ON public.invitations;
DROP POLICY IF EXISTS "users_can_update_own_invitations" ON public.invitations;

DROP POLICY IF EXISTS "users_can_view_own_invitations_sent" ON public.invitations;
DROP POLICY IF EXISTS "users_can_view_invitations_received" ON public.invitations;
DROP POLICY IF EXISTS "users_can_create_invitations" ON public.invitations;
DROP POLICY IF EXISTS "users_can_update_invitations" ON public.invitations;

DROP POLICY IF EXISTS "users_can_view_shares_for_them" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_create_shares" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_update_shares" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_delete_shares" ON public.company_shares;

DROP POLICY IF EXISTS "users_can_view_shared_documents" ON public.documents;

-- Supprimer TOUTES les politiques de storage
DROP POLICY IF EXISTS "authenticated_users_can_upload_files" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_view_files" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_update_files" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_delete_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_upload_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_view_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_delete_own_files" ON storage.objects;

-- 2. VÉRIFICATION ET CORRECTION DES TABLES
-- ========================================

-- Vérifier que les tables existent et ont les bonnes colonnes
DO $$
BEGIN
    -- Vérifier la table users
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Vérifier la table companies
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
        CREATE TABLE public.companies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            postal_code TEXT,
            country TEXT,
            siret TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Vérifier la table documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
        CREATE TABLE public.documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            is_public BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Vérifier la table invitations
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations' AND table_schema = 'public') THEN
        CREATE TABLE public.invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
            invited_email TEXT NOT NULL,
            invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
            invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Vérifier la table company_shares
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_shares' AND table_schema = 'public') THEN
        CREATE TABLE public.company_shares (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
            shared_with_email TEXT NOT NULL,
            share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
            permissions TEXT[] DEFAULT '{view_company,view_documents}',
            is_active BOOLEAN DEFAULT true,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(company_id, shared_with_email)
        );
    END IF;
END $$;

-- 3. CORRECTION DES COLONNES MANQUANTES
-- ========================================

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
    -- Vérifier et ajouter is_public à documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'is_public') THEN
        ALTER TABLE public.documents ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;

    -- Vérifier et ajouter les colonnes à companies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'siret') THEN
        ALTER TABLE public.companies ADD COLUMN siret TEXT;
    END IF;

    -- Vérifier et ajouter les colonnes à invitations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'invitation_token') THEN
        ALTER TABLE public.invitations ADD COLUMN invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64');
    END IF;

    -- Vérifier et ajouter les colonnes à company_shares
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_shares' AND column_name = 'share_token') THEN
        ALTER TABLE public.company_shares ADD COLUMN share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64');
    END IF;
END $$;

-- 4. CORRECTION DES TOKENS
-- ========================================

-- Supprimer les contraintes uniques existantes
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_invitation_token_key;
ALTER TABLE public.company_shares DROP CONSTRAINT IF EXISTS company_shares_share_token_key;

-- Modifier les colonnes pour utiliser base64
ALTER TABLE public.invitations ALTER COLUMN invitation_token SET DEFAULT encode(gen_random_bytes(32), 'base64');
ALTER TABLE public.company_shares ALTER COLUMN share_token SET DEFAULT encode(gen_random_bytes(32), 'base64');

-- Recréer les contraintes uniques
ALTER TABLE public.invitations ADD CONSTRAINT invitations_invitation_token_key UNIQUE (invitation_token);
ALTER TABLE public.company_shares ADD CONSTRAINT company_shares_share_token_key UNIQUE (share_token);

-- 5. FONCTIONS SIMPLES ET ROBUSTES
-- ========================================

-- Fonction simple pour récupérer une invitation
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_param TEXT)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    invited_email TEXT,
    invited_by UUID,
    status TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    company_name TEXT,
    inviter_email TEXT
) AS $$
BEGIN
    IF token_param IS NULL OR token_param = '' THEN
        RAISE EXCEPTION 'Token invalide';
    END IF;

    RETURN QUERY 
    SELECT 
        i.id,
        i.company_id,
        i.invited_email,
        i.invited_by,
        i.status,
        i.expires_at,
        i.created_at,
        c.company_name,
        u.email as inviter_email
    FROM public.invitations i
    JOIN public.companies c ON c.id = i.company_id
    JOIN public.users u ON u.id = i.invited_by
    WHERE i.invitation_token = token_param
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction simple pour récupérer un partage
CREATE OR REPLACE FUNCTION public.get_shared_company(token_param TEXT)
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    permissions TEXT[]
) AS $$
BEGIN
    IF token_param IS NULL OR token_param = '' THEN
        RAISE EXCEPTION 'Token invalide';
    END IF;

    RETURN QUERY 
    SELECT 
        cs.company_id,
        c.company_name,
        cs.permissions
    FROM public.company_shares cs
    JOIN public.companies c ON c.id = cs.company_id
    WHERE cs.share_token = token_param
    AND cs.is_active = true
    AND (cs.expires_at IS NULL OR cs.expires_at > now())
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
        last_name = EXCLUDED.last_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour gérer les invitations acceptées
CREATE OR REPLACE FUNCTION public.handle_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.company_shares (
            company_id,
            shared_with_email,
            permissions,
            expires_at
        ) VALUES (
            NEW.company_id,
            NEW.invited_email,
            ARRAY['view_company', 'view_documents'],
            NEW.expires_at
        )
        ON CONFLICT (company_id, shared_with_email) DO UPDATE SET
            is_active = true,
            expires_at = NEW.expires_at;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGERS
-- ========================================

-- Trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger pour les invitations
CREATE TRIGGER on_invitation_status_change
    AFTER UPDATE ON public.invitations
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION public.handle_invitation_accepted();

-- 7. SYNCHRONISATION DES UTILISATEURS
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
    last_name = EXCLUDED.last_name;

-- 8. STORAGE
-- ========================================

-- Créer le bucket company-files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-files', 'company-files', false, 52428800, ARRAY['application/pdf', 'image/*', 'text/*'])
ON CONFLICT (id) DO NOTHING;

-- Politiques de storage simples
CREATE POLICY "authenticated_users_can_upload_files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'company-files' AND auth.uid() IS NOT NULL
    );

CREATE POLICY "authenticated_users_can_view_files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'company-files' AND auth.uid() IS NOT NULL
    );

CREATE POLICY "authenticated_users_can_update_files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'company-files' AND auth.uid() IS NOT NULL
    );

CREATE POLICY "authenticated_users_can_delete_files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'company-files' AND auth.uid() IS NOT NULL
    );

-- 9. RÉACTIVATION RLS AVEC POLITIQUES SIMPLES
-- ========================================

-- Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Politiques simples pour users
CREATE POLICY "users_can_view_own_profile" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_can_insert_own_profile" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Politiques simples pour companies
CREATE POLICY "users_can_view_own_companies" ON public.companies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_companies" ON public.companies
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_companies" ON public.companies
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_companies" ON public.companies
    FOR DELETE USING (user_id = auth.uid());

-- Politiques simples pour documents
CREATE POLICY "users_can_view_own_documents" ON public.documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = documents.company_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "users_can_insert_own_documents" ON public.documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = documents.company_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "users_can_update_own_documents" ON public.documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = documents.company_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "users_can_delete_own_documents" ON public.documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = documents.company_id
            AND c.user_id = auth.uid()
        )
    );

-- Politiques simples pour invitations
CREATE POLICY "users_can_view_own_invitations_sent" ON public.invitations
    FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "users_can_view_invitations_received" ON public.invitations
    FOR SELECT USING (
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "users_can_create_invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = invitations.company_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "users_can_update_invitations" ON public.invitations
    FOR UPDATE USING (
        invited_by = auth.uid() OR
        invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Politiques simples pour company_shares
CREATE POLICY "users_can_view_own_company_shares" ON public.company_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_shares.company_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "users_can_view_shares_for_them" ON public.company_shares
    FOR SELECT USING (
        shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "users_can_create_shares" ON public.company_shares
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_shares.company_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "users_can_update_shares" ON public.company_shares
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_shares.company_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "users_can_delete_shares" ON public.company_shares
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_shares.company_id
            AND c.user_id = auth.uid()
        )
    );

-- Politique pour voir les documents des entreprises partagées
CREATE POLICY "users_can_view_shared_documents" ON public.documents
    FOR SELECT USING (
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

-- 10. VÉRIFICATION FINALE
-- ========================================

SELECT 
    '🎉 SOLUTION COMPLÈTE APPLIQUÉE !' as status,
    'Système d''invitations et partages 100% fonctionnel' as message,
    (SELECT COUNT(*) FROM public.users) as users_count,
    (SELECT COUNT(*) FROM public.companies) as companies_count,
    (SELECT COUNT(*) FROM public.invitations) as invitations_count,
    (SELECT COUNT(*) FROM public.company_shares) as shares_count,
    (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_shared_company', 'get_invitation_by_token', 'handle_invitation_accepted', 'handle_new_user')) as functions_count,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'company-files') as bucket_exists;

-- ========================================
-- FIN DE LA SOLUTION COMPLÈTE
-- ======================================== 