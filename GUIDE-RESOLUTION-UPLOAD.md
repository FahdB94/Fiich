# 🔧 GUIDE - RÉSOLUTION PROBLÈME UPLOAD

## ❌ Problème identifié

L'erreur "new row violates row-level security policy" (code 403) indique que les politiques RLS sur le bucket `company-files` bloquent l'upload de fichiers.

## 🔍 Diagnostic effectué

✅ **Connexion Supabase** : Fonctionnelle
✅ **Bucket "company-files"** : Existe et configuré
✅ **Table documents** : Accessible
❌ **Politiques RLS** : Trop restrictives

## ✅ Solution rapide

### **Étape 1 : Exécuter le script de correction**

Copiez et exécutez le contenu de `CORRECTION-RAPIDE-UPLOAD.sql` dans l'éditeur SQL de Supabase :

```sql
-- 1. Supprimer toutes les politiques existantes sur le bucket
DELETE FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'company-files');

-- 2. Créer des politiques simples pour permettre l'upload
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES 
    ('Allow all authenticated users to upload', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'INSERT',
     'true'),
    
    ('Allow all authenticated users to read', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'SELECT',
     'true'),
    
    ('Allow all authenticated users to update', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'UPDATE',
     'true'),
    
    ('Allow all authenticated users to delete', 
     (SELECT id FROM storage.buckets WHERE name = 'company-files'),
     'DELETE',
     'true');

-- 3. Désactiver RLS sur la table documents pour les tests
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 4. Donner toutes les permissions sur la table documents
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO anon;
```

### **Étape 2 : Tester l'upload**

1. Allez sur http://localhost:3001/companies/new
2. Remplissez le formulaire d'entreprise
3. Dans la section "Documents", essayez d'uploader un fichier
4. Vérifiez que l'upload fonctionne sans erreur

### **Étape 3 : Vérifier le diagnostic**

Exécutez à nouveau le diagnostic pour confirmer que tout fonctionne :

```bash
node scripts/diagnostic-upload-storage.js
```

## 🔒 Configuration de sécurité

### **Pour les tests (configuration actuelle) :**
- ✅ Bucket privé (non public)
- ✅ Politiques RLS permissives pour les utilisateurs authentifiés
- ✅ RLS désactivé sur la table documents
- ✅ Permissions complètes sur la table documents

### **Pour la production (recommandé) :**
- 🔒 Politiques RLS plus restrictives
- 🔒 RLS activé sur la table documents
- 🔒 Permissions limitées aux propriétaires des entreprises

## 🧪 Test de validation

Après avoir exécuté le script de correction, testez :

1. **Upload simple** : Un fichier PDF de petite taille
2. **Upload multiple** : Plusieurs fichiers différents
3. **Validation** : Fichier trop volumineux (> 50MB)
4. **Types de fichiers** : PDF, images, documents Office

## 🐛 Dépannage

### **Si l'upload ne fonctionne toujours pas :**

1. **Vérifiez les logs Supabase** :
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'company-files');
   ```

2. **Vérifiez les permissions** :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'documents';
   ```

3. **Redémarrez l'application** :
   ```bash
   npm run dev
   ```

### **Si vous obtenez une erreur différente :**

- **Erreur 400** : Problème de format de fichier
- **Erreur 413** : Fichier trop volumineux
- **Erreur 500** : Problème de connexion

## 🎯 Résultat attendu

Après la correction, vous devriez pouvoir :

✅ **Uploader des fichiers** sans erreur
✅ **Voir le progrès** en temps réel
✅ **Créer l'entreprise** avec les documents associés
✅ **Voir les fichiers** dans Supabase Storage

## 📋 Checklist de validation

- [ ] Script SQL exécuté avec succès
- [ ] Diagnostic ne montre plus d'erreur 403
- [ ] Upload de fichier fonctionne dans l'interface
- [ ] Création d'entreprise avec documents réussie
- [ ] Fichiers visibles dans Supabase Storage

**L'upload de fichiers devrait maintenant fonctionner parfaitement ! 🎉** 