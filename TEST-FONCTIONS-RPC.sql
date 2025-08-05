-- ========================================
-- TEST COMPLET DES FONCTIONS RPC
-- ========================================

-- 1. Récupérer votre user_id
SELECT 
    '🔍 Votre user_id:' as info,
    u.id as user_id,
    u.email,
    pu.first_name,
    pu.last_name
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.email = 'coroalamelo@gmail.com';

-- 2. Tester la fonction get_invitations_by_email
SELECT 
    '📧 Test get_invitations_by_email:' as test,
    COUNT(*) as nombre_invitations_recues
FROM get_invitations_by_email('coroalamelo@gmail.com');

-- 3. Tester la fonction get_sent_invitations_by_user (avec le user_id obtenu)
-- Remplacez 'VOTRE_USER_ID_REEL' par l'ID obtenu à l'étape 1
SELECT 
    '📤 Test get_sent_invitations_by_user:' as test,
    COUNT(*) as nombre_invitations_envoyees
FROM get_sent_invitations_by_user('VOTRE_USER_ID_REEL');

-- 4. Vérifier que les fonctions existent
SELECT 
    '✅ Vérification des fonctions:' as status,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_invitations_by_email', 'get_sent_invitations_by_user')
AND routine_schema = 'public';
