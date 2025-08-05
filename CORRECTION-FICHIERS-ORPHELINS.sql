-- =====================================================
-- CORRECTION AUTOMATIQUE DES FICHIERS ORPHELINS
-- =====================================================
-- Ce script permet de nettoyer automatiquement les entrées
-- de la table 'documents' qui référencent des fichiers
-- n'existant plus dans le stockage Supabase.

-- =====================================================
-- FONCTION POUR VÉRIFIER L'EXISTENCE D'UN FICHIER
-- =====================================================

CREATE OR REPLACE FUNCTION check_file_exists(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_exists BOOLEAN;
BEGIN
  -- Vérifier si le fichier existe dans le bucket 'company-files'
  SELECT EXISTS (
    SELECT 1 
    FROM storage.objects 
    WHERE bucket_id = 'company-files' 
    AND name = 'documents/' || file_path
  ) INTO file_exists;
  
  RETURN COALESCE(file_exists, FALSE);
END;
$$;

-- =====================================================
-- FONCTION POUR NETTOYER LES FICHIERS ORPHELINS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_documents()
RETURNS TABLE(
  deleted_count INTEGER,
  deleted_files TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_record RECORD;
  deleted_files_array TEXT[] := ARRAY[]::TEXT[];
  deleted_count INTEGER := 0;
BEGIN
  -- Parcourir tous les documents
  FOR doc_record IN 
    SELECT id, file_path, name 
    FROM documents 
    WHERE NOT check_file_exists(file_path)
  LOOP
    -- Supprimer l'entrée de la base de données
    DELETE FROM documents WHERE id = doc_record.id;
    
    -- Ajouter à la liste des fichiers supprimés
    deleted_files_array := array_append(deleted_files_array, doc_record.file_path);
    deleted_count := deleted_count + 1;
    
    -- Log de la suppression
    RAISE NOTICE 'Supprimé: % (ID: %)', doc_record.file_path, doc_record.id;
  END LOOP;
  
  -- Retourner les résultats
  RETURN QUERY SELECT deleted_count, deleted_files_array;
END;
$$;

-- =====================================================
-- FONCTION POUR VÉRIFIER L'ÉTAT DES DOCUMENTS
-- =====================================================

CREATE OR REPLACE FUNCTION check_documents_status()
RETURNS TABLE(
  total_documents INTEGER,
  existing_files INTEGER,
  missing_files INTEGER,
  missing_file_paths TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
  existing_count INTEGER := 0;
  missing_count INTEGER := 0;
  missing_paths TEXT[] := ARRAY[]::TEXT[];
  doc_record RECORD;
BEGIN
  -- Compter le total des documents
  SELECT COUNT(*) INTO total_count FROM documents;
  
  -- Vérifier chaque document
  FOR doc_record IN SELECT file_path FROM documents LOOP
    IF check_file_exists(doc_record.file_path) THEN
      existing_count := existing_count + 1;
    ELSE
      missing_count := missing_count + 1;
      missing_paths := array_append(missing_paths, doc_record.file_path);
    END IF;
  END LOOP;
  
  -- Retourner les résultats
  RETURN QUERY SELECT total_count, existing_count, missing_count, missing_paths;
END;
$$;

-- =====================================================
-- TRIGGER POUR NETTOYAGE AUTOMATIQUE
-- =====================================================

-- Fonction trigger pour nettoyer automatiquement lors de la suppression d'un fichier
CREATE OR REPLACE FUNCTION handle_file_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si un fichier est supprimé du storage, supprimer l'entrée correspondante
  IF TG_OP = 'DELETE' THEN
    DELETE FROM documents 
    WHERE file_path = REPLACE(OLD.name, 'documents/', '');
    
    RAISE NOTICE 'Entrée supprimée pour le fichier: %', OLD.name;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Créer le trigger (optionnel - à activer si nécessaire)
-- CREATE TRIGGER storage_file_deletion_trigger
--   AFTER DELETE ON storage.objects
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_file_deletion();

-- =====================================================
-- EXEMPLES D'UTILISATION
-- =====================================================

-- 1. Vérifier l'état actuel des documents
-- SELECT * FROM check_documents_status();

-- 2. Nettoyer les fichiers orphelins
-- SELECT * FROM cleanup_orphaned_documents();

-- 3. Vérifier un fichier spécifique
-- SELECT check_file_exists('feab1dd5-e92e-4b72-a3bf-82cdb27d15d6/1754059702600-Document_de_Synthese_J00129376059_v1.pdf');

-- =====================================================
-- MAINTENANCE AUTOMATIQUE (CRON JOB)
-- =====================================================

-- Pour une maintenance automatique, vous pouvez créer un cron job
-- qui exécute périodiquement cette requête :

-- SELECT cleanup_orphaned_documents();

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION check_file_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION check_documents_status() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_file_deletion() TO authenticated;

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

-- 1. Ces fonctions nécessitent les permissions appropriées sur storage.objects
-- 2. Le trigger automatique est commenté par défaut pour éviter les suppressions accidentelles
-- 3. Testez toujours les fonctions sur un environnement de développement avant la production
-- 4. Considérez créer des sauvegardes avant d'exécuter le nettoyage en masse 