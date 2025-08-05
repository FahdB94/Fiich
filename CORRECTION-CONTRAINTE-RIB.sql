-- CORRECTION CONTRAINTE RIB
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Supprimer la contrainte RIB existante si elle existe
DO $$
BEGIN
    -- Vérifier si la contrainte existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_rib_format' 
        AND table_name = 'companies'
    ) THEN
        ALTER TABLE companies DROP CONSTRAINT check_rib_format;
        RAISE NOTICE 'Contrainte check_rib_format supprimée';
    ELSE
        RAISE NOTICE 'Contrainte check_rib_format n''existe pas';
    END IF;
END $$;

-- 2. Vérifier s'il y a d'autres contraintes sur le RIB
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'companies' 
AND constraint_name LIKE '%rib%';

-- 3. Message de confirmation
SELECT 'Contrainte RIB corrigée avec succès!' as status; 