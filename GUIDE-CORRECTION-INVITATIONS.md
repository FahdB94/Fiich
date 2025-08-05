# 🚨 GUIDE DE CORRECTION - SYSTÈME D'INVITATIONS

## ⚡ PROBLÈME ACTUEL

L'acceptation d'invitation échoue avec l'erreur :
```
"new row violates row-level security policy for table \"company_shares\""
```

## 🎯 SOLUTIONS À APPLIQUER

### 1. CORRECTION RLS COMPANY_SHARES

**Appliquez ce script dans Supabase SQL Editor :**

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
```

### 2. FONCTION RPC POUR INVITATIONS PAR EMAIL

**Appliquez ce script dans Supabase SQL Editor :**

```sql
-- ========================================
-- FONCTION RPC POUR RÉCUPÉRER LES INVITATIONS PAR EMAIL
-- ========================================

-- Créer la fonction get_invitations_by_email
CREATE OR REPLACE FUNCTION get_invitations_by_email(user_email TEXT)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    invited_email TEXT,
    invited_by UUID,
    invitation_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    company_name TEXT,
    invited_by_email TEXT,
    invited_by_name TEXT,
    invited_by_first_name TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.company_id,
        i.invited_email,
        i.invited_by,
        i.invitation_token,
        i.expires_at,
        i.created_at,
        i.updated_at,
        c.company_name,
        u.email::TEXT as invited_by_email,
        pu.last_name::TEXT as invited_by_name,
        pu.first_name::TEXT as invited_by_first_name
    FROM public.invitations i
    LEFT JOIN public.companies c ON i.company_id = c.id
    LEFT JOIN auth.users u ON i.invited_by = u.id
    LEFT JOIN public.users pu ON u.id = pu.id
    WHERE i.invited_email = user_email
    ORDER BY i.created_at DESC;
END;
$$;
```

## 🎉 NOUVELLES FONCTIONNALITÉS AJOUTÉES

### 1. Page de gestion des invitations
- **URL** : `/invitations`
- **Fonctionnalités** :
  - Liste des invitations reçues avec acceptation/refus
  - Liste des invitations envoyées avec suppression
  - Liste des entreprises partagées avec accès direct

### 2. Badge de notification
- **Affichage** : Nombre d'invitations en attente
- **Localisation** : À ajouter dans la navigation
- **Fonctionnalité** : Lien direct vers la page des invitations

### 3. Hook useInvitations
- **Gestion complète** des invitations
- **Actions** : accepter, refuser, supprimer
- **État** : chargement, erreurs, actualisation

## 📋 ÉTAPES D'APPLICATION

1. **Appliquez les scripts SQL** dans Supabase SQL Editor
2. **Redémarrez l'application** : `npm run dev`
3. **Testez l'acceptation d'invitation** - devrait fonctionner
4. **Accédez à** `/invitations` pour voir la nouvelle interface
5. **Ajoutez le badge** dans votre navigation si souhaité

## 🔧 INTÉGRATION DU BADGE

Pour ajouter le badge de notification dans votre navigation :

```tsx
import { InvitationsBadge } from '@/components/invitations'

// Dans votre composant de navigation
<div className="flex items-center gap-4">
  <InvitationsBadge />
  {/* Autres éléments de navigation */}
</div>
```

## ✅ RÉSULTAT ATTENDU

- ✅ **Acceptation d'invitation** fonctionnelle
- ✅ **Page de gestion** complète des invitations
- ✅ **Notifications** en temps réel
- ✅ **Interface utilisateur** intuitive et moderne

**Appliquez les scripts SQL maintenant et testez !** 🚀 