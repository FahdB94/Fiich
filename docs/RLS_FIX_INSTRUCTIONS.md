# Correction des problèmes RLS - Invitations

## Problème identifié

L'API `/api/share-company` retourne une erreur `500 Internal Server Error` avec le message `permission denied for table users` lors de la création d'invitations, malgré les migrations RLS précédentes.

## Cause du problème

La politique RLS `invitations_cud_admin` utilise `auth.uid()` qui ne fonctionne pas correctement dans le contexte de l'API avec l'authentification par token utilisateur.

## Solution

### 1. Appliquer la migration complète

Exécutez la migration `0020_complete_invitations_fix.sql` dans le tableau de bord Supabase :

```sql
-- Dans le SQL Editor de Supabase
-- Copier et coller le contenu de supabase/migrations/0020_complete_invitations_fix.sql
```

### 2. Vérifier l'application des politiques

Après la migration, vérifiez dans le tableau de bord Supabase :

- **Table `public.invitations`** → **RLS** doit être activé
- **Politiques** → Vérifiez que les politiques suivantes existent :
  - `invitations_owner_access`
  - `invitations_admin_access` 
  - `invitations_recipient_view`
  - `invitations_function_based`

### 3. Tester les permissions

Utilisez l'endpoint de debug pour vérifier que tout fonctionne :

```bash
GET /api/share-company/debug
```

### 4. Vérifier la structure de la table

Assurez-vous que la table `invitations` contient toutes les colonnes nécessaires :

- `id` (uuid, primary key)
- `company_id` (uuid, foreign key vers companies)
- `invited_email` (text)
- `invited_by` (uuid, foreign key vers auth.users)
- `invitation_token` (text)
- `role_requested` (text)
- `first_name` (text, nullable)
- `last_name` (text, nullable)
- `department` (text, nullable)
- `expires_at` (timestamp with time zone)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

## Politiques RLS appliquées

### `invitations_owner_access`
- **Accès** : Propriétaire de l'entreprise
- **Permissions** : Toutes (SELECT, INSERT, UPDATE, DELETE)
- **Condition** : L'utilisateur doit être le propriétaire de l'entreprise

### `invitations_admin_access`
- **Accès** : Membres ADMIN de l'entreprise
- **Permissions** : Toutes (SELECT, INSERT, UPDATE, DELETE)
- **Condition** : L'utilisateur doit être membre ADMIN avec statut ACTIVE

### `invitations_recipient_view`
- **Accès** : Destinataire de l'invitation
- **Permissions** : SELECT uniquement
- **Condition** : L'email de l'utilisateur doit correspondre à `invited_email`

### `invitations_function_based`
- **Accès** : Basé sur la fonction `can_manage_invitations`
- **Permissions** : Toutes
- **Condition** : Utilise la logique combinée des politiques ci-dessus

## Fonctions helper créées

### `is_company_owner(p_company_id uuid)`
Retourne `true` si l'utilisateur actuel est le propriétaire de l'entreprise.

### `can_manage_invitations(p_company_id uuid)`
Retourne `true` si l'utilisateur peut gérer les invitations (propriétaire ou ADMIN).

## Vérification post-migration

1. **Test de l'API** : Essayez de créer une invitation via l'interface
2. **Logs** : Vérifiez que l'erreur `permission denied` n'apparaît plus
3. **Politiques** : Confirmez que toutes les politiques sont actives
4. **Permissions** : Vérifiez que les utilisateurs authentifiés ont accès à la table

## En cas de problème persistant

Si l'erreur persiste après la migration :

1. Vérifiez les logs Supabase pour des erreurs RLS détaillées
2. Utilisez l'endpoint de debug pour diagnostiquer
3. Vérifiez que l'utilisateur est bien dans `company_members` avec le bon rôle
4. Confirmez que la table `invitations` a la bonne structure

## Rollback

En cas de problème, vous pouvez revenir à l'état précédent :

```sql
-- Supprimer les nouvelles politiques
drop policy if exists invitations_owner_access on public.invitations;
drop policy if exists invitations_admin_access on public.invitations;
drop policy if exists invitations_recipient_view on public.invitations;
drop policy if exists invitations_function_based on public.invitations;

-- Réappliquer l'ancienne politique
create policy invitations_cud_admin on public.invitations
  for all using (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  ) with check (
    exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id and cm.user_id = auth.uid() and cm.role in ('OWNER','ADMIN')
    )
  );
```
