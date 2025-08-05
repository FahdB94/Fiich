-- Ajout des colonnes pour améliorer l'affichage des documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_name TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS document_version TEXT,
ADD COLUMN IF NOT EXISTS document_reference TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Mise à jour des documents existants avec des informations extraites du nom de fichier
UPDATE documents 
SET 
  document_name = CASE 
    WHEN file_path LIKE '%Synthese%' THEN 'Document de Synthèse'
    WHEN file_path LIKE '%Bilan%' THEN 'Bilan'
    WHEN file_path LIKE '%Compte%' THEN 'Comptes'
    WHEN file_path LIKE '%Declaration%' THEN 'Déclaration'
    ELSE 'Document'
  END,
  document_type = CASE 
    WHEN file_path LIKE '%Synthese%' THEN 'Synthèse'
    WHEN file_path LIKE '%Bilan%' THEN 'Bilan'
    WHEN file_path LIKE '%Compte%' THEN 'Comptes'
    WHEN file_path LIKE '%Declaration%' THEN 'Déclaration'
    ELSE 'PDF'
  END,
  document_version = CASE 
    WHEN file_path LIKE '%v1%' THEN 'v1'
    WHEN file_path LIKE '%v2%' THEN 'v2'
    WHEN file_path LIKE '%v3%' THEN 'v3'
    ELSE ''
  END,
  document_reference = CASE 
    WHEN file_path ~ 'J[0-9]+' THEN (regexp_match(file_path, 'J[0-9]+'))[1]
    ELSE ''
  END,
  display_name = CASE 
    WHEN file_path LIKE '%Synthese%' THEN 'Document de Synthèse Synthèse v1'
    WHEN file_path LIKE '%Bilan%' THEN 'Bilan Bilan'
    WHEN file_path LIKE '%Compte%' THEN 'Comptes Comptes'
    WHEN file_path LIKE '%Declaration%' THEN 'Déclaration Déclaration'
    ELSE COALESCE(file_name, 'Document')
  END
WHERE document_name IS NULL;

-- Vérification des résultats
SELECT 
  id,
  file_name,
  document_name,
  document_type,
  document_version,
  document_reference,
  display_name,
  created_at
FROM documents 
ORDER BY created_at DESC;
