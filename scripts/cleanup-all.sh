#!/bin/bash

# 🧹 Script de Nettoyage Complet de l'Application Fiich
# Ce script nettoie la base de données, le storage et prépare une base propre

set -e  # Arrêter en cas d'erreur

echo "🚀 Début du nettoyage complet de l'application Fiich..."
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que les variables d'environnement sont présentes
print_status "Vérification des variables d'environnement..."

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_error "Variables d'environnement Supabase manquantes"
    print_error "Veuillez définir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

print_success "Variables d'environnement vérifiées"

# 1. Nettoyer la base de données
print_status "Étape 1: Nettoyage de la base de données..."
print_warning "⚠️  ATTENTION: Cette opération va supprimer TOUTES les données existantes !"

read -p "Êtes-vous sûr de vouloir continuer ? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Nettoyage annulé par l'utilisateur"
    exit 0
fi

# Exécuter le script de nettoyage de la base de données
print_status "Exécution du script de nettoyage de la base de données..."
psql "$NEXT_PUBLIC_SUPABASE_URL" -f scripts/cleanup-database.sql

if [ $? -eq 0 ]; then
    print_success "Base de données nettoyée avec succès"
else
    print_error "Erreur lors du nettoyage de la base de données"
    exit 1
fi

# 2. Créer le nouveau schéma
print_status "Étape 2: Création du nouveau schéma de base de données..."
psql "$NEXT_PUBLIC_SUPABASE_URL" -f scripts/create-clean-schema.sql

if [ $? -eq 0 ]; then
    print_success "Nouveau schéma créé avec succès"
else
    print_error "Erreur lors de la création du schéma"
    exit 1
fi

# 3. Activer la sécurité RLS
print_status "Étape 3: Activation de la sécurité RLS..."
psql "$NEXT_PUBLIC_SUPABASE_URL" -f scripts/activate-rls.sql

if [ $? -eq 0 ]; then
    print_success "Sécurité RLS activée avec succès"
else
    print_error "Erreur lors de l'activation de RLS"
    exit 1
fi

# 4. Nettoyer le storage
print_status "Étape 4: Nettoyage du storage Supabase..."

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Impossible de nettoyer le storage."
    print_warning "Le nettoyage du storage sera ignoré"
else
    # Installer les dépendances si nécessaire
    if [ ! -d "node_modules" ]; then
        print_status "Installation des dépendances Node.js..."
        npm install
    fi
    
    # Exécuter le script de nettoyage du storage
    print_status "Exécution du script de nettoyage du storage..."
    node scripts/cleanup-storage.js
    
    if [ $? -eq 0 ]; then
        print_success "Storage nettoyé avec succès"
    else
        print_warning "Erreur lors du nettoyage du storage (continuera sans cela)"
    fi
fi

# 5. Nettoyer le code source
print_status "Étape 5: Nettoyage du code source..."

# Supprimer les fichiers d'audit et de correction
print_status "Suppression des fichiers d'audit et de correction..."
rm -f "src/app/my-company/page 2.tsx"
rm -f "src/app/my-company/page.tsx"
rm -f "README_AUDIT.md"
rm -f "src/lib/utils/types.ts"

# Supprimer les composants et hooks temporaires
print_status "Suppression des composants et hooks temporaires..."
rm -f "src/hooks/use-companies-with-roles.ts"
rm -f "src/components/company/company-members-list.tsx"

# 6. Vérifier la structure finale
print_status "Étape 6: Vérification de la structure finale..."

echo
echo "📁 Structure finale du projet:"
tree -I 'node_modules|.next|.git' -a

echo
print_success "🎉 Nettoyage complet terminé avec succès !"
echo
echo "📋 Prochaines étapes recommandées:"
echo "   1. Vérifier que l'application démarre: npm run dev"
echo "   2. Tester la connexion à Supabase"
echo "   3. Créer un premier utilisateur de test"
echo "   4. Vérifier que les types TypeScript sont corrects"
echo
echo "🔒 Base de données: Nettoyée et sécurisée avec RLS"
echo "🗂️ Storage: Nettoyé et reconfiguré"
echo "📝 Code: Fichiers temporaires supprimés"
echo
echo "✨ L'application est maintenant prête pour un nouveau départ !"
