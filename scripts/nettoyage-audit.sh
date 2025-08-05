#!/bin/bash

# =====================================================
# SCRIPT DE NETTOYAGE DES FICHIERS D'AUDIT - FIICH APP
# =====================================================
# Ce script supprime tous les fichiers et références
# liés à la table Document_audit_logs
# =====================================================

echo "🧹 NETTOYAGE DES FICHIERS D'AUDIT - FIICH APP"
echo "=============================================="

# 1. SUPPRIMER LES FICHIERS OBSOLÈTES
echo ""
echo "1️⃣ Suppression des fichiers obsolètes..."

if [ -f "CREATION-TABLE-AUDIT-DOCUMENTS.sql" ]; then
    rm "CREATION-TABLE-AUDIT-DOCUMENTS.sql"
    echo "   ✅ CREATION-TABLE-AUDIT-DOCUMENTS.sql supprimé"
else
    echo "   ℹ️  CREATION-TABLE-AUDIT-DOCUMENTS.sql n'existe pas"
fi

if [ -f "GUIDE-PREVENTION-FICHIERS-ORPHELINS.md" ]; then
    rm "GUIDE-PREVENTION-FICHIERS-ORPHELINS.md"
    echo "   ✅ GUIDE-PREVENTION-FICHIERS-ORPHELINS.md supprimé"
else
    echo "   ℹ️  GUIDE-PREVENTION-FICHIERS-ORPHELINS.md n'existe pas"
fi

# 2. CORRIGER LES FICHIERS AVEC RÉFÉRENCES
echo ""
echo "2️⃣ Correction des fichiers avec références..."

# resolution-fichiers-manquants-final.sql
if [ -f "resolution-fichiers-manquants-final.sql" ]; then
    sed -i '' '/trigger_audit_document/d' "resolution-fichiers-manquants-final.sql"
    sed -i '' '/audit_document/d' "resolution-fichiers-manquants-final.sql"
    echo "   ✅ resolution-fichiers-manquants-final.sql corrigé"
else
    echo "   ℹ️  resolution-fichiers-manquants-final.sql n'existe pas"
fi

# nettoyage-manuel-final-alternatif.sql
if [ -f "nettoyage-manuel-final-alternatif.sql" ]; then
    sed -i '' '/trigger_audit_document/d' "nettoyage-manuel-final-alternatif.sql"
    sed -i '' '/audit_document/d' "nettoyage-manuel-final-alternatif.sql"
    echo "   ✅ nettoyage-manuel-final-alternatif.sql corrigé"
else
    echo "   ℹ️  nettoyage-manuel-final-alternatif.sql n'existe pas"
fi

# resolution-fichiers-manquants-definitive-finale.sql
if [ -f "resolution-fichiers-manquants-definitive-finale.sql" ]; then
    sed -i '' '/trigger_audit_document/d' "resolution-fichiers-manquants-definitive-finale.sql"
    sed -i '' '/audit_document/d' "resolution-fichiers-manquants-definitive-finale.sql"
    sed -i '' '/log_document_action/d' "resolution-fichiers-manquants-definitive-finale.sql"
    echo "   ✅ resolution-fichiers-manquants-definitive-finale.sql corrigé"
else
    echo "   ℹ️  resolution-fichiers-manquants-definitive-finale.sql n'existe pas"
fi

# CONFIGURATION-PERMISSIONS-PARTAGE.sql
if [ -f "CONFIGURATION-PERMISSIONS-PARTAGE.sql" ]; then
    sed -i '' '/document_audit_logs/d' "CONFIGURATION-PERMISSIONS-PARTAGE.sql"
    sed -i '' '/log_document_action/d' "CONFIGURATION-PERMISSIONS-PARTAGE.sql"
    echo "   ✅ CONFIGURATION-PERMISSIONS-PARTAGE.sql corrigé"
else
    echo "   ℹ️  CONFIGURATION-PERMISSIONS-PARTAGE.sql n'existe pas"
fi

# 3. VÉRIFICATION DES RÉFÉRENCES RESTANTES
echo ""
echo "3️⃣ Vérification des références restantes..."

echo "   Recherche de 'document_audit_logs'..."
grep -r "document_audit_logs" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || echo "   ✅ Aucune référence trouvée"

echo "   Recherche de 'audit_document'..."
grep -r "audit_document" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || echo "   ✅ Aucune référence trouvée"

echo "   Recherche de 'log_document_action'..."
grep -r "log_document_action" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || echo "   ✅ Aucune référence trouvée"

echo "   Recherche de 'analyze_orphaned_files'..."
grep -r "analyze_orphaned_files" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || echo "   ✅ Aucune référence trouvée"

echo "   Recherche de 'get_document_history'..."
grep -r "get_document_history" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null || echo "   ✅ Aucune référence trouvée"

# 4. MESSAGE DE CONFIRMATION
echo ""
echo "🎉 NETTOYAGE TERMINÉ !"
echo "======================"
echo ""
echo "✅ Tous les fichiers liés à Document_audit_logs ont été nettoyés"
echo "✅ Votre application Fiich est prête pour la recréation de la base"
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo "1. Exécuter le script SCRIPT-RECREATION-BASE-COMPLETE.sql dans Supabase"
echo "2. Tester l'application"
echo "3. Vérifier que toutes les fonctionnalités marchent"
echo ""
echo "🚀 Bon développement !" 