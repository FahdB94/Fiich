# Guide de Résolution - Erreur "relation user_companies does not exist"

## 🚨 **Problème identifié**

### **Erreur rencontrée :**
```sql
ERROR: 42P01: relation "user_companies" does not exist
```

### **Cause :**
La table `user_companies` (et les autres tables du système de partage) n'existent pas dans votre base de données Supabase.

## 🔧 **Solution étape par étape**

### **Étape 1: Créer les tables manquantes**

1. **Ouvrir Supabase Dashboard**
   - Aller sur [supabase.com](https://supabase.com)
   - Se connecter à votre compte
   - Sélectionner votre projet

2. **Accéder à l'éditeur SQL**
   - Cliquer sur **SQL Editor** dans le menu de gauche
   - Cliquer sur **New Query**

3. **Exécuter le script de création des tables**
   - Copier-coller le contenu du fichier `CREATION-TABLES-PARTAGE.sql`
   - Cliquer sur **Run** pour exécuter le script

### **Étape 2: Vérifier la création des tables**

Après l'exécution du script, vérifiez que les tables suivantes ont été créées :

```sql
-- Vérifier l'existence des tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_companies', 'company_shares', 'invitations', 'document_access_logs');
```

### **Étape 3: Tester le système**

Exécuter le script de test pour vérifier que tout fonctionne :

```bash
cd /Users/fahdbari/fiich-app
node test-systeme-partage.js
```

### **Étape 4: Configurer les permissions**

Une fois les tables créées, exécuter le script de configuration des permissions :

```sql
-- Copier-coller le contenu de CONFIGURATION-PERMISSIONS-PARTAGE.sql
-- Exécuter dans Supabase SQL Editor
```

## 📋 **Tables créées par le script**

### **1. user_companies**
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

### **2. company_shares**
```sql
CREATE TABLE company_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shared_with_email TEXT NOT NULL,
    shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '{"view": true, "download": true, "upload": false, "delete": false}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, shared_with_email)
);
```

### **3. invitations**
```sql
CREATE TABLE invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, email)
);
```

### **4. document_access_logs**
```sql
CREATE TABLE document_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    access_type TEXT NOT NULL,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    access_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 **Fonctions créées**

### **1. can_access_document(document_id UUID)**
Vérifie si l'utilisateur actuel peut accéder à un document spécifique.

### **2. get_accessible_documents()**
Retourne tous les documents accessibles à l'utilisateur actuel.

### **3. generate_invitation_token()**
Génère un token sécurisé pour les invitations.

## 👁️ **Vues créées**

### **1. accessible_documents**
Vue qui combine les documents avec leur type d'accès (public, company_member, shared, invited).

## 🧪 **Tests de validation**

### **Test 1: Vérification des tables**
```sql
-- Vérifier que toutes les tables existent
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('user_companies', 'company_shares', 'invitations', 'document_access_logs')
        THEN '✅ Créée'
        ELSE '❌ Manquante'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_companies', 'company_shares', 'invitations', 'document_access_logs');
```

### **Test 2: Vérification des fonctions**
```sql
-- Tester la fonction can_access_document
SELECT can_access_document('document-id-here');

-- Tester la fonction get_accessible_documents
SELECT * FROM get_accessible_documents();
```

### **Test 3: Vérification de la vue**
```sql
-- Tester la vue accessible_documents
SELECT * FROM accessible_documents LIMIT 5;
```

## 🚀 **Prochaines étapes**

### **Après la création des tables :**

1. **Configurer les politiques RLS**
   - Exécuter `CONFIGURATION-PERMISSIONS-PARTAGE.sql`

2. **Configurer le bucket storage**
   - Aller dans Storage > Policies
   - Ajouter les politiques pour l'accès public

3. **Tester le partage**
   - Tester l'accès anonyme aux documents
   - Valider les URLs de partage

4. **Implémenter l'interface**
   - Ajouter les composants de partage
   - Gérer les invitations

## 📝 **Instructions détaillées**

### **Pour exécuter le script :**

1. **Ouvrir Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/[votre-projet-id]
   ```

2. **Aller dans SQL Editor**
   ```
   Menu gauche > SQL Editor > New Query
   ```

3. **Copier-coller le script**
   ```sql
   -- Contenu de CREATION-TABLES-PARTAGE.sql
   ```

4. **Exécuter le script**
   ```
   Cliquer sur "Run" ou Ctrl+Enter
   ```

5. **Vérifier les résultats**
   ```
   Vérifier qu'il n'y a pas d'erreurs dans la console
   ```

### **En cas d'erreur :**

1. **Vérifier les permissions**
   - S'assurer d'avoir les droits d'administration sur le projet

2. **Vérifier les dépendances**
   - S'assurer que les tables `companies` et `documents` existent

3. **Vérifier les contraintes**
   - S'assurer qu'il n'y a pas de conflits de noms

## 🎯 **Résultat attendu**

Après l'exécution du script, vous devriez avoir :

- ✅ **4 nouvelles tables** créées
- ✅ **3 fonctions** de gestion des permissions
- ✅ **1 vue** pour faciliter l'accès
- ✅ **Index optimisés** pour les performances
- ✅ **Triggers** pour la gestion automatique

---

**Date de résolution :** 1er août 2025  
**Problème :** ❌ Table user_companies manquante  
**Solution :** ✅ Création complète du système de partage 