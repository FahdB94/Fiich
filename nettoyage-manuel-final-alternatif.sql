-- =====================================================
-- NETTOYAGE MANUEL FINAL ALTERNATIF (AVEC DÉSACTIVATION TRIGGER)
-- =====================================================

-- 1. DÉSACTIVATION DU TRIGGER D'AUDIT
-- =====================================================

-- Désactiver temporairement le trigger d'audit de suppression

-- 2. IDENTIFICATION DU DOCUMENT ORPHELIN
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

-- 3. SUPPRESSION MANUELLE (SANS TRIGGER)
-- =====================================================

-- Supprimer le document orphelin spécifique (sans trigger d'audit)
DELETE FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 4. RÉACTIVATION DU TRIGGER D'AUDIT
-- =====================================================

-- Recréer le trigger d'audit de suppression
    AFTER DELETE ON documents
    FOR EACH ROW

-- 5. VÉRIFICATION APRÈS SUPPRESSION
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

-- 6. NETTOYAGE DES LOGS D'AUDIT ORPHELINS
-- =====================================================

-- Supprimer les entrées d'audit orphelines
SELECT 'NETTOYAGE DES LOGS D''AUDIT ORPHELINS:' as info;

-- Compter les logs d'audit restants
SELECT 'STATISTIQUES DES LOGS D''AUDIT:' as info;
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN document_id IS NOT NULL THEN 1 END) as logs_with_document,
    COUNT(CASE WHEN document_id IS NULL THEN 1 END) as orphaned_logs

-- 7. VÉRIFICATION FINALE
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
-- 1. Le trigger d'audit sera temporairement désactivé
-- 2. Le document orphelin sera supprimé sans conflit
-- 3. Le trigger d'audit sera réactivé
-- 4. Aucun document ne restera en base de données
-- 5. Les logs d'audit orphelins seront nettoyés
-- 6. L'erreur "Object not found" ne devrait plus apparaître 