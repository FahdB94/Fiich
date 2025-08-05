-- Correction complète des triggers avec exclusion du propriétaire
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Fonction simplifiée pour notifier les utilisateurs partagés
CREATE OR REPLACE FUNCTION public.notify_shared_users_simple(
  p_company_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_owner_email TEXT,
  p_metadata JSONB DEFAULT '{}'
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

-- 2. Fonction pour récupérer l'email du propriétaire d'une entreprise
CREATE OR REPLACE FUNCTION public.get_company_owner_email(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_owner_email TEXT;
BEGIN
  -- Récupérer l'email du propriétaire via une jointure avec auth.users
  SELECT u.email INTO v_owner_email
  FROM public.companies c
  JOIN auth.users u ON c.user_id = u.id
  WHERE c.id = p_company_id;
  
  RETURN v_owner_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger corrigé pour les modifications d'entreprise
CREATE OR REPLACE FUNCTION public.handle_company_update() RETURNS TRIGGER AS $$
DECLARE
  v_owner_email TEXT;
BEGIN
  -- Récupérer l'email du propriétaire
  v_owner_email := public.get_company_owner_email(NEW.id);
  
  -- Notifier les utilisateurs partagés des modifications d'entreprise
  -- SAUF le propriétaire
  PERFORM public.notify_shared_users_simple(
    NEW.id,
    'company_updated',
    'Fiche d''entreprise mise à jour',
    'La fiche de l''entreprise "' || NEW.company_name || '" a été mise à jour.',
    v_owner_email,
    jsonb_build_object(
      'company_name', NEW.company_name,
      'updated_fields', jsonb_build_object(
        'company_name', OLD.company_name != NEW.company_name,
        'siren', OLD.siren IS DISTINCT FROM NEW.siren,
        'siret', OLD.siret IS DISTINCT FROM NEW.siret,
        'address', OLD.address_line_1 IS DISTINCT FROM NEW.address_line_1 OR 
                   OLD.postal_code IS DISTINCT FROM NEW.postal_code OR 
                   OLD.city IS DISTINCT FROM NEW.city,
        'phone', OLD.phone IS DISTINCT FROM NEW.phone,
        'email', OLD.email IS DISTINCT FROM NEW.email,
        'website', OLD.website IS DISTINCT FROM NEW.website,
        'ape_code', OLD.ape_code IS DISTINCT FROM NEW.ape_code,
        'vat_number', OLD.vat_number IS DISTINCT FROM NEW.vat_number,
        'logo', OLD.logo_url IS DISTINCT FROM NEW.logo_url
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger corrigé pour l'ajout de documents
CREATE OR REPLACE FUNCTION public.handle_document_add() RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_owner_email TEXT;
BEGIN
  -- Récupérer le nom de l'entreprise
  SELECT company_name INTO v_company_name 
  FROM public.companies 
  WHERE id = NEW.company_id;
  
  -- Récupérer l'email du propriétaire
  v_owner_email := public.get_company_owner_email(NEW.company_id);
  
  -- Notifier seulement si le document est public
  IF NEW.is_public = true THEN
    PERFORM public.notify_shared_users_simple(
      NEW.company_id,
      'document_added',
      'Nouveau document ajouté',
      'Un nouveau document "' || COALESCE(NEW.display_name, NEW.name) || '" a été ajouté à la fiche de l''entreprise "' || v_company_name || '".',
      v_owner_email,
      jsonb_build_object(
        'document_id', NEW.id,
        'document_name', COALESCE(NEW.display_name, NEW.name),
        'document_type', NEW.document_type,
        'company_name', v_company_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger corrigé pour la suppression de documents
CREATE OR REPLACE FUNCTION public.handle_document_delete() RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_owner_email TEXT;
BEGIN
  -- Récupérer le nom de l'entreprise
  SELECT company_name INTO v_company_name 
  FROM public.companies 
  WHERE id = OLD.company_id;
  
  -- Récupérer l'email du propriétaire
  v_owner_email := public.get_company_owner_email(OLD.company_id);
  
  -- Notifier seulement si le document était public
  IF OLD.is_public = true THEN
    PERFORM public.notify_shared_users_simple(
      OLD.company_id,
      'document_deleted',
      'Document supprimé',
      'Le document "' || COALESCE(OLD.display_name, OLD.name) || '" a été supprimé de la fiche de l''entreprise "' || v_company_name || '".',
      v_owner_email,
      jsonb_build_object(
        'document_name', COALESCE(OLD.display_name, OLD.name),
        'document_type', OLD.document_type,
        'company_name', v_company_name
      )
    );
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger corrigé pour la mise à jour de documents
CREATE OR REPLACE FUNCTION public.handle_document_update() RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
  v_owner_email TEXT;
BEGIN
  -- Récupérer le nom de l'entreprise
  SELECT company_name INTO v_company_name 
  FROM public.companies 
  WHERE id = NEW.company_id;
  
  -- Récupérer l'email du propriétaire
  v_owner_email := public.get_company_owner_email(NEW.company_id);
  
  -- Notifier seulement si le document est public
  IF NEW.is_public = true THEN
    PERFORM public.notify_shared_users_simple(
      NEW.company_id,
      'document_updated',
      'Document mis à jour',
      'Le document "' || COALESCE(NEW.display_name, NEW.name) || '" a été mis à jour dans la fiche de l''entreprise "' || v_company_name || '".',
      v_owner_email,
      jsonb_build_object(
        'document_id', NEW.id,
        'document_name', COALESCE(NEW.display_name, NEW.name),
        'document_type', NEW.document_type,
        'company_name', v_company_name,
        'updated_fields', jsonb_build_object(
          'name', OLD.name IS DISTINCT FROM NEW.name,
          'display_name', OLD.display_name IS DISTINCT FROM NEW.display_name,
          'document_type', OLD.document_type IS DISTINCT FROM NEW.document_type,
          'is_public', OLD.is_public IS DISTINCT FROM NEW.is_public
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recréer les triggers
DROP TRIGGER IF EXISTS trigger_company_update ON public.companies;
CREATE TRIGGER trigger_company_update
  AFTER UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_company_update();

DROP TRIGGER IF EXISTS trigger_document_add ON public.documents;
CREATE TRIGGER trigger_document_add
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_document_add();

DROP TRIGGER IF EXISTS trigger_document_delete ON public.documents;
CREATE TRIGGER trigger_document_delete
  AFTER DELETE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_document_delete();

DROP TRIGGER IF EXISTS trigger_document_update ON public.documents;
CREATE TRIGGER trigger_document_update
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_document_update();

-- 8. Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Correction complète appliquée';
  RAISE NOTICE '🔒 Le propriétaire sera exclu de toutes les notifications';
  RAISE NOTICE '📋 Fonctions créées: notify_shared_users_simple, get_company_owner_email';
  RAISE NOTICE '🔔 Triggers mis à jour: company_update, document_add, document_delete, document_update';
END $$; 