-- CORRECTION DOCUMENT TYPE
-- Corrige les valeurs document_type invalides dans les documents existants

-- Mettre à jour les documents avec des valeurs NULL ou vides
UPDATE documents
SET document_type = 'autre'
WHERE document_type IS NULL OR document_type = '';

-- Mettre à jour les documents avec des valeurs non autorisées
UPDATE documents
SET document_type = 'autre'
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre');

-- Vérifier les valeurs actuelles
SELECT 
    document_type,
    COUNT(*) as count
FROM documents
GROUP BY document_type
ORDER BY count DESC;

-- Vérifier qu'il n'y a plus de valeurs invalides
SELECT 
    id,
    name,
    document_type
FROM documents
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'); 