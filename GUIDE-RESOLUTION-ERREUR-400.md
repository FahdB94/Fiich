# 🚨 RÉSOLUTION ERREUR 400 UPLOAD

## ❌ Problèmes identifiés

1. **Warning GoTrueClient** : ✅ **CORRIGÉ** - Instance Supabase multiple supprimée
2. **Erreur 400 PDF** : 🔧 **EN COURS** - Problème d'authentification bucket

## ✅ Corrections effectuées

### **1. Instance Supabase multiple**
- ✅ Supprimé `createClient` dans `use-document-upload.ts`
- ✅ Utilise maintenant l'instance singleton `@/lib/supabase`
- ✅ Warning GoTrueClient disparu

### **2. Tests MIME types**
- ✅ Tous les types MIME fonctionnent (PDF, DOCX, JPG, TXT)
- ✅ Le problème n'est pas les types de fichiers

## 🔧 Solution rapide

### **Étape 1 : Rendre le bucket public**

Copiez et exécutez dans Supabase SQL Editor :

```sql
UPDATE storage.buckets 
SET public = true 
WHERE name = 'company-files';
```

### **Étape 2 : Vérifier**

```sql
SELECT name, public FROM storage.buckets WHERE name = 'company-files';
```

### **Étape 3 : Tester l'application**

1. **Allez sur** http://localhost:3001/companies/new
2. **Créez un compte** ou connectez-vous
3. **Uploadez un PDF** dans la section Documents
4. **Vérifiez** qu'il n'y a plus d'erreur 400

## 🎯 Résultat attendu

✅ **Warning GoTrueClient** disparu
✅ **Upload PDF** sans erreur 400
✅ **Progrès en temps réel** visible
✅ **Documents sauvegardés** en base

## 🔒 Sécurité après les tests

Une fois que tout fonctionne :

1. **Remettez le bucket en privé** :
```sql
UPDATE storage.buckets SET public = false WHERE name = 'company-files';
```

2. **Configurez les politiques RLS** dans Supabase Dashboard :
   - Storage > company-files > Policies
   - Ajoutez : `(auth.role() = 'authenticated')`

## 📋 Checklist

- [ ] ✅ Instance Supabase corrigée
- [ ] 🔧 Bucket rendu public
- [ ] 🧪 Test upload PDF
- [ ] 🔒 Remise en privé (optionnel)

**L'erreur 400 devrait maintenant être résolue ! 🎉** 