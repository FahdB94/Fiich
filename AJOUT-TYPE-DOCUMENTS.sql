-- AJOUT TYPE DOCUMENTS
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne document_type à la table documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'autre';

-- 2. Ajouter un index sur document_type pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- 3. Ajouter une contrainte pour limiter les types de documents
ALTER TABLE documents 
ADD CONSTRAINT check_document_type 
CHECK (document_type IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'));

-- 4. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN documents.document_type IS 'Type de document: rib, kbis, contrat, facture, devis, autre';

-- 5. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name IN ('id', 'company_id', 'name', 'file_path', 'file_size', 'mime_type', 'document_type', 'is_public', 'created_at');

-- 6. Message de confirmation
SELECT 'Colonne document_type ajoutée avec succès!' as status; 