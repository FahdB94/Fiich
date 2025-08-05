-- Script de correction complet pour Logo et Modal
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Ajouter la colonne logo_url si elle n'existe pas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND table_schema = 'public' 
AND column_name = 'logo_url';

-- 3. S'assurer que les politiques RLS permettent la mise à jour
-- Vérifier les politiques existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'companies';

-- 4. Créer une politique pour permettre la mise à jour du logo_url si elle n'existe pas
-- (Les politiques RLS sont généralement désactivées pour les tests, donc on ne les touche pas)

-- 5. Vérifier le bucket company-files
-- Note: Les buckets doivent être créés manuellement dans l'interface Supabase

-- 6. Créer les politiques de storage pour les logos
-- Politique pour permettre l'upload de logos par les utilisateurs authentifiés
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-files' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'logos'
);

-- Politique pour permettre la lecture publique des logos
CREATE POLICY IF NOT EXISTS "Allow public read access to logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'company-files' AND 
  (storage.foldername(name))[1] = 'logos'
);

-- Politique pour permettre la mise à jour des logos par les propriétaires
CREATE POLICY IF NOT EXISTS "Allow users to update their logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-files' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'logos'
);

-- Politique pour permettre la suppression des logos par les propriétaires
CREATE POLICY IF NOT EXISTS "Allow users to delete their logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-files' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'logos'
);

-- 7. Vérifier les politiques de storage créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 8. Afficher un message de confirmation
DO $$
BEGIN
    -- Vérifier la colonne logo_url
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND table_schema = 'public' 
        AND column_name = 'logo_url'
    ) THEN
        RAISE NOTICE '✅ Colonne logo_url ajoutée avec succès à la table companies';
    ELSE
        RAISE NOTICE '❌ Erreur: La colonne logo_url n''a pas pu être ajoutée';
    END IF;
    
    -- Vérifier les politiques de storage
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Allow public read access to logos'
    ) THEN
        RAISE NOTICE '✅ Politiques de storage pour les logos configurées';
    ELSE
        RAISE NOTICE '⚠️  Vérifiez manuellement les politiques de storage';
    END IF;
    
    RAISE NOTICE '📋 Prochaines étapes:';
    RAISE NOTICE '1. Vérifiez que le bucket "company-files" existe dans Storage';
    RAISE NOTICE '2. Testez l''upload d''un logo dans l''application';
    RAISE NOTICE '3. Vérifiez les logs dans la console du navigateur';
END $$; 