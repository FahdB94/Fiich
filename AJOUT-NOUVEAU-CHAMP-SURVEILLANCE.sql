-- AJOUT D'UN NOUVEAU CHAMP À SURVEILLER
-- Utilisez ce script quand vous ajoutez une nouvelle colonne à la table companies
-- Remplacez 'nouveau_champ' par le nom de votre nouvelle colonne

-- Exemple d'utilisation :
-- 1. Ajoutez votre nouvelle colonne à la table companies
-- 2. Exécutez ce script en remplaçant 'nouveau_champ' par le nom de votre colonne
-- 3. Le système de notifications détectera automatiquement les changements

-- ⚠️  REMPLACEZ 'nouveau_champ' PAR LE NOM DE VOTRE COLONNE
-- Exemple: 'nouveau_champ' → 'tva_intracommunautaire'

CREATE OR REPLACE FUNCTION public.handle_company_update() RETURNS TRIGGER AS $$
DECLARE
  v_owner_email TEXT;
  v_changed_fields JSONB := '{}';
  v_has_changes BOOLEAN := false;
BEGIN
  -- Récupérer l'email du propriétaire
  v_owner_email := public.get_company_owner_email(NEW.id);
  
  -- Détecter les changements de manière explicite mais flexible
  -- Cette approche couvre les champs principaux et peut être étendue
  v_changed_fields := jsonb_build_object(
    'company_name', OLD.company_name IS DISTINCT FROM NEW.company_name,
    'siren', OLD.siren IS DISTINCT FROM NEW.siren,
    'siret', OLD.siret IS DISTINCT FROM NEW.siret,
    'address_line_1', OLD.address_line_1 IS DISTINCT FROM NEW.address_line_1,
    'address_line_2', OLD.address_line_2 IS DISTINCT FROM NEW.address_line_2,
    'postal_code', OLD.postal_code IS DISTINCT FROM NEW.postal_code,
    'city', OLD.city IS DISTINCT FROM NEW.city,
    'country', OLD.country IS DISTINCT FROM NEW.country,
    'phone', OLD.phone IS DISTINCT FROM NEW.phone,
    'email', OLD.email IS DISTINCT FROM NEW.email,
    'website', OLD.website IS DISTINCT FROM NEW.website,
    'description', OLD.description IS DISTINCT FROM NEW.description,
    'ape_code', OLD.ape_code IS DISTINCT FROM NEW.ape_code,
    'vat_number', OLD.vat_number IS DISTINCT FROM NEW.vat_number,
    'payment_terms', OLD.payment_terms IS DISTINCT FROM NEW.payment_terms,
    'rib', OLD.rib IS DISTINCT FROM NEW.rib,
    'contacts', OLD.contacts IS DISTINCT FROM NEW.contacts,
    'logo_url', OLD.logo_url IS DISTINCT FROM NEW.logo_url
    -- 🆕 AJOUTEZ VOTRE NOUVEAU CHAMP ICI :
    -- 'nouveau_champ', OLD.nouveau_champ IS DISTINCT FROM NEW.nouveau_champ
  );
  
  -- Vérifier s'il y a des changements
  SELECT EXISTS (
    SELECT 1 FROM jsonb_each(v_changed_fields) 
    WHERE value::boolean = true
  ) INTO v_has_changes;
  
  -- Notifier seulement s'il y a des changements
  IF v_has_changes THEN
    PERFORM public.notify_shared_users_simple(
      NEW.id,
      'company_updated',
      'Fiche d''entreprise mise à jour',
      'La fiche de l''entreprise "' || NEW.company_name || '" a été mise à jour.',
      v_owner_email,
      jsonb_build_object(
        'company_name', NEW.company_name,
        'changed_fields', v_changed_fields
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions d'utilisation :
-- 1. Remplacez 'nouveau_champ' par le nom de votre nouvelle colonne
-- 2. Décommentez la ligne avec votre nouveau champ
-- 3. Exécutez ce script
-- 4. Le système détectera automatiquement les changements de ce champ

-- Exemple pour ajouter 'tva_intracommunautaire' :
-- 'tva_intracommunautaire', OLD.tva_intracommunautaire IS DISTINCT FROM NEW.tva_intracommunautaire 