# 🚀 GUIDE DE RECRÉATION COMPLÈTE DE LA BASE DE DONNÉES FIICH

## 📋 PRÉREQUIS

- ✅ Projet Supabase configuré avec les clés API
- ✅ Application Fiich locale fonctionnelle
- ✅ Fichier `.env.local` configuré

## 🎯 OBJECTIF

Recréer complètement la base de données Supabase en excluant la table `Document_audit_logs` qui causait des problèmes.

## 📁 FICHIERS CRÉÉS

1. **`SCRIPT-RECREATION-BASE-COMPLETE.sql`** - Script principal de recréation
2. **`NETTOYAGE-FICHIERS-AUDIT.md`** - Guide de nettoyage des fichiers
3. **`scripts/nettoyage-audit.sh`** - Script automatique de nettoyage
4. **`GUIDE-RECREATION-BASE-COMPLETE.md`** - Ce guide

## 🧹 ÉTAPE 1 : NETTOYAGE DES FICHIERS D'AUDIT

### Option A : Nettoyage automatique (Recommandé)
```bash
# Exécuter le script de nettoyage automatique
./scripts/nettoyage-audit.sh
```

### Option B : Nettoyage manuel
```bash
# Supprimer les fichiers obsolètes
rm CREATION-TABLE-AUDIT-DOCUMENTS.sql
rm GUIDE-PREVENTION-FICHIERS-ORPHELINS.md

# Corriger les fichiers avec références
sed -i '' '/trigger_audit_document/d' resolution-fichiers-manquants-final.sql
sed -i '' '/audit_document/d' resolution-fichiers-manquants-final.sql
sed -i '' '/trigger_audit_document/d' nettoyage-manuel-final-alternatif.sql
sed -i '' '/audit_document/d' nettoyage-manuel-final-alternatif.sql
sed -i '' '/document_audit_logs/d' CONFIGURATION-PERMISSIONS-PARTAGE.sql
```

## 🗄️ ÉTAPE 2 : RECRÉATION DE LA BASE DE DONNÉES

### 2.1 Aller sur Supabase
1. **Ouvrez** : https://supabase.com/dashboard
2. **Connectez-vous** à votre compte
3. **Sélectionnez** votre projet : `eiawccnqfmvdnvjlyftx`
4. **Cliquez** sur "SQL Editor" dans la barre latérale gauche

### 2.2 Exécuter le script de recréation
1. **Copiez** tout le contenu du fichier `SCRIPT-RECREATION-BASE-COMPLETE.sql`
2. **Collez** dans l'éditeur SQL de Supabase
3. **Cliquez** sur "Run" (ou Ctrl+Enter)
4. **Attendez** l'exécution complète (peut prendre 1-2 minutes)

### 2.3 Vérification du succès
Vous devriez voir ces messages de confirmation :
```
✅ Base de données Fiich recréée avec succès !
📋 Tables créées: users, companies, documents, invitations, company_shares
🔒 RLS activé avec politiques de sécurité
📁 Bucket storage "company-files" configuré
🚫 Table Document_audit_logs exclue comme demandé
🎯 Application prête à utiliser !
```

## 🏗️ STRUCTURE CRÉÉE

### Tables principales
- **`users`** - Extension de auth.users avec profil utilisateur
- **`companies`** - Entreprises créées par les utilisateurs
- **`documents`** - Documents uploadés par entreprise
- **`invitations`** - Invitations envoyées aux utilisateurs
- **`company_shares`** - Partages d'entreprises

### Fonctionnalités incluses
- ✅ **RLS (Row Level Security)** activé sur toutes les tables
- ✅ **Politiques de sécurité** appropriées
- ✅ **Bucket storage** "company-files" configuré
- ✅ **Index de performance** sur les colonnes importantes
- ✅ **Triggers** pour synchronisation automatique
- ✅ **Fonctions RPC** pour les invitations
- ✅ **Permissions** configurées

