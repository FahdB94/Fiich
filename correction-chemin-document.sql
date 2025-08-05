-- =====================================================
-- CORRECTION DU CHEMIN DU DOCUMENT
-- =====================================================

-- 1. IDENTIFICATION DU DOCUMENT À CORRIGER
-- =====================================================

-- Lister le document avec le chemin incorrect
SELECT 'DOCUMENT À CORRIGER:' as info;
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

-- 2. CORRECTION DU CHEMIN
-- =====================================================

-- Mettre à jour le chemin du fichier pour qu'il corresponde à l'emplacement réel
UPDATE documents 
SET 
    file_path = '1754079146251-Document_de_Synthese_J00129376059_v1.pdf',
    updated_at = NOW()
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 3. VÉRIFICATION APRÈS CORRECTION
-- =====================================================

-- Vérifier que la correction a été appliquée
SELECT 'VÉRIFICATION APRÈS CORRECTION:' as info;
SELECT 
    id,
    name,
    file_path,
    company_id,
    is_public,
    document_type,
    updated_at
FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 4. TEST DE COHÉRENCE
-- =====================================================

-- Vérifier que le nouveau chemin correspond à l'URL qui fonctionne
SELECT 'TEST DE COHÉRENCE:' as info;
SELECT 
    'Chemin en base:' as info,
    file_path as chemin_base,
    'Chemin attendu:' as info2,
    '1754079146251-Document_de_Synthese_J00129376059_v1.pdf' as chemin_attendu,
    CASE 
        WHEN file_path = '1754079146251-Document_de_Synthese_J00129376059_v1.pdf' 
        THEN '✅ Cohérent' 
        ELSE '❌ Incohérent' 
    END as statut
FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 5. VÉRIFICATION FINALE
-- =====================================================

-- Lister tous les documents pour vérification
SELECT 'DOCUMENTS FINAUX:' as info;
SELECT 
    id,
    name,
    file_path,
    company_id,
    is_public,
    document_type,
    created_at,
    updated_at
FROM documents 
ORDER BY created_at DESC;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

-- Après l'exécution de ce script :
-- 1. Le chemin du document sera corrigé
-- 2. Le fichier sera accessible via l'URL publique
-- 3. L'erreur "Object not found" ne devrait plus apparaître
-- 4. Le partage de documents fonctionnera correctement

-- URL attendue après correction :
-- https://jjibjvxdiqvuseaexivl.supabase.co/storage/v1/object/public/company-files/documents/1754079146251-Document_de_Synthese_J00129376059_v1.pdf 