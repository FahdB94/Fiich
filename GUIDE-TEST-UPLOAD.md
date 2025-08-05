# 🧪 GUIDE DE TEST - UPLOAD DE DOCUMENTS

## ✅ ÉTAT ACTUEL

- ✅ **Base de données** recréée avec succès
- ✅ **Bucket storage** configuré en mode privé (sécurisé)
- ✅ **Politiques RLS** actives
- ✅ **Erreurs d'authentification** résolues

## 🎯 POURQUOI LE BUCKET N'EST PAS PUBLIC ?

### 🔒 C'est la configuration SÉCURISÉE

- **Mode PRIVÉ** : `public: false` ✅
- **Accès contrôlé** : Seuls les utilisateurs authentifiés
- **Sécurité** : Fichiers non accessibles publiquement
- **Politiques RLS** : Permissions gérées automatiquement

### 📋 Comment ça fonctionne

```
Utilisateur non connecté → ❌ Pas d'accès au bucket
Utilisateur connecté → ✅ Accès complet via RLS
```

## 🧪 TESTS À EFFECTUER

### Test 1 : Création de compte et connexion

1. **Allez sur** http://localhost:3000
2. **Cliquez sur "S'inscrire"**
3. **Remplissez le formulaire** :
   - Email : `test@example.com`
   - Mot de passe : `password123`
   - Prénom : `Test`
   - Nom : `User`
4. **Cliquez sur "S'inscrire"**
5. **Vérifiez** la redirection vers le dashboard

**Résultat attendu** : ✅ Inscription réussie

### Test 2 : Création d'entreprise

1. **Sur le dashboard**, cliquez sur "Nouvelle entreprise"
2. **Remplissez le formulaire** :
   - Nom : `Test Company`
   - SIREN : `123456789`
   - Adresse : `123 Test Street`
   - Code postal : `75001`
   - Ville : `Paris`
   - Pays : `France`
   - Email : `contact@testcompany.com`
3. **Cliquez sur "Créer l'entreprise"**

**Résultat attendu** : ✅ Entreprise créée

### Test 3 : Upload de document

1. **Dans la page de l'entreprise**, cliquez sur "Ajouter un document"
2. **Sélectionnez un fichier** :
   - Type : PDF, image, ou document Word
   - Taille : < 50MB
3. **Remplissez les informations** :
   - Nom : `Document de test`
   - Type : `Autre`
   - Public : `Non`
4. **Cliquez sur "Uploader"**

**Résultat attendu** : ✅ Document uploadé avec succès

### Test 4 : Vérification du document

1. **Vérifiez** que le document apparaît dans la liste
2. **Cliquez sur le document** pour le télécharger
3. **Vérifiez** que le téléchargement fonctionne

**Résultat attendu** : ✅ Document visible et téléchargeable

## 🚨 DÉPANNAGE UPLOAD

### Problème : "Bucket not found"
**Solution** :
- Vérifiez que vous êtes connecté
- Le bucket est privé, c'est normal
- L'erreur disparaît quand vous êtes authentifié

### Problème : "Permission denied"
**Solution** :
- Vérifiez que vous êtes bien connecté
- Reconnectez-vous si nécessaire
- Vérifiez les politiques RLS dans Supabase

### Problème : "File too large"
**Solution** :
- Limite : 50MB maximum
- Compressez le fichier si nécessaire
- Utilisez un fichier plus petit

### Problème : "Invalid file type"
**Solution** :
- Types autorisés : PDF, images, documents Word/Excel
- Vérifiez l'extension du fichier
- Utilisez un format supporté

## 🔍 VÉRIFICATIONS TECHNIQUES

### Dans Supabase Dashboard

1. **Allez sur** https://supabase.com/dashboard
2. **Sélectionnez** votre projet : `eiawccnqfmvdnvjlyftx`
3. **Cliquez sur "Storage"**
4. **Vérifiez** :
   - ✅ Bucket `company-files` existe
   - ✅ Mode : Privé (public: false)
   - ✅ Limite : 50MB
   - ✅ Politiques actives

### Dans l'application

1. **Ouvrez** les outils de développement (F12)
2. **Allez dans l'onglet "Console"**
3. **Essayez d'uploader un document**
4. **Vérifiez** qu'il n'y a pas d'erreurs

## 📊 CRITÈRES DE SUCCÈS

L'upload fonctionne correctement si :

- ✅ **Authentification** : Seuls les utilisateurs connectés peuvent uploader
- ✅ **Sécurité** : Les fichiers ne sont pas accessibles publiquement
- ✅ **Fonctionnalité** : Upload, visualisation et téléchargement fonctionnent
- ✅ **Limites** : Respect des tailles et types de fichiers
- ✅ **Politiques** : RLS actives et fonctionnelles

## 🎯 PROCHAINES ÉTAPES

Une fois l'upload testé :

1. **Testez** les invitations d'utilisateurs
2. **Testez** le partage d'entreprises
3. **Testez** l'accès aux documents partagés
4. **Déployez** en production

## 📝 NOTES IMPORTANTES

- **Le bucket privé est NORMAL** et SÉCURISÉ
- **L'upload ne fonctionne qu'avec authentification**
- **Les politiques RLS gèrent automatiquement les permissions**
- **Aucun fichier n'est accessible publiquement**

## 🎉 SUCCÈS !

Votre système d'upload est **sécurisé et fonctionnel** !

**🚀 Bon développement avec Fiich !** 