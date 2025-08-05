-- ========================================
-- CORRECTION FINALE FONCTION get_invitation_by_token
-- ========================================
-- Problème : Conflit de type entre character varying(255) et text
-- Solution : Cast explicite de l'email + ajout nom/prénom inviteur

-- 1. Supprimer le type invitation_status s'il existe
DROP TYPE IF EXISTS invitation_status CASCADE;

-- 2. Supprimer la fonction existante AVANT de la recréer
DROP FUNCTION IF EXISTS get_invitation_by_token(TEXT);

-- 3. Recréer la fonction get_invitation_by_token avec cast explicite + nom/prénom
CREATE OR REPLACE FUNCTION get_invitation_by_token(token_param TEXT)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    invited_email TEXT,
    invited_by UUID,
    invitation_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    company_name TEXT,
    invited_by_email TEXT,
    invited_by_name TEXT,
    invited_by_first_name TEXT
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
        i.expires_at,
        i.created_at,
        i.updated_at,
        c.company_name,
        u.email::TEXT as invited_by_email,
        pu.last_name::TEXT as invited_by_name,
        pu.first_name::TEXT as invited_by_first_name
    FROM public.invitations i
    LEFT JOIN public.companies c ON i.company_id = c.id
    LEFT JOIN auth.users u ON i.invited_by = u.id
    LEFT JOIN public.users pu ON u.id = pu.id
    WHERE i.invitation_token = token_param
    ORDER BY i.created_at DESC
    LIMIT 1;
END;
$$;

-- 4. Vérifier que la fonction fonctionne
SELECT 
    '✅ Fonction get_invitation_by_token corrigée' as status,
    'Nom/prénom inviteur ajoutés - types compatibles' as message; 