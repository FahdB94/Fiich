-- Création du système de notifications pour entreprises partagées
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('company_updated', 'document_added', 'document_deleted', 'document_updated')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON public.notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 3. Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
-- Permettre la lecture des notifications par l'utilisateur concerné
CREATE POLICY "Users can read their own notifications" ON public.notifications
  FOR SELECT USING (recipient_email = auth.jwt() ->> 'email');

-- Permettre la mise à jour des notifications par l'utilisateur concerné
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (recipient_email = auth.jwt() ->> 'email');

-- Permettre l'insertion de notifications (par les triggers)
CREATE POLICY "Allow notification insertion" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 5. Fonction pour créer une notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_email TEXT,
  p_company_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_email,
    company_id,
    notification_type,
    title,
    message,
    metadata
  ) VALUES (
    p_recipient_email,
    p_company_id,
    p_notification_type,
    p_title,
    p_message,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour notifier les utilisateurs partagés
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
  JOIN auth.users u ON c.owner_id = u.id
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

-- 7. Trigger pour détecter les modifications d'entreprise
CREATE OR REPLACE FUNCTION public.handle_company_update() RETURNS TRIGGER AS $$
BEGIN
  -- Notifier les utilisateurs partagés des modifications d'entreprise
  PERFORM public.notify_shared_users(
    NEW.id,
    'company_updated',
    'Fiche d''entreprise mise à jour',
    'La fiche de l''entreprise "' || NEW.company_name || '" a été mise à jour.',
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

-- 8. Trigger pour détecter l'ajout de documents
CREATE OR REPLACE FUNCTION public.handle_document_add() RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
BEGIN
  -- Récupérer le nom de l'entreprise
  SELECT company_name INTO v_company_name 
  FROM public.companies 
  WHERE id = NEW.company_id;
  
  -- Notifier seulement si le document est public
  IF NEW.is_public = true THEN
    PERFORM public.notify_shared_users(
      NEW.company_id,
      'document_added',
      'Nouveau document ajouté',
      'Un nouveau document "' || COALESCE(NEW.display_name, NEW.name) || '" a été ajouté à la fiche de l''entreprise "' || v_company_name || '".',
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

-- 9. Trigger pour détecter la suppression de documents
CREATE OR REPLACE FUNCTION public.handle_document_delete() RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
BEGIN
  -- Récupérer le nom de l'entreprise
  SELECT company_name INTO v_company_name 
  FROM public.companies 
  WHERE id = OLD.company_id;
  
  -- Notifier seulement si le document était public
  IF OLD.is_public = true THEN
    PERFORM public.notify_shared_users(
      OLD.company_id,
      'document_deleted',
      'Document supprimé',
      'Le document "' || COALESCE(OLD.display_name, OLD.name) || '" a été supprimé de la fiche de l''entreprise "' || v_company_name || '".',
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

-- 10. Trigger pour détecter la mise à jour de documents
CREATE OR REPLACE FUNCTION public.handle_document_update() RETURNS TRIGGER AS $$
DECLARE
  v_company_name TEXT;
BEGIN
  -- Récupérer le nom de l'entreprise
  SELECT company_name INTO v_company_name 
  FROM public.companies 
  WHERE id = NEW.company_id;
  
  -- Notifier seulement si le document est public
  IF NEW.is_public = true THEN
    PERFORM public.notify_shared_users(
      NEW.company_id,
      'document_updated',
      'Document mis à jour',
      'Le document "' || COALESCE(NEW.display_name, NEW.name) || '" a été mis à jour dans la fiche de l''entreprise "' || v_company_name || '".',
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

-- 11. Créer les triggers
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

-- 12. Vérification
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Système de notifications créé avec succès';
  RAISE NOTICE '📋 Table notifications créée';
  RAISE NOTICE '🔔 Triggers configurés pour les modifications';
  RAISE NOTICE '👥 Notifications automatiques pour les utilisateurs partagés';
END $$; 