### Exclusions (comme demandé)
- ❌ **Table `Document_audit_logs`** - Supprimée
- ❌ **Fonctions d'audit** - Supprimées
- ❌ **Triggers d'audit** - Supprimés

## 🧪 ÉTAPE 3 : TEST DE L'APPLICATION

### 3.1 Redémarrer l'application
```bash
# Arrêter le serveur (Ctrl+C si en cours)
# Puis redémarrer
npm run dev
```

### 3.2 Tests à effectuer
1. **Inscription/Connexion** d'un nouvel utilisateur
2. **Création d'une entreprise**
3. **Upload d'un document**
4. **Envoi d'une invitation**
5. **Acceptation d'une invitation**
6. **Partage d'une entreprise**

### 3.3 Vérifications spécifiques
- ✅ Les utilisateurs peuvent se connecter
- ✅ Les entreprises peuvent être créées
- ✅ Les documents peuvent être uploadés
- ✅ Les invitations fonctionnent
- ✅ Les partages fonctionnent
- ✅ Pas d'erreurs liées à l'audit

## 🔧 ÉTAPE 4 : CONFIGURATION EMAIL (Optionnel)

Si vous voulez que les invitations par email fonctionnent :

### 4.1 Vérifier la configuration SMTP
Votre `.env.local` contient déjà :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=fahdbari94@gmail.com
SMTP_PASS=tvrm drbf qncp uwjb
FROM_EMAIL="Fiich <fahdbari94@gmail.com>"
```

### 4.2 Tester l'envoi d'invitation
1. Créez une entreprise
2. Envoyez une invitation à une adresse email
3. Vérifiez que l'email est reçu

## 🚨 DÉPANNAGE

### Problème : Erreur lors de l'exécution du script SQL
**Solution** : 
- Vérifiez que vous êtes connecté au bon projet Supabase
- Assurez-vous d'avoir les permissions d'administrateur
- Relancez le script en cas d'erreur temporaire

### Problème : Erreur "Bucket not found"
**Solution** :
- Le script crée automatiquement le bucket "company-files"
- Si l'erreur persiste, vérifiez les politiques storage dans Supabase

### Problème : Erreur RLS (Row Level Security)
**Solution** :
- Le script configure automatiquement toutes les politiques RLS
- Si l'erreur persiste, vérifiez que l'utilisateur est bien connecté

### Problème : Invitations ne fonctionnent pas
**Solution** :
- Vérifiez la configuration SMTP
- Testez avec une adresse email valide
- Vérifiez les logs de l'application

## 📊 VÉRIFICATION FINALE

Après la recréation, votre application devrait avoir :

### Base de données
- ✅ 5 tables principales créées
- ✅ RLS activé et configuré
- ✅ Index de performance
- ✅ Fonctions RPC pour invitations

### Storage
- ✅ Bucket "company-files" créé
- ✅ Politiques storage configurées
- ✅ Limite de taille : 50MB
- ✅ Types MIME autorisés

### Application
- ✅ Inscription/Connexion fonctionnelle
- ✅ Gestion des entreprises
- ✅ Upload de documents
- ✅ Système d'invitations
- ✅ Système de partage
- ✅ Pas d'erreurs liées à l'audit

## 🎉 FÉLICITATIONS !

Votre application Fiich est maintenant prête avec une base de données propre et fonctionnelle, sans les problèmes liés à la table d'audit.

### Prochaines étapes recommandées
1. **Tester** toutes les fonctionnalités
2. **Créer** quelques entreprises de test
3. **Uploader** des documents
4. **Inviter** des utilisateurs
5. **Partager** des entreprises

### Support
Si vous rencontrez des problèmes :
1. Vérifiez les logs de l'application
2. Consultez les logs Supabase
3. Testez avec des données simples
4. Vérifiez la configuration `.env.local`

**🚀 Bon développement avec Fiich !** 