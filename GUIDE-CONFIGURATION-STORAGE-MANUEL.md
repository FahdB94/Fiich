# 🔧 GUIDE - CONFIGURATION MANUELLE STORAGE

## ❌ Problème identifié

La table `storage.policies` n'existe pas dans votre version de Supabase. Les politiques de storage doivent être configurées via l'interface web.

## ✅ Solution en 2 étapes

### **Étape 1 : Exécuter le script SQL**

Copiez et exécutez le contenu de `CORRECTION-UPLOAD-SUPABASE.sql` dans l'éditeur SQL de Supabase.

### **Étape 2 : Configurer les politiques via l'interface**

1. **Allez dans le Dashboard Supabase**
2. **Cliquez sur "Storage"** dans le menu de gauche
3. **Sélectionnez le bucket "company-files"**
4. **Cliquez sur "Policies"** (onglet en haut)

#### **Configuration des politiques :**

**Politique 1 - INSERT (Upload) :**
- **Nom** : `Allow authenticated users to upload`
- **Opération** : `INSERT`
- **Définition** : `(auth.role() = 'authenticated')`

**Politique 2 - SELECT (Lecture) :**
- **Nom** : `Allow authenticated users to read`
- **Opération** : `SELECT`
- **Définition** : `(auth.role() = 'authenticated')`

**Politique 3 - UPDATE (Modification) :**
- **Nom** : `Allow authenticated users to update`
- **Opération** : `UPDATE`
- **Définition** : `(auth.role() = 'authenticated')`

**Politique 4 - DELETE (Suppression) :**
- **Nom** : `Allow authenticated users to delete`
- **Opération** : `DELETE`
- **Définition** : `(auth.role() = 'authenticated')`

## 🔧 Configuration alternative (si les politiques ne fonctionnent pas)

### **Option 1 : Bucket public temporaire**

1. Dans le Dashboard Supabase > Storage
2. Sélectionnez le bucket "company-files"
3. Cliquez sur "Settings"
4. Activez "Public bucket" temporairement
5. Testez l'upload
6. Remettez en privé après les tests

### **Option 2 : Désactiver RLS sur le bucket**

1. Dans le Dashboard Supabase > Storage
2. Sélectionnez le bucket "company-files"
3. Cliquez sur "Settings"
4. Désactivez "Row Level Security" temporairement
5. Testez l'upload

## 🧪 Test après configuration

### **1. Test via le diagnostic :**
```bash
node scripts/diagnostic-upload-storage.js
```

### **2. Test via l'interface :**
1. Allez sur http://localhost:3001/companies/new
2. Remplissez le formulaire
3. Essayez d'uploader un fichier
4. Vérifiez qu'il n'y a plus d'erreur

## 📋 Checklist de validation

- [ ] Script SQL exécuté avec succès
- [ ] Politiques de storage configurées (ou bucket public temporaire)
- [ ] RLS désactivé sur la table documents
- [ ] Diagnostic ne montre plus d'erreur 403
- [ ] Upload fonctionne dans l'interface
- [ ] Création d'entreprise avec documents réussie

## 🐛 Dépannage

### **Si l'upload ne fonctionne toujours pas :**

1. **Vérifiez les politiques dans l'interface :**
   - Dashboard > Storage > company-files > Policies

2. **Vérifiez les logs d'erreur :**
   - Dashboard > Logs > Storage

3. **Testez avec un bucket public temporaire :**
   - Plus simple pour les tests

4. **Vérifiez l'authentification :**
   - Assurez-vous d'être connecté dans l'app

## 🎯 Résultat attendu

Après la configuration, vous devriez pouvoir :

✅ **Uploader des fichiers** sans erreur 403
✅ **Voir le progrès** en temps réel
✅ **Créer l'entreprise** avec les documents
✅ **Voir les fichiers** dans Supabase Storage

## 🔒 Sécurité pour la production

Une fois que tout fonctionne, pour la production :

1. **Remettez le bucket en privé**
2. **Activez RLS sur la table documents**
3. **Configurez des politiques plus restrictives**
4. **Limitez les permissions aux propriétaires**

**L'upload devrait maintenant fonctionner ! 🎉** 