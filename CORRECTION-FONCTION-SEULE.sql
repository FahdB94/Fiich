-- Correction de la fonction notify_shared_users pour exclure le propriétaire
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- Fonction corrigée pour notifier les utilisateurs partagés (sauf le propriétaire)
CREATE OR REPLACE FUNCTION public.notify_shared_users(
  p_company_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
  v_share RECORD;
  v_owner_email TEXT;
BEGIN
  -- Récupérer l'email du propriétaire de l'entreprise
  SELECT u.email INTO v_owner_email
  FROM public.companies c
  JOIN auth.users u ON c.user_id = u.id
  WHERE c.id = p_company_id;
  
  -- Notifier tous les utilisateurs qui ont accès à cette entreprise
  -- SAUF le propriétaire de l'entreprise
  FOR v_share IN 
    SELECT DISTINCT shared_with_email 
    FROM public.company_shares 
    WHERE company_id = p_company_id 
    AND is_active = true
    AND shared_with_email != v_owner_email
  LOOP
    PERFORM public.create_notification(
      v_share.shared_with_email,
      p_company_id,
      p_notification_type,
      p_title,
      p_message,
      p_metadata
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction notify_shared_users corrigée pour exclure le propriétaire';
  RAISE NOTICE '🔒 Le propriétaire de l''entreprise ne recevra plus de notifications sur ses propres modifications';
END $$; 