-- CORRECTION BUCKET PUBLIC (SOLUTION RAPIDE)
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Rendre le bucket public temporairement
UPDATE storage.buckets 
SET public = true 
WHERE name = 'company-files';

-- 2. Vérifier la configuration
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'company-files';

-- 3. Message de confirmation
SELECT 'Bucket company-files rendu public avec succès!' as status; 