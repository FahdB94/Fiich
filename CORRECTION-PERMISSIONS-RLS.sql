-- ========================================
-- CORRECTION FINALE DES PERMISSIONS RLS - FIICH APP  
-- Fix DÉFINITIF pour l'erreur "permission denied for table users"
-- ========================================

-- ⚠️  PROBLÈME IDENTIFIÉ : Les politiques RLS du script principal utilisent
-- "SELECT email FROM auth.users WHERE id = auth.uid()" ce qui cause l'erreur
-- "permission denied for table users"

-- SOLUTION : Remplacer TOUTES les références à auth.users par public.users

-- 1. CORRIGER LA POLITIQUE DE DOCUMENTS PARTAGÉS
DROP POLICY IF EXISTS "users_can_view_shared_documents" ON public.documents;

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

-- 2. CORRIGER LA POLITIQUE DES INVITATIONS REÇUES
DROP POLICY IF EXISTS "users_can_view_invitations_received" ON public.invitations;

CREATE POLICY "users_can_view_invitations_received"
ON public.invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND invited_email = u.email
    )
);

-- 3. CORRIGER LA POLITIQUE DE MISE À JOUR DES INVITATIONS
DROP POLICY IF EXISTS "users_can_update_invitations" ON public.invitations;

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

-- 4. CORRIGER LA POLITIQUE DES PARTAGES POUR L'UTILISATEUR
DROP POLICY IF EXISTS "users_can_view_shares_for_them" ON public.company_shares;

CREATE POLICY "users_can_view_shares_for_them"
ON public.company_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND shared_with_email = u.email
    )
);

-- 5. AJOUTER UNE POLITIQUE SIMPLIFIÉE POUR LES DOCUMENTS DES ENTREPRISES PROPRES
-- Assurer que les utilisateurs peuvent toujours voir leurs propres documents
DROP POLICY IF EXISTS "users_can_view_own_documents" ON public.documents;

CREATE POLICY "users_can_view_own_documents"
ON public.documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

-- 6. VÉRIFICATION FINALE ET TEST
SELECT 
    '🎯 CORRECTION FINALE DES PERMISSIONS TERMINÉE !' as status,
    'Toutes les politiques RLS utilisent maintenant public.users' as message;

-- ========================================
-- FIN DE LA CORRECTION DES PERMISSIONS
-- ========================================