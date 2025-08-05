-- =====================================================
-- CORRECTION FINALE DU CHEMIN DU DOCUMENT
-- =====================================================

-- 1. IDENTIFICATION DU PROBLÈME
-- =====================================================

-- Le problème : l'application construit le chemin comme "documents/${doc.file_path}"
-- Mais le fichier existe directement dans "documents/" sans le sous-dossier entreprise

SELECT 'PROBLÈME IDENTIFIÉ:' as info;
SELECT 
    'Chemin actuel en base:' as description,
    file_path as chemin_actuel,
    'Chemin attendu par l''app:' as description2,
    CONCAT('documents/', file_path) as chemin_app,
    'Chemin réel en storage:' as description3,
    'documents/1754079146251-Document_de_Synthese_J00129376059_v1.pdf' as chemin_reel
FROM documents 
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 2. CORRECTION DU CHEMIN
-- =====================================================

-- Supprimer le préfixe de l'entreprise du file_path
UPDATE documents 
SET 
    file_path = '1754079146251-Document_de_Synthese_J00129376059_v1.pdf',
    updated_at = NOW()
WHERE name = 'Document_de_Synthese_J00129376059_v1.pdf';

-- 3. VÉRIFICATION APRÈS CORRECTION
-- =====================================================

SELECT 'VÉRIFICATION APRÈS CORRECTION:' as info;
SELECT 
    'Chemin corrigé en base:' as description,
    file_path as chemin_corrige,
    'Chemin attendu par l''app:' as description2,
    CONCAT('documents/', file_path) as chemin_app,
    'Chemin réel en storage:' as description3,
    'documents/1754079146251-Document_de_Synthese_J00129376059_v1.pdf' as chemin_reel,
    CASE 
        WHEN CONCAT('documents/', file_path) = 'documents/1754079146251-Document_de_Synthese_J00129376059_v1.pdf'
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

-- 5. TEST DE COHÉRENCE
-- =====================================================

SELECT 'TEST DE COHÉRENCE:' as info;
SELECT 
    'URL attendue après correction:' as description,
    'https://jjibjvxdiqvuseaexivl.supabase.co/storage/v1/object/public/company-files/documents/1754079146251-Document_de_Synthese_J00129376059_v1.pdf' as url_attendue,
    'Cette URL devrait maintenant fonctionner correctement' as note;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

-- Après l'exécution de ce script :
-- 1. ✅ Le chemin en base sera : "1754079146251-Document_de_Synthese_J00129376059_v1.pdf"
-- 2. ✅ L'application construira : "documents/1754079146251-Document_de_Synthese_J00129376059_v1.pdf"
-- 3. ✅ Ce chemin correspondra à l'emplacement réel du fichier
-- 4. ✅ L'erreur "Object not found" ne devrait plus apparaître
-- 5. ✅ Le partage de documents fonctionnera correctement

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

-- 1. Copiez ce script complet
-- 2. Collez-le dans l'éditeur SQL Supabase
-- 3. Exécutez le script
-- 4. Testez l'ouverture du document dans l'application
-- 5. Vérifiez que le partage fonctionne 