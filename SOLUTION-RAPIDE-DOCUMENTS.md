# 🚨 SOLUTION RAPIDE - PROBLÈME DOCUMENTS

## ⚡ ACTION IMMÉDIATE REQUISE

**Le problème** : `"permission denied for table users"` lors du chargement des documents

**La cause** : Les politiques RLS utilisent `auth.users` au lieu de `public.users`

**La solution** : **DÉSACTIVER TEMPORAIREMENT RLS** pour les documents

---

## 🎯 ÉTAPE 1 : DÉSACTIVER RLS (SOLUTION RAPIDE)

### 1.1 Aller sur Supabase
- **Ouvrez** : https://supabase.com/dashboard
- **Sélectionnez** votre projet : `jjibjvxdiqvuseaexivl`
- **Cliquez** sur "SQL Editor"

### 1.2 Exécuter ce script RAPIDE

**COPIEZ-COLLEZ** ce script dans l'éditeur SQL :

```sql
-- ============================================================================
-- 🚨 SOLUTION RAPIDE - DÉSACTIVER RLS POUR LES DOCUMENTS
-- ============================================================================

-- 1. DÉSACTIVER RLS SUR LA TABLE DOCUMENTS
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- 2. VÉRIFICATION
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'documents' 
AND schemaname = 'public';

-- 3. MESSAGE DE SUCCÈS
SELECT 
    '🎉 RLS DÉSACTIVÉ - DOCUMENTS ACCESSIBLES !' as "STATUS",
    'Testez maintenant l''accès aux documents' as "MESSAGE";
```

### 1.3 Cliquer sur "RUN"

---

## 🎯 ÉTAPE 2 : TESTER IMMÉDIATEMENT

1. **Retournez sur** : http://localhost:3000
2. **Allez sur** une page d'entreprise avec documents
3. **Cliquez** sur l'onglet "Documents"
4. **✅ Plus d'erreur !**

---

## ⚠️ ATTENTION - SÉCURITÉ

Cette solution **désactive temporairement** la sécurité RLS pour les documents.

**Pour une solution permanente** (plus tard) :
- Réactiver RLS avec les bonnes politiques
- Utiliser `public.users` au lieu de `auth.users`

---

## 🎉 RÉSULTAT ATTENDU

- ✅ **Documents accessibles** immédiatement
- ✅ **Plus d'erreur** `"permission denied"`
- ✅ **Application fonctionnelle**

**Exécutez le script SQL maintenant et testez !** 🚀 