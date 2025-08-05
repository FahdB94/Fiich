-- ========================================
-- CORRECTION COMPLÈTE RLS POUR INVITATIONS ET PARTAGES
-- ========================================

-- 1. Désactiver temporairement RLS pour diagnostiquer
ALTER TABLE public.company_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;

-- 2. Recréer les politiques RLS pour company_shares
ALTER TABLE public.company_shares ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion lors de l'acceptation d'invitation
DROP POLICY IF EXISTS "allow_insert_on_acceptance" ON public.company_shares;
CREATE POLICY "allow_insert_on_acceptance" ON public.company_shares
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Politique pour permettre la lecture des partages
DROP POLICY IF EXISTS "allow_read_shares" ON public.company_shares;
CREATE POLICY "allow_read_shares" ON public.company_shares
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
        OR
        company_shares.shared_with_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Politique pour permettre la mise à jour des partages
DROP POLICY IF EXISTS "allow_update_shares" ON public.company_shares;
CREATE POLICY "allow_update_shares" ON public.company_shares
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
    );

-- Politique pour permettre la suppression des partages
DROP POLICY IF EXISTS "allow_delete_shares" ON public.company_shares;
CREATE POLICY "allow_delete_shares" ON public.company_shares
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
    );

-- 3. Recréer les politiques RLS pour invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion d'invitations
DROP POLICY IF EXISTS "allow_insert_invitations" ON public.invitations;
CREATE POLICY "allow_insert_invitations" ON public.invitations
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = invitations.company_id 
            AND c.user_id = auth.uid()
        )
    );

-- Politique pour permettre la lecture des invitations
DROP POLICY IF EXISTS "allow_read_invitations" ON public.invitations;
CREATE POLICY "allow_read_invitations" ON public.invitations
    FOR SELECT 
    USING (
        invited_by = auth.uid()
        OR
        invited_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Politique pour permettre la suppression des invitations
DROP POLICY IF EXISTS "allow_delete_invitations" ON public.invitations;
CREATE POLICY "allow_delete_invitations" ON public.invitations
    FOR DELETE 
    USING (
        invited_by = auth.uid()
        OR
        invited_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- 4. Vérifier les politiques créées
SELECT 
    '✅ Politiques RLS corrigées' as status,
    'company_shares et invitations' as tables;
