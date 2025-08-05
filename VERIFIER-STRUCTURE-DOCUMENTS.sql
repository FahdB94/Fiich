-- Vérification de la structure de la table documents
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- Vérification des données actuelles
SELECT 
  id,
  file_name,
  file_path,
  mime_type,
  file_size,
  created_at
FROM documents 
ORDER BY created_at DESC;
