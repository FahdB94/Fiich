-- ========================================
-- CORRECTION RLS POUR TABLE COMPANY_SHARES
-- ========================================
-- Problème : Politiques RLS empêchent l'insertion lors de l'acceptation d'invitation
-- Solution : Ajouter des politiques appropriées pour company_shares

-- 1. Désactiver temporairement RLS pour diagnostiquer
ALTER TABLE public.company_shares DISABLE ROW LEVEL SECURITY;

-- 2. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'company_shares' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Recréer les politiques RLS appropriées
ALTER TABLE public.company_shares ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion lors de l'acceptation d'invitation
CREATE POLICY "allow_insert_on_acceptance" ON public.company_shares
    FOR INSERT 
    WITH CHECK (
        -- Permettre l'insertion si l'utilisateur est connecté
        auth.uid() IS NOT NULL
    );

-- Politique pour permettre la lecture des partages
CREATE POLICY "allow_read_shares" ON public.company_shares
    FOR SELECT 
    USING (
        -- Permettre la lecture si l'utilisateur est le propriétaire de l'entreprise
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
        OR
        -- Ou si l'utilisateur est celui avec qui l'entreprise est partagée
        company_shares.shared_with_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Politique pour permettre la mise à jour des partages
CREATE POLICY "allow_update_shares" ON public.company_shares
    FOR UPDATE 
    USING (
        -- Permettre la mise à jour si l'utilisateur est le propriétaire de l'entreprise
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
    );

-- Politique pour permettre la suppression des partages
CREATE POLICY "allow_delete_shares" ON public.company_shares
    FOR DELETE 
    USING (
        -- Permettre la suppression si l'utilisateur est le propriétaire de l'entreprise
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
    );

-- 4. Vérifier les politiques créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'company_shares'
AND schemaname = 'public';

-- 5. Message de confirmation
SELECT 
    '✅ Politiques RLS corrigées pour company_shares' as status,
    'Insertion, lecture, mise à jour et suppression autorisées' as message; 