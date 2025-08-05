-- Fonction pour récupérer une invitation par token
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_param TEXT)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  invited_email TEXT,
  invited_by UUID,
  invitation_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  company_name TEXT,
  invited_by_email TEXT,
  invited_by_name TEXT,
  invited_by_first_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
    u.email as invited_by_email,
    COALESCE(u.raw_user_meta_data->>'last_name', '') as invited_by_name,
    COALESCE(u.raw_user_meta_data->>'first_name', '') as invited_by_first_name
  FROM public.invitations i
  LEFT JOIN public.companies c ON i.company_id = c.id
  LEFT JOIN auth.users u ON i.invited_by = u.id
  WHERE i.invitation_token = token_param
  AND i.expires_at > NOW();
END;
$$;

-- Vérifier que la fonction a été créée
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name = 'get_invitation_by_token' 
AND routine_schema = 'public';

-- Message de confirmation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_invitation_by_token' 
    AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Fonction get_invitation_by_token créée avec succès';
  ELSE
    RAISE NOTICE '❌ Erreur: La fonction get_invitation_by_token n''a pas pu être créée';
  END IF;
END $$; 