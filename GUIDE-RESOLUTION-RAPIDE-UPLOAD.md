# 🚀 GUIDE RÉSOLUTION RAPIDE UPLOAD

## ❌ Erreur corrigée

L'erreur `UNION types boolean and name cannot be matched` a été corrigée.

## ✅ Solution en 3 étapes

### **Étape 1 : Exécuter le script SQL**

Copiez et exécutez le contenu de `CORRECTION-UPLOAD-SIMPLE.sql` dans l'éditeur SQL de Supabase.

### **Étape 2 : Configurer le bucket (CHOIX A ou B)**

#### **CHOIX A : Bucket public temporaire (PLUS SIMPLE)**

1. **Dashboard Supabase > Storage**
2. **Sélectionnez "company-files"**
3. **Cliquez sur "Settings"**
4. **Activez "Public bucket"**
5. **Sauvegardez**

#### **CHOIX B : Politiques de storage**

1. **Dashboard Supabase > Storage**
2. **Sélectionnez "company-files"**
3. **Cliquez sur "Policies"**
4. **Ajoutez ces 4 politiques :**

```
INSERT: (auth.role() = 'authenticated')
SELECT: (auth.role() = 'authenticated')
UPDATE: (auth.role() = 'authenticated')
DELETE: (auth.role() = 'authenticated')
```

### **Étape 3 : Tester l'upload**

```bash
node scripts/test-upload-simple.js
```

## 🧪 Test dans l'application

1. **Allez sur** http://localhost:3001/companies/new
2. **Remplissez** le formulaire d'entreprise
3. **Dans "Documents"**, uploadez un fichier
4. **Vérifiez** qu'il n'y a plus d'erreur

## 📋 Checklist

- [ ] Script SQL exécuté ✅
- [ ] Bucket configuré (public ou politiques) ✅
- [ ] Test script fonctionne ✅
- [ ] Upload dans l'app fonctionne ✅

## 🎯 Résultat attendu

✅ **Upload de fichiers** sans erreur
✅ **Progrès en temps réel**
✅ **Création d'entreprise** avec documents
✅ **Fichiers visibles** dans Supabase Storage

## 🔒 Sécurité après les tests

Une fois que tout fonctionne :

1. **Remettez le bucket en privé** (si vous l'avez mis en public)
2. **Configurez des politiques plus restrictives**
3. **Activez RLS sur la table documents**

**L'upload devrait maintenant fonctionner parfaitement ! 🎉** 