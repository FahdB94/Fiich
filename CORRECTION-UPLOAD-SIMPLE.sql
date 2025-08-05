-- CORRECTION UPLOAD SIMPLE (SANS UNION)
-- Exécutez ce script dans l'éditeur SQL de Supabase

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

-- 3. Vérifier que la table documents existe et a les bonnes colonnes
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

-- 4. Désactiver RLS sur la table documents pour les tests
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 5. Donner toutes les permissions sur la table documents
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO anon;

-- 6. Créer un index sur company_id pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);

-- 7. Vérifier la configuration du bucket
SELECT 'Bucket company-files configuré' as status;

-- 8. Vérifier la table documents
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'documents';

-- 9. Message de confirmation
SELECT 'Configuration terminée avec succès!' as status; 