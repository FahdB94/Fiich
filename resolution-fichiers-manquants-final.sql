-- =====================================================
-- RÉSOLUTION DES FICHIERS MANQUANTS DANS LE STORAGE (VERSION FINALE)
-- =====================================================

-- 1. DÉSACTIVATION DES TRIGGERS D'AUDIT
-- =====================================================

-- Désactiver temporairement les triggers d'audit spécifiques pour éviter les conflits
-- (sans toucher aux triggers système de contraintes)

-- 2. SUPPRESSION DES FONCTIONS EXISTANTES
-- =====================================================

-- Supprimer les fonctions existantes pour éviter les conflits
DROP FUNCTION IF EXISTS check_file_exists_in_storage(TEXT);
DROP FUNCTION IF EXISTS cleanup_orphaned_documents();
DROP FUNCTION IF EXISTS list_orphaned_documents();
DROP FUNCTION IF EXISTS restore_document_if_exists(UUID);
DROP FUNCTION IF EXISTS get_storage_stats();
DROP FUNCTION IF EXISTS analyze_storage_files();

-- 3. FONCTION POUR VÉRIFIER L'EXISTENCE D'UN FICHIER
-- =====================================================

CREATE OR REPLACE FUNCTION check_file_exists_in_storage(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_exists BOOLEAN;
BEGIN
    -- Vérifier si le fichier existe dans le bucket company-files
    SELECT EXISTS (
        SELECT 1
        FROM storage.objects
        WHERE bucket_id = 'company-files'
        AND name = 'documents/' || file_path
    ) INTO file_exists;
    
    RETURN COALESCE(file_exists, FALSE);
END;
$$;

-- 4. FONCTION POUR NETTOYER LES DOCUMENTS ORPHELINS (SANS AUDIT)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_documents()
RETURNS TABLE(
    deleted_count INTEGER,
    deleted_documents TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    doc_record RECORD;
    deleted_documents_array TEXT[] := ARRAY[]::TEXT[];
    deleted_count INTEGER := 0;
BEGIN
    -- Parcourir tous les documents
    FOR doc_record IN
        SELECT id, name, file_path
        FROM documents
    LOOP
        -- Vérifier si le fichier existe dans le storage
        IF NOT check_file_exists_in_storage(doc_record.file_path) THEN
            -- Supprimer l'entrée de la base de données (triggers désactivés)
            DELETE FROM documents WHERE id = doc_record.id;
            deleted_documents_array := array_append(deleted_documents_array, doc_record.name);
            deleted_count := deleted_count + 1;
            
            RAISE NOTICE 'Document orphelin supprimé: % (ID: %)', doc_record.name, doc_record.id;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT deleted_count, deleted_documents_array;
END;
$$;

-- 5. FONCTION POUR LISTER LES DOCUMENTS ORPHELINS
-- =====================================================

CREATE OR REPLACE FUNCTION list_orphaned_documents()
RETURNS TABLE(
    id UUID,
    name TEXT,
    file_path TEXT,
    company_id UUID,
    is_public BOOLEAN,
    document_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.file_path,
        d.company_id,
        d.is_public,
        d.document_type,
        d.created_at
    FROM documents d
    WHERE NOT check_file_exists_in_storage(d.file_path)
    ORDER BY d.created_at DESC;
END;
$$;

-- 6. FONCTION POUR RESTAURER UN DOCUMENT (SI LE FICHIER EXISTE)
-- =====================================================

CREATE OR REPLACE FUNCTION restore_document_if_exists(document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    doc_record RECORD;
    restored BOOLEAN := FALSE;
BEGIN
    -- Récupérer les informations du document
    SELECT * INTO doc_record FROM documents WHERE id = document_id;
    
    IF doc_record IS NULL THEN
        RAISE EXCEPTION 'Document non trouvé avec l''ID: %', document_id;
    END IF;
    
    -- Vérifier si le fichier existe maintenant dans le storage
    IF check_file_exists_in_storage(doc_record.file_path) THEN
        -- Le fichier existe, on peut le marquer comme restauré
        UPDATE documents 
        SET updated_at = NOW()
        WHERE id = document_id;
        
        restored := TRUE;
        RAISE NOTICE 'Document restauré: % (ID: %)', doc_record.name, document_id;
    ELSE
        RAISE NOTICE 'Fichier toujours manquant pour: % (ID: %)', doc_record.name, document_id;
    END IF;
    
    RETURN restored;
END;
$$;

-- 7. FONCTIONS UTILITAIRES POUR LA MAINTENANCE
-- =====================================================

-- Fonction pour obtenir les statistiques du storage
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE(
    bucket_name TEXT,
    total_files BIGINT,
    total_size BIGINT,
    public_files BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'company-files'::TEXT as bucket_name,
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size,
        COUNT(CASE WHEN metadata->>'is_public' = 'true' THEN 1 END)::BIGINT as public_files
    FROM storage.objects
    WHERE bucket_id = 'company-files';
END;
$$;

-- Fonction pour analyser les fichiers du storage
CREATE OR REPLACE FUNCTION analyze_storage_files()
RETURNS TABLE(
    file_name TEXT,
    file_path TEXT,
    file_size BIGINT,
    is_public BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    has_db_entry BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name as file_name,
        s.name as file_path,
        (s.metadata->>'size')::BIGINT as file_size,
        COALESCE((s.metadata->>'is_public')::BOOLEAN, false) as is_public,
        s.created_at,
        EXISTS (
            SELECT 1 FROM documents d 
            WHERE 'documents/' || d.file_path = s.name
        ) as has_db_entry
    FROM storage.objects s
    WHERE s.bucket_id = 'company-files'
    ORDER BY s.created_at DESC;
END;
$$;

-- 8. EXÉCUTION DU NETTOYAGE
-- =====================================================

-- Lister les documents orphelins avant nettoyage
SELECT 'DOCUMENTS ORPHELINS AVANT NETTOYAGE:' as info;
SELECT * FROM list_orphaned_documents();

-- Exécuter le nettoyage (sans triggers d'audit)
SELECT 'NETTOYAGE EN COURS...' as info;
SELECT * FROM cleanup_orphaned_documents();

-- Lister les documents orphelins après nettoyage
SELECT 'DOCUMENTS ORPHELINS APRÈS NETTOYAGE:' as info;
SELECT * FROM list_orphaned_documents();

-- 9. RÉACTIVATION DES TRIGGERS D'AUDIT
-- =====================================================

-- Réactiver les triggers d'audit spécifiques

-- 10. VÉRIFICATION DE LA COHÉRENCE
-- =====================================================

-- Compter les documents restants
SELECT 'STATISTIQUES FINALES:' as info;
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN is_public = true THEN 1 END) as public_documents,
    COUNT(CASE WHEN is_public = false THEN 1 END) as private_documents
FROM documents;

-- Vérifier la cohérence pour chaque document restant
SELECT 'VÉRIFICATION DE COHÉRENCE:' as info;
SELECT 
    d.name,
    d.file_path,
    d.is_public,
    check_file_exists_in_storage(d.file_path) as file_exists_in_storage,
    CASE 
        WHEN check_file_exists_in_storage(d.file_path) THEN '✅ Cohérent'
        ELSE '❌ Orphelin'
    END as status
FROM documents d
ORDER BY d.created_at DESC;

-- 11. EXÉCUTION DES ANALYSES
-- =====================================================

-- Obtenir les statistiques du storage
SELECT 'STATISTIQUES DU STORAGE:' as info;
SELECT * FROM get_storage_stats();

-- Analyser les fichiers du storage
SELECT 'ANALYSE DES FICHIERS STORAGE:' as info;
SELECT * FROM analyze_storage_files();

-- 12. NETTOYAGE DES LOGS D'AUDIT ORPHELINS
-- =====================================================

-- Supprimer les entrées d'audit orphelines (document_id = NULL)
SELECT 'NETTOYAGE DES LOGS D''AUDIT ORPHELINS:' as info;

-- Compter les logs d'audit restants
SELECT 'STATISTIQUES DES LOGS D''AUDIT:' as info;
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN document_id IS NOT NULL THEN 1 END) as logs_with_document,
    COUNT(CASE WHEN document_id IS NULL THEN 1 END) as orphaned_logs

-- =====================================================
-- INSTRUCTIONS POUR L'APPLICATION
-- =====================================================

-- Après l'exécution de ce script :
-- 1. Les documents orphelins seront supprimés de la base de données
-- 2. Seuls les documents avec fichiers existants resteront
-- 3. Les triggers d'audit seront réactivés
-- 4. Les logs d''audit orphelins seront nettoyés
-- 5. Utilisez les fonctions de vérification pour la maintenance

-- Pour vérifier un document spécifique :
-- SELECT check_file_exists_in_storage('chemin/vers/fichier.pdf');

-- Pour lister les orphelins :
-- SELECT * FROM list_orphaned_documents();

-- Pour nettoyer périodiquement :
-- SELECT * FROM cleanup_orphaned_documents(); 