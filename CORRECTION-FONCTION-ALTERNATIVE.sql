-- Correction alternative de la fonction notify_shared_users
-- Cette version évite l'accès à auth.users qui peut poser problème
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- Fonction corrigée pour notifier les utilisateurs partagés (sauf le propriétaire)
-- Utilise une approche différente : on passe l'email du propriétaire en paramètre
CREATE OR REPLACE FUNCTION public.notify_shared_users(
  p_company_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_owner_email TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_share RECORD;
  v_owner_email TEXT;
BEGIN
  -- Si l'email du propriétaire n'est pas fourni, on essaie de le récupérer
  IF p_owner_email IS NULL THEN
    -- Tentative de récupération via une fonction RPC séparée
    BEGIN
      SELECT email INTO v_owner_email
      FROM auth.users
      WHERE id = (
        SELECT user_id 
        FROM public.companies 
        WHERE id = p_company_id
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Si on ne peut pas récupérer l'email, on continue sans exclusion
        v_owner_email := NULL;
    END;
  ELSE
    v_owner_email := p_owner_email;
  END IF;
  
  -- Notifier tous les utilisateurs qui ont accès à cette entreprise
  -- SAUF le propriétaire de l'entreprise (si on a son email)
  FOR v_share IN 
    SELECT DISTINCT shared_with_email 
    FROM public.company_shares 
    WHERE company_id = p_company_id 
    AND is_active = true
    AND (v_owner_email IS NULL OR shared_with_email != v_owner_email)
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

-- Fonction simplifiée qui utilise l'email du propriétaire directement
CREATE OR REPLACE FUNCTION public.notify_shared_users_simple(
  p_company_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_owner_email TEXT
) RETURNS VOID AS $$
DECLARE
  v_share RECORD;
BEGIN
  -- Notifier tous les utilisateurs qui ont accès à cette entreprise
  -- SAUF le propriétaire de l'entreprise
  FOR v_share IN 
    SELECT DISTINCT shared_with_email 
    FROM public.company_shares 
    WHERE company_id = p_company_id 
    AND is_active = true
    AND shared_with_email != p_owner_email
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
  RAISE NOTICE '✅ Fonctions notify_shared_users corrigées';
  RAISE NOTICE '🔒 Version simple disponible: notify_shared_users_simple';
  RAISE NOTICE '💡 Utilisez p_owner_email pour exclure le propriétaire';
END $$; 