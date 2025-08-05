-- Ajout de la colonne display_name pour améliorer l'affichage des documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Mise à jour des documents existants
UPDATE documents 
SET display_name = COALESCE(
  document_name || ' ' || document_type || ' ' || COALESCE(document_version, ''),
  file_name,
  'Document'
)
WHERE display_name IS NULL;

-- Vérification
SELECT 
  id,
  file_name,
  document_name,
  document_type,
  document_version,
  display_name,
  created_at
FROM documents 
ORDER BY created_at DESC;
