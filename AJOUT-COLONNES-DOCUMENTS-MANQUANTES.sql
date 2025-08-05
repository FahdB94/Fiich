-- AJOUT COLONNES DOCUMENTS MANQUANTES
-- Ajoute toutes les colonnes manquantes à la table documents

-- Colonne display_name
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Colonne document_reference
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_reference TEXT;

-- Colonne document_version
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_version TEXT;

-- Colonne document_type (si elle n'existe pas déjà)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'autre';

-- Contrainte pour document_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_document_type'
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT check_document_type
        CHECK (document_type IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'));
    END IF;
END $$;

-- Mise à jour des documents existants
UPDATE documents
SET display_name = name
WHERE display_name IS NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_display_name ON documents(display_name);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(document_reference);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- Vérification de la structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position; 