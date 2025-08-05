-- ============================================================================
-- 🎯 SCRIPT FINAL DE CORRECTION RLS - À APPLIQUER DANS SUPABASE
-- ============================================================================
-- 
-- INSTRUCTIONS :
-- 1. Copiez TOUT ce script
-- 2. Allez sur https://supabase.com/dashboard → votre projet → SQL Editor
-- 3. Collez le script dans l'éditeur
-- 4. Cliquez sur "RUN"
-- 
-- ⚠️  PROBLÈME : "permission denied for table users" lors du chargement des documents
-- ✅ SOLUTION : Corriger toutes les politiques RLS pour utiliser public.users
-- ============================================================================

-- 1. SUPPRIMER TOUTES LES POLITIQUES PROBLÉMATIQUES
-- ============================================================================
DROP POLICY IF EXISTS "users_can_view_shared_documents" ON public.documents;
DROP POLICY IF EXISTS "users_can_view_invitations_received" ON public.invitations;
DROP POLICY IF EXISTS "users_can_update_invitations" ON public.invitations;
DROP POLICY IF EXISTS "users_can_view_shares_for_them" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_view_own_documents" ON public.documents;

-- 2. POLITIQUE PRINCIPALE : DOCUMENTS DES ENTREPRISES PROPRES
-- ============================================================================
-- Cette politique permet aux utilisateurs de voir les documents de leurs propres entreprises
CREATE POLICY "users_can_view_own_documents"
ON public.documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

-- 3. POLITIQUE SECONDAIRE : DOCUMENTS DES ENTREPRISES PARTAGÉES
-- ============================================================================
-- Cette politique permet de voir les documents des entreprises partagées avec l'utilisateur
-- CORRECTION : Utilise public.users au lieu de auth.users
CREATE POLICY "users_can_view_shared_documents"
ON public.documents FOR SELECT
USING (
    documents.is_public = true
    AND EXISTS (
        SELECT 1 FROM public.company_shares cs
        JOIN public.users u ON u.id = auth.uid()
        WHERE cs.company_id = documents.company_id
        AND cs.shared_with_email = u.email
        AND cs.is_active = true
        AND (cs.expires_at IS NULL OR cs.expires_at > now())
        AND 'view_documents' = ANY(cs.permissions)
    )
);

-- 4. POLITIQUE POUR LES INVITATIONS REÇUES
-- ============================================================================
-- Permet aux utilisateurs de voir les invitations qui leur sont destinées
-- CORRECTION : Utilise public.users au lieu de auth.users
CREATE POLICY "users_can_view_invitations_received"
ON public.invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND invited_email = u.email
    )
);

-- 5. POLITIQUE POUR LA MISE À JOUR DES INVITATIONS
-- ============================================================================
-- Permet de mettre à jour les invitations (accepter/refuser)
-- CORRECTION : Utilise public.users au lieu de auth.users
CREATE POLICY "users_can_update_invitations"
ON public.invitations FOR UPDATE
USING (
    invited_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND invited_email = u.email
    )
);

-- 6. POLITIQUE POUR LES PARTAGES DESTINÉS À L'UTILISATEUR
-- ============================================================================
-- Permet aux utilisateurs de voir les partages qui leur sont destinés
-- CORRECTION : Utilise public.users au lieu de auth.users
CREATE POLICY "users_can_view_shares_for_them"
ON public.company_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND shared_with_email = u.email
    )
);

-- 7. POLITIQUES SUPPLÉMENTAIRES POUR LES DOCUMENTS
-- ============================================================================
-- Permettre l'insertion de documents
CREATE POLICY "users_can_insert_own_documents"
ON public.documents FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

-- Permettre la mise à jour de documents
CREATE POLICY "users_can_update_own_documents"
ON public.documents FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

-- Permettre la suppression de documents
CREATE POLICY "users_can_delete_own_documents"
ON public.documents FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

-- 8. VÉRIFICATION FINALE
-- ============================================================================
-- Liste toutes les politiques créées pour vérification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('documents', 'invitations', 'company_shares')
AND schemaname = 'public'
AND policyname IN (
    'users_can_view_own_documents',
    'users_can_view_shared_documents',
    'users_can_insert_own_documents',
    'users_can_update_own_documents',
    'users_can_delete_own_documents',
    'users_can_view_invitations_received',
    'users_can_update_invitations',
    'users_can_view_shares_for_them'
)
ORDER BY tablename, policyname;

-- 9. MESSAGE DE SUCCÈS
-- ============================================================================
SELECT 
    '🎉 CORRECTION RLS APPLIQUÉE AVEC SUCCÈS !' as "STATUS",
    'Toutes les politiques utilisent maintenant public.users' as "MESSAGE",
    'Les documents devraient maintenant se charger correctement' as "PROCHAINE_ETAPE";

-- ============================================================================
-- FIN DU SCRIPT - TESTEZ MAINTENANT L'ACCÈS AUX DOCUMENTS
-- ============================================================================ 