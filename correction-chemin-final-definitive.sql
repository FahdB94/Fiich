-- =====================================================
-- CORRECTION FINALE DÉFINITIVE DU CHEMIN DU DOCUMENT
-- =====================================================

-- 1. IDENTIFICATION DU PROBLÈME FINAL
-- =====================================================

-- Le fichier existe réellement à :
-- documents/feab1dd5-e92e-4b72-a3bf-82cdb27d15d6/1754079146251-Document_de_Synthese_J00129376059_v1.pdf
-- Mais l'application cherche à :
-- documents/1754079146251-Document_de_Synthese_J00129376059_v1.pdf

SELECT 'PROBLÈME FINAL IDENTIFIÉ:' as info;
SELECT 
    'Chemin actuel en base:' as description,
    file_path as chemin_actuel,
    'Chemin attendu par l''app:' as description2,
    CONCAT('documents/', file_path) as chemin_app,
    'Chemin réel en storage:' as description3,
    CONCAT('documents/', company_id, '/', file_path) as chemin_reel
FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 2. CORRECTION FINALE DU CHEMIN
-- =====================================================

-- Ajouter le préfixe de l'entreprise au file_path
UPDATE documents 
SET 
    file_path = CONCAT(company_id, '/', file_path),
    updated_at = NOW()
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 3. VÉRIFICATION APRÈS CORRECTION FINALE
-- =====================================================

SELECT 'VÉRIFICATION APRÈS CORRECTION FINALE:' as info;
SELECT 
    'Chemin corrigé en base:' as description,
    file_path as chemin_corrige,
    'Chemin attendu par l''app:' as description2,
    CONCAT('documents/', file_path) as chemin_app,
    'Chemin réel en storage:' as description3,
    CONCAT('documents/', company_id, '/1754079146251-Document_de_Synthese_J00129376059_v1.pdf') as chemin_reel,
    CASE 
        WHEN CONCAT('documents/', file_path) = CONCAT('documents/', company_id, '/1754079146251-Document_de_Synthese_J00129376059_v1.pdf')
        THEN '✅ CORRECT' 
        ELSE '❌ INCORRECT' 
    END as statut
FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 4. VÉRIFICATION COMPLÈTE
-- =====================================================

SELECT 'DOCUMENT FINAL:' as info;
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
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 5. TEST DE COHÉRENCE FINAL
-- =====================================================

SELECT 'TEST DE COHÉRENCE FINAL:' as info;
SELECT 
    'URL attendue après correction:' as description,
    'https://jjibjvxdiqvuseaexivl.supabase.co/storage/v1/object/public/company-files/documents/feab1dd5-e92e-4b72-a3bf-82cdb27d15d6/1754079146251-Document_de_Synthese_J00129376059_v1.pdf' as url_attendue,
    'Cette URL devrait maintenant correspondre exactement au fichier existant' as note;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

-- Après l'exécution de ce script :
-- 1. ✅ Le chemin en base sera : "feab1dd5-e92e-4b72-a3bf-82cdb27d15d6/1754079146251-Document_de_Synthese_J00129376059_v1.pdf"
-- 2. ✅ L'application construira : "documents/feab1dd5-e92e-4b72-a3bf-82cdb27d15d6/1754079146251-Document_de_Synthese_J00129376059_v1.pdf"
-- 3. ✅ Ce chemin correspondra exactement à l'emplacement réel du fichier
-- 4. ✅ L'erreur "Object not found" ne devrait plus apparaître
-- 5. ✅ Le partage de documents fonctionnera correctement

-- =====================================================
-- INSTRUCTIONS FINALES
-- =====================================================

-- 1. Copiez ce script complet
-- 2. Collez-le dans l'éditeur SQL Supabase
-- 3. Exécutez le script
-- 4. Testez immédiatement l'ouverture du document dans l'application
-- 5. Vérifiez que le partage fonctionne sur la page partagée

-- =====================================================
-- VÉRIFICATION MANUELLE
-- =====================================================

-- Après exécution, vérifiez que :
-- - Le document s'ouvre correctement dans l'application
-- - L'URL générée correspond à l'URL qui fonctionne
-- - Le partage fonctionne sur la page partagée
-- - Aucune erreur "Object not found" n'apparaît 