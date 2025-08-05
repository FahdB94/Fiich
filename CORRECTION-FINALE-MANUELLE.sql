-- ============================================================================
-- 🎯 CORRECTION FINALE MANUELLE - À COPIER-COLLER DANS SUPABASE SQL EDITOR
-- ============================================================================
-- 
-- INSTRUCTIONS :
-- 1. Allez sur https://supabase.com/dashboard/project/[votre-projet]/sql
-- 2. Copiez-collez TOUT ce script dans l'éditeur SQL
-- 3. Cliquez sur "RUN" pour exécuter
-- 
-- ⚠️  PROBLÈME IDENTIFIÉ : Les politiques RLS utilisent "auth.users" au lieu de "public.users"
-- ✅ SOLUTION : Remplacer toutes les références par "public.users"
-- ============================================================================

-- 1. SUPPRIMER LES POLITIQUES PROBLÉMATIQUES
DROP POLICY IF EXISTS "users_can_view_shared_documents" ON public.documents;
DROP POLICY IF EXISTS "users_can_view_invitations_received" ON public.invitations;
DROP POLICY IF EXISTS "users_can_update_invitations" ON public.invitations;
DROP POLICY IF EXISTS "users_can_view_shares_for_them" ON public.company_shares;
DROP POLICY IF EXISTS "users_can_view_own_documents" ON public.documents;

-- 2. RECRÉER LA POLITIQUE POUR LES DOCUMENTS PARTAGÉS (CORRIGÉE)
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

-- 3. RECRÉER LA POLITIQUE POUR LES INVITATIONS REÇUES (CORRIGÉE)
CREATE POLICY "users_can_view_invitations_received"
ON public.invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND invited_email = u.email
    )
);

-- 4. RECRÉER LA POLITIQUE DE MISE À JOUR DES INVITATIONS (CORRIGÉE)
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

-- 5. RECRÉER LA POLITIQUE DES PARTAGES POUR L'UTILISATEUR (CORRIGÉE)
CREATE POLICY "users_can_view_shares_for_them"
ON public.company_shares FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND shared_with_email = u.email
    )
);

-- 6. RECRÉER LA POLITIQUE POUR LES DOCUMENTS PROPRES (SÉCURISÉE)
CREATE POLICY "users_can_view_own_documents"
ON public.documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = documents.company_id
        AND c.user_id = auth.uid()
    )
);

-- 7. VÉRIFICATION : Test que les politiques sont bien créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('documents', 'invitations', 'company_shares')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. MESSAGE DE SUCCÈS
SELECT 
    '🎉 CORRECTION FINALE APPLIQUÉE AVEC SUCCÈS !' as status,
    'Les politiques RLS utilisent maintenant public.users au lieu de auth.users' as message,
    'Vous pouvez maintenant tester l''accès aux documents' as instruction;

-- ============================================================================
-- FIN DE LA CORRECTION - REDÉMARREZ VOTRE SERVEUR : npm run dev
-- ============================================================================