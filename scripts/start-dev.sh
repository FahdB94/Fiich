#!/bin/bash

# Script de démarrage pour l'application Fiich
# Usage: ./scripts/start-dev.sh

echo "🚀 Démarrage de l'application Fiich..."
echo ""

# Vérifier si .env.local existe
if [ ! -f ".env.local" ]; then
    echo "❌ Fichier .env.local manquant !"
    echo "📋 Consultez CONFIGURATION-ENVIRONNEMENT.md pour créer ce fichier."
    exit 1
fi

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Exécuter les tests de configuration
echo "🧪 Vérification de la configuration..."
npm run test:setup

# Vérifier le code de retour
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration OK ! Démarrage de l'application..."
    echo ""
    echo "🌐 L'application sera accessible sur http://localhost:3000"
    echo ""
    npm run dev
else
    echo ""
    echo "❌ La configuration n'est pas correcte."
    echo "📋 Consultez CONFIGURATION-ENVIRONNEMENT.md pour corriger les problèmes."
    exit 1
fi