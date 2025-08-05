-- VERIFICATION STRUCTURE DOCUMENTS
-- Vérifie la structure actuelle de la table documents

-- 1. Structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- 2. Contraintes existantes
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%document%';

-- 3. Valeurs actuelles dans document_type
SELECT 
    document_type,
    COUNT(*) as count
FROM documents
GROUP BY document_type
ORDER BY count DESC;

-- 4. Documents avec des valeurs problématiques
SELECT 
    id,
    name,
    document_type,
    created_at
FROM documents
WHERE document_type IS NULL 
   OR document_type = ''
   OR document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre')
ORDER BY created_at DESC
LIMIT 10; 