# 🚨 SOLUTION RAPIDE - ERREUR 403 COMPANY_SHARES

## ⚡ PROBLÈME ACTUEL

**Erreur** : `Failed to load resource: the server responded with a status of 403 () (company_shares, line 0)`

**Cause** : Les politiques RLS (Row Level Security) empêchent l'accès à la table `company_shares`

## 🎯 SOLUTION IMMÉDIATE

### ÉTAPE 1 : Aller sur Supabase
1. **Ouvrez** : https://supabase.com/dashboard
2. **Sélectionnez** votre projet : `jjibjvxdiqvuseaexivl`
3. **Cliquez** sur "SQL Editor"

### ÉTAPE 2 : Appliquer le script de correction

**COPIEZ-COLLEZ** ce script dans l'éditeur SQL :

```sql
-- ========================================
-- CORRECTION RLS POUR TABLE COMPANY_SHARES
-- ========================================

-- 1. Désactiver temporairement RLS pour diagnostiquer
ALTER TABLE public.company_shares DISABLE ROW LEVEL SECURITY;

-- 2. Recréer les politiques RLS appropriées
ALTER TABLE public.company_shares ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion lors de l'acceptation d'invitation
DROP POLICY IF EXISTS "allow_insert_on_acceptance" ON public.company_shares;
CREATE POLICY "allow_insert_on_acceptance" ON public.company_shares
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Politique pour permettre la lecture des partages
DROP POLICY IF EXISTS "allow_read_shares" ON public.company_shares;
CREATE POLICY "allow_read_shares" ON public.company_shares
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
        OR
        company_shares.shared_with_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Politique pour permettre la mise à jour des partages
DROP POLICY IF EXISTS "allow_update_shares" ON public.company_shares;
CREATE POLICY "allow_update_shares" ON public.company_shares
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
    );

-- Politique pour permettre la suppression des partages
DROP POLICY IF EXISTS "allow_delete_shares" ON public.company_shares;
CREATE POLICY "allow_delete_shares" ON public.company_shares
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c 
            WHERE c.id = company_shares.company_id 
            AND c.user_id = auth.uid()
        )
    );

-- Message de confirmation
SELECT 
    '✅ Politiques RLS corrigées pour company_shares' as status,
    'Insertion, lecture, mise à jour et suppression autorisées' as message;
```

### ÉTAPE 3 : Cliquer sur "RUN"

### ÉTAPE 4 : Tester immédiatement
1. **Retournez sur** : http://localhost:3000
2. **Testez l'acceptation d'invitation** - devrait fonctionner
3. **Accédez à** `/invitations` - devrait charger sans erreur

## 🔧 EXPLICATION DES POLITIQUES

### 1. **INSERT** - `allow_insert_on_acceptance`
- Permet l'insertion si l'utilisateur est connecté
- Nécessaire pour l'acceptation d'invitation

### 2. **SELECT** - `allow_read_shares`
- Permet la lecture si :
  - L'utilisateur est propriétaire de l'entreprise
  - OU l'utilisateur est celui avec qui l'entreprise est partagée

### 3. **UPDATE** - `allow_update_shares`
- Permet la mise à jour si l'utilisateur est propriétaire

### 4. **DELETE** - `allow_delete_shares`
- Permet la suppression si l'utilisateur est propriétaire

## ✅ RÉSULTAT ATTENDU

- ✅ **Plus d'erreur 403**
- ✅ **Acceptation d'invitation fonctionnelle**
- ✅ **Page `/invitations` accessible**
- ✅ **Gestion des partages opérationnelle**

## 🚨 SI LE PROBLÈME PERSISTE

Si l'erreur 403 persiste après l'application du script :

1. **Vérifiez que** vous êtes bien connecté
2. **Videz le cache** du navigateur
3. **Rechargez la page**
4. **Vérifiez les logs** dans la console du navigateur

**Appliquez le script SQL maintenant !** 🚀 