-- CORRECTION CONTRAINTE COMPLETE
-- Supprime et recrée la contrainte document_type correctement

-- 1. Supprimer la contrainte existante si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_document_type'
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents DROP CONSTRAINT check_document_type;
    END IF;
END $$;

-- 2. Corriger les valeurs invalides
UPDATE documents
SET document_type = 'autre'
WHERE document_type IS NULL OR document_type = '';

UPDATE documents
SET document_type = 'autre'
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre');

-- 3. S'assurer que la colonne document_type existe avec la bonne valeur par défaut
ALTER TABLE documents 
ALTER COLUMN document_type SET DEFAULT 'autre';

-- 4. Recréer la contrainte
ALTER TABLE documents
ADD CONSTRAINT check_document_type
CHECK (document_type IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'));

-- 5. Vérification
SELECT 
    document_type,
    COUNT(*) as count
FROM documents
GROUP BY document_type
ORDER BY count DESC;

-- 6. Vérifier qu'il n'y a plus de valeurs invalides
SELECT COUNT(*) as invalid_count
FROM documents
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'); 