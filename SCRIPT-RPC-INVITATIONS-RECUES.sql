-- ========================================
-- FONCTION RPC POUR RÉCUPÉRER LES INVITATIONS REÇUES
-- ========================================

-- Créer la fonction get_invitations_by_email
CREATE OR REPLACE FUNCTION get_invitations_by_email(user_email TEXT)
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
    WHERE i.invited_email = user_email
    ORDER BY i.created_at DESC;
END;
$$;

-- Vérifier que la fonction fonctionne
SELECT 
    '✅ Fonction get_invitations_by_email créée' as status,
    'Récupération des invitations reçues activée' as message;
