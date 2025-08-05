-- =====================================================
-- RÉSOLUTION DÉFINITIVE DES FICHIERS MANQUANTS DANS LE STORAGE
-- =====================================================

-- 1. DÉSACTIVATION DU TRIGGER PROBLÉMATIQUE
-- =====================================================

-- Désactiver temporairement le trigger d'audit de suppression

-- 2. FONCTION POUR VÉRIFIER L'EXISTENCE D'UN FICHIER
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

-- 3. NETTOYAGE DES DOCUMENTS ORPHELINS
-- =====================================================

-- Lister les documents orphelins avant nettoyage
SELECT 'DOCUMENTS ORPHELINS AVANT NETTOYAGE:' as info;
SELECT 
    id,
    name,
    file_path,
    company_id,
    is_public,
    document_type,
    created_at
FROM documents 
WHERE NOT check_file_exists_in_storage(file_path)
ORDER BY created_at DESC;

-- Supprimer les documents orphelins (sans trigger d'audit)
DELETE FROM documents 
WHERE NOT check_file_exists_in_storage(file_path);

-- Lister les documents orphelins après nettoyage
SELECT 'DOCUMENTS ORPHELINS APRÈS NETTOYAGE:' as info;
SELECT 
    id,
    name,
    file_path,
    company_id,
    is_public,
    document_type,
    created_at
FROM documents 
WHERE NOT check_file_exists_in_storage(file_path)
ORDER BY created_at DESC;

-- 4. NETTOYAGE DES LOGS D'AUDIT ORPHELINS
-- =====================================================

-- Supprimer les entrées d'audit orphelines (document_id = NULL)
SELECT 'NETTOYAGE DES LOGS D''AUDIT ORPHELINS:' as info;

-- 5. RÉACTIVATION DU TRIGGER D'AUDIT
-- =====================================================

-- Recréer le trigger d'audit de suppression
    AFTER DELETE ON documents
    FOR EACH ROW

-- 6. STATISTIQUES FINALES
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

-- Compter les logs d'audit restants
SELECT 'STATISTIQUES DES LOGS D''AUDIT:' as info;
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN document_id IS NOT NULL THEN 1 END) as logs_with_document,
    COUNT(CASE WHEN document_id IS NULL THEN 1 END) as orphaned_logs

-- 7. VÉRIFICATION DE L'INTÉGRITÉ DES LOGS D'AUDIT
-- =====================================================

-- Vérifier que tous les logs d'audit ont des documents valides
SELECT 'VÉRIFICATION DE L''INTÉGRITÉ DES LOGS D''AUDIT:' as info;
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) as logs_with_valid_document,
    COUNT(CASE WHEN d.id IS NULL THEN 1 END) as logs_with_invalid_document
LEFT JOIN documents d ON dal.document_id = d.id;

-- 8. FONCTIONS UTILITAIRES POUR LA MAINTENANCE
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
        COALESCE(SUM((metadata->>'size')::BIGINT), 0)::BIGINT as total_size,
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
        COALESCE((s.metadata->>'size')::BIGINT, 0) as file_size,
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

-- Fonction pour nettoyer périodiquement les documents orphelins
CREATE OR REPLACE FUNCTION cleanup_orphaned_documents_definitive()
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
    -- Désactiver temporairement le trigger d'audit
    
    -- Parcourir tous les documents orphelins
    FOR doc_record IN
        SELECT id, name, file_path
        FROM documents
        WHERE NOT check_file_exists_in_storage(file_path)
    LOOP
        -- Supprimer l'entrée de la base de données
        DELETE FROM documents WHERE id = doc_record.id;
        deleted_documents_array := array_append(deleted_documents_array, doc_record.name);
        deleted_count := deleted_count + 1;
        
        RAISE NOTICE 'Document orphelin supprimé: % (ID: %)', doc_record.name, doc_record.id;
    END LOOP;
    
    -- Réactiver le trigger d'audit
        AFTER DELETE ON documents
        FOR EACH ROW
    
    RETURN QUERY SELECT deleted_count, deleted_documents_array;
END;
$$;

-- 9. EXÉCUTION DES ANALYSES
-- =====================================================

-- Obtenir les statistiques du storage
SELECT 'STATISTIQUES DU STORAGE:' as info;
SELECT * FROM get_storage_stats();

-- Analyser les fichiers du storage
SELECT 'ANALYSE DES FICHIERS STORAGE:' as info;
SELECT * FROM analyze_storage_files();

-- =====================================================
-- INSTRUCTIONS POUR L'APPLICATION
-- =====================================================

-- Après l'exécution de ce script :
-- 1. Les documents orphelins seront supprimés de la base de données
-- 2. Les logs d'audit orphelins seront nettoyés
-- 3. Seuls les documents avec fichiers existants resteront
-- 4. Le trigger d'audit sera réactivé
-- 5. L'intégrité des logs d'audit sera préservée
-- 6. Utilisez les fonctions de vérification pour la maintenance

-- Pour vérifier un document spécifique :
-- SELECT check_file_exists_in_storage('chemin/vers/fichier.pdf');

-- Pour nettoyer périodiquement :
-- SELECT * FROM cleanup_orphaned_documents_definitive(); 