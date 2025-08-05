-- =====================================================
-- NETTOYAGE MANUEL FINAL DES DOCUMENTS ORPHELINS
-- =====================================================

-- 1. IDENTIFICATION DU DOCUMENT ORPHELIN
-- =====================================================

-- Lister le document orphelin spécifique
SELECT 'DOCUMENT ORPHELIN IDENTIFIÉ:' as info;
SELECT 
    id,
    name,
    file_path,
    company_id,
    is_public,
    document_type,
    created_at
FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 2. SUPPRESSION MANUELLE
-- =====================================================

-- Supprimer d'abord les logs d'audit associés au document
WHERE document_id = (
    SELECT id FROM documents 
    WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf'
);

-- Supprimer ensuite le document orphelin spécifique
DELETE FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 3. VÉRIFICATION APRÈS SUPPRESSION
-- =====================================================

-- Vérifier qu'il ne reste plus de documents
SELECT 'VÉRIFICATION APRÈS SUPPRESSION:' as info;
SELECT 
    COUNT(*) as total_documents,
    COUNT(CASE WHEN is_public = true THEN 1 END) as public_documents,
    COUNT(CASE WHEN is_public = false THEN 1 END) as private_documents
FROM documents;

-- Lister tous les documents restants (s'il y en a)
SELECT 'DOCUMENTS RESTANTS:' as info;
SELECT 
    id,
    name,
    file_path,
    company_id,
    is_public,
    document_type,
    created_at
FROM documents 
ORDER BY created_at DESC;

-- 4. NETTOYAGE DES LOGS D'AUDIT ORPHELINS
-- =====================================================

-- Supprimer les entrées d'audit orphelines
SELECT 'NETTOYAGE DES LOGS D''AUDIT ORPHELINS:' as info;

-- Compter les logs d'audit restants
SELECT 'STATISTIQUES DES LOGS D''AUDIT:' as info;
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN document_id IS NOT NULL THEN 1 END) as logs_with_document,
    COUNT(CASE WHEN document_id IS NULL THEN 1 END) as orphaned_logs

-- 5. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier l'intégrité des logs d'audit
SELECT 'VÉRIFICATION DE L''INTÉGRITÉ DES LOGS D''AUDIT:' as info;
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN d.id IS NOT NULL THEN 1 END) as logs_with_valid_document,
    COUNT(CASE WHEN d.id IS NULL THEN 1 END) as logs_with_invalid_document
LEFT JOIN documents d ON dal.document_id = d.id;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

-- Après l'exécution de ce script :
-- 1. Le document orphelin sera supprimé
-- 2. Aucun document ne restera en base de données
-- 3. Les logs d'audit orphelins seront nettoyés
-- 4. L'erreur "Object not found" ne devrait plus apparaître 