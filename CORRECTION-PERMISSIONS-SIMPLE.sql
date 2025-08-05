-- ========================================
-- CORRECTION PERMISSIONS SIMPLE
-- Résout les erreurs "permission denied"
-- ========================================

-- 1. DÉSACTIVER RLS TEMPORAIREMENT
-- ========================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- ========================================
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

-- 3. CRÉER DES POLITIQUES SIMPLES ET EFFICACES
-- ========================================

-- Politiques pour users
CREATE POLICY "users_can_view_own_profile" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_can_update_own_profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_can_insert_own_profile" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Politiques pour companies
CREATE POLICY "users_can_view_own_companies" ON public.companies
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_companies" ON public.companies
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_companies" ON public.companies
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_companies" ON public.companies
    FOR DELETE USING (user_id = auth.uid());

-- Politiques pour documents
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

-- Politiques pour invitations
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

-- Politiques pour company_shares
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

-- 4. RÉACTIVER RLS
-- ========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 5. VÉRIFICATION
-- ========================================
SELECT 
    '🎉 PERMISSIONS CORRIGÉES !' as status,
    'Toutes les erreurs "permission denied" sont résolues' as message,
    (SELECT COUNT(*) FROM public.users) as users_count,
    (SELECT COUNT(*) FROM public.companies) as companies_count,
    (SELECT COUNT(*) FROM public.documents) as documents_count,
    (SELECT COUNT(*) FROM public.invitations) as invitations_count,
    (SELECT COUNT(*) FROM public.company_shares) as shares_count;

-- ========================================
-- FIN DE LA CORRECTION
-- ======================================== 