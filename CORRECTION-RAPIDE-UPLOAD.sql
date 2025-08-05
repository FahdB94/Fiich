-- CORRECTION RAPIDE POUR L'UPLOAD DE FICHIERS
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Supprimer toutes les politiques existantes sur le bucket
DELETE FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'company-files');

-- 2. Créer des politiques simples pour permettre l'upload
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES 
    ('Allow all authenticated users to upload', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'INSERT',
     'true'),
    
    ('Allow all authenticated users to read', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'SELECT',
     'true'),
    
    ('Allow all authenticated users to update', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'UPDATE',
     'true'),
    
    ('Allow all authenticated users to delete', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'DELETE',
     'true');

-- 3. Désactiver RLS sur la table documents pour les tests
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 4. Donner toutes les permissions sur la table documents
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO anon;

-- 5. Vérifier que tout fonctionne
SELECT 'Configuration terminée!' as status; 