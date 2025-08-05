-- AJOUT COLONNE CONTACTS
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne contacts à la table companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;

-- 2. Ajouter un index sur contacts pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_contacts ON companies USING GIN (contacts);

-- 3. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN companies.contacts IS 'Contacts de l''entreprise au format JSONB';

-- 4. Vérifier la structure de la table companies
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN ('id', 'company_name', 'ape_code', 'vat_number', 'payment_terms', 'rib', 'contacts', 'created_at');

-- 5. Message de confirmation
SELECT 'Colonne contacts ajoutée avec succès!' as status; 