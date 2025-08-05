-- Script pour corriger les permissions d'upload vers le bucket storage
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier que le bucket existe
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'company-files';

-- 2. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    gen_random_uuid(),
    'company-files',
    false, -- Bucket privé
    52428800, -- 50MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
)
ON CONFLICT (name) DO NOTHING;

-- 3. Supprimer les anciennes politiques s'il y en a
DELETE FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'company-files');

-- 4. Créer les nouvelles politiques pour le bucket (RLS activé)
-- Politique pour permettre l'upload aux utilisateurs authentifiés
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
    'Allow authenticated users to upload files',
    (SELECT id FROM storage.buckets WHERE name = 'company-files'),
    'INSERT',
    '(auth.role() = ''authenticated'')'
);

-- Politique pour permettre la lecture aux utilisateurs authentifiés
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
    'Allow authenticated users to read files',
    (SELECT id FROM storage.buckets WHERE name = 'company-files'),
    'SELECT',
    '(auth.role() = ''authenticated'')'
);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
    'Allow authenticated users to update files',
    (SELECT id FROM storage.buckets WHERE name = 'company-files'),
    'UPDATE',
    '(auth.role() = ''authenticated'')'
);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
    'Allow authenticated users to delete files',
    (SELECT id FROM storage.buckets WHERE name = 'company-files'),
    'DELETE',
    '(auth.role() = ''authenticated'')'
);

-- 5. Vérifier que la table documents existe et a les bonnes colonnes
DO $$
BEGIN
    -- Ajouter les colonnes manquantes si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'company_id') THEN
        ALTER TABLE documents ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'is_public') THEN
        ALTER TABLE documents ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 6. Désactiver RLS sur la table documents pour les tests (si demandé)
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 7. Vérifier les permissions sur la table documents
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO anon;

-- 8. Créer un index sur company_id pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);

-- 9. Vérifier la configuration finale
SELECT 
    'Bucket configuration' as check_type,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE name = 'company-files'

UNION ALL

SELECT 
    'Storage policies' as check_type,
    name,
    operation,
    definition
FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'company-files')

UNION ALL

SELECT 
    'Documents table RLS' as check_type,
    schemaname,
    tablename,
    rowsecurity::text
FROM pg_tables 
WHERE tablename = 'documents';

-- 10. Message de confirmation
SELECT 'Configuration terminée avec succès!' as status; 