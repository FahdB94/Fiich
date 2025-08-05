-- ========================================
-- CORRECTION FONCTION get_invitation_by_token
-- ========================================
-- Problème : "Returned type invitation_status does not match expected type text in column 6"
-- Solution : Recréer la fonction avec les bons types

-- 1. Supprimer le type invitation_status s'il existe
DROP TYPE IF EXISTS invitation_status CASCADE;

-- 2. Recréer la fonction get_invitation_by_token avec les bons types
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
        i.status::TEXT,  -- Forcer le cast en TEXT
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

-- 3. Vérifier que la fonction fonctionne
SELECT 
    '✅ Fonction get_invitation_by_token corrigée' as status,
    'Testez maintenant les invitations' as message; 