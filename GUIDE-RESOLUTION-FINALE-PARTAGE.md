# Guide de Résolution Finale - Système de Partage

## 🚨 **Problèmes identifiés et résolus**

### **1. Erreur initiale :**
```sql
ERROR: 42P01: relation "user_companies" does not exist
```

### **2. Erreur secondaire :**
```sql
ERROR: 42703: column "email" does not exist
```

### **3. Diagnostic réalisé :**
- ✅ **Colonne `email` existe** dans `auth.users`
- ❌ **Table `user_companies` manquante**
- ✅ **Tables `company_shares` et `invitations` existent**
- ❌ **Accès direct à `auth.users` impossible** via `supabase.from()`

## 🔧 **Solution finale**

### **Script corrigé :** `CREATION-TABLES-PARTAGE-CORRIGE.sql`

#### **Principales corrections :**

1. **Fonction `get_current_user_email()`** pour récupérer l'email de manière sécurisée
2. **Suppression des références directes** à `auth.users` dans les requêtes SQL
3. **Utilisation de `auth.uid()`** pour l'identification de l'utilisateur
4. **Politiques RLS corrigées** avec les bonnes fonctions

## 📋 **Instructions d'exécution**

### **Étape 1: Exécuter le script corrigé**

1. **Ouvrir Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/[votre-projet-id]
   ```

2. **Aller dans SQL Editor**
   ```
   Menu gauche > SQL Editor > New Query
   ```

3. **Copier-coller le script corrigé**
   ```sql
   -- Contenu de CREATION-TABLES-PARTAGE-CORRIGE.sql
   ```

4. **Exécuter le script**
   ```
   Cliquer sur "Run" ou Ctrl+Enter
   ```

### **Étape 2: Vérifier la création**

```sql
-- Vérifier que la table user_companies a été créée
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_companies';

-- Vérifier que les fonctions ont été créées
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_user_email', 'can_access_document', 'get_accessible_documents');

-- Vérifier que la vue a été créée
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'accessible_documents';
```

### **Étape 3: Tester les fonctions**

```sql
-- Test de la fonction get_current_user_email
SELECT get_current_user_email();

-- Test de la fonction can_access_document (remplacer par un vrai document_id)
SELECT can_access_document('document-id-here');

-- Test de la fonction get_accessible_documents
SELECT * FROM get_accessible_documents();

-- Test de la vue accessible_documents
SELECT * FROM accessible_documents LIMIT 5;
```

## 🛡️ **Fonctionnalités créées**

### **1. Table `user_companies`**
```sql
CREATE TABLE user_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);
```

### **2. Fonction `get_current_user_email()`**
```sql
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    RETURN user_email;
END;
$$;
```

### **3. Fonction `can_access_document(document_id UUID)`**
- Vérifie si l'utilisateur peut accéder à un document
- Gère les documents publics, partagés et privés
- Utilise l'email récupéré de manière sécurisée

### **4. Fonction `get_accessible_documents()`**
- Retourne tous les documents accessibles à l'utilisateur
- Inclut les documents publics, de l'entreprise et partagés

### **5. Vue `accessible_documents`**
- Combine les documents avec leur type d'accès
- Facilite l'affichage dans l'interface

### **6. Politiques RLS**
- **Documents publics** : accessibles à tous
- **Documents de l'entreprise** : accessibles aux membres
- **Documents partagés** : accessibles aux utilisateurs invités
- **Documents via invitations** : accessibles aux utilisateurs acceptés

## 🧪 **Tests de validation**

### **Test 1: Vérification des tables**
```sql
-- Vérifier toutes les tables nécessaires
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('user_companies', 'company_shares', 'invitations')
        THEN '✅ Créée'
        ELSE '❌ Manquante'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_companies', 'company_shares', 'invitations');
```

### **Test 2: Vérification des fonctions**
```sql
-- Tester get_current_user_email
SELECT get_current_user_email() as user_email;

-- Tester can_access_document (si vous avez un document)
SELECT can_access_document('votre-document-id') as can_access;

-- Tester get_accessible_documents
SELECT COUNT(*) as accessible_count FROM get_accessible_documents();
```

### **Test 3: Vérification de la vue**
```sql
-- Tester la vue accessible_documents
SELECT 
    name,
    access_type,
    company_name
FROM accessible_documents 
LIMIT 5;
```

## 🚀 **Prochaines étapes**

### **Après l'exécution du script :**

1. **Configurer le bucket storage**
   ```
   Supabase Dashboard > Storage > Policies
   Ajouter une politique pour l'accès public
   ```

2. **Tester l'accès anonyme**
   ```javascript
   // Dans votre application
   const { data, error } = await supabase.storage
     .from('company-files')
     .getPublicUrl('documents/public-doc.pdf')
   ```

3. **Implémenter l'interface de partage**
   - Ajouter les composants de partage
   - Gérer les invitations
   - Afficher les documents accessibles

4. **Monitoring et audit**
   - Surveiller les accès aux documents
   - Vérifier les performances
   - Optimiser si nécessaire

## 📝 **Utilisation dans l'application**

### **Vérifier l'accès à un document :**
```typescript
const { data: canAccess, error } = await supabase
  .rpc('can_access_document', { document_id: documentId })

if (canAccess) {
  // Accéder au document
} else {
  // Afficher une erreur d'accès
}
```

### **Lister les documents accessibles :**
```typescript
const { data: documents, error } = await supabase
  .rpc('get_accessible_documents')

// Ou utiliser la vue
const { data: accessibleDocs, error } = await supabase
  .from('accessible_documents')
  .select('*')
```

### **Créer une relation utilisateur-entreprise :**
```typescript
const { data, error } = await supabase
  .from('user_companies')
  .insert({
    user_id: userId,
    company_id: companyId,
    role: 'member'
  })
```

## 🎯 **Résultat attendu**

Après l'exécution du script corrigé :

- ✅ **Table `user_companies`** créée et fonctionnelle
- ✅ **Fonctions de permission** opérationnelles
- ✅ **Politiques RLS** configurées
- ✅ **Vue accessible_documents** disponible
- ✅ **Gestion sécurisée** des emails d'utilisateur
- ✅ **Système de partage** complet et robuste

---

**Date de résolution :** 1er août 2025  
**Problèmes :** ❌ Tables manquantes + Erreur colonne email  
**Solution :** ✅ Script corrigé avec gestion sécurisée des emails  
**Impact :** 🎉 Système de partage fonctionnel et sécurisé 