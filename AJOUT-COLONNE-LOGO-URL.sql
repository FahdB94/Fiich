-- Script pour ajouter la colonne logo_url à la table companies
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

-- 3. Afficher un message de confirmation
DO $$
BEGIN
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
END $$; 