# 🔧 Résolution : Permission denied for table users

## 🚨 Problème Identifié

L'erreur `permission denied for table users` lors du chargement des documents est causée par des politiques RLS (Row Level Security) dans Supabase qui tentent d'accéder directement à `auth.users` au lieu d'utiliser `public.users`.

## ⚡ Solution Rapide

### Option 1: Script Automatique (Recommandé)
```bash
npm run fix:permissions
```

### Option 2: Correction Manuelle via Supabase
1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez et exécutez le contenu du fichier `CORRECTION-PERMISSIONS-RLS.sql`

## 🔍 Détails Techniques

### Politiques Problématiques
Les politiques suivantes utilisaient `auth.users` directement :
- `users_can_view_shared_documents`
- `users_can_view_invitations_received` 
- `users_can_view_shares_for_them`
- `users_can_update_invitations`

### Correction Appliquée
Remplacement de :
```sql
(SELECT email FROM auth.users WHERE id = auth.uid())
```

Par :
```sql
EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.email = condition
)
```

## ✅ Vérification

Après avoir appliqué la correction :

1. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

2. **Testez l'accès aux documents** :
   - Allez sur `http://localhost:3000/companies/[id]`
   - Cliquez sur l'onglet "Documents"
   - L'erreur de permissions devrait être résolue

3. **Vérifiez les logs** :
   - Ouvrez la console du navigateur (F12)
   - Il ne devrait plus y avoir d'erreurs liées aux permissions

## 🛠️ Si le Problème Persiste

1. **Vérifiez la synchronisation des utilisateurs** :
   ```bash
   npm run test:setup
   ```

2. **Consultez les logs Supabase** :
   - Dashboard Supabase → Logs → API
   - Recherchez les erreurs de permissions récentes

3. **Réexécutez le script SQL complet** :
   - Exécutez `SOLUTION-COMPLETE-DEFINITIVE.sql` dans Supabase
   - Puis appliquez `CORRECTION-PERMISSIONS-RLS.sql`

## 📋 Scripts Utiles

```bash
npm run fix:permissions    # Corriger les permissions RLS
npm run test:setup        # Tester la configuration complète
npm run dev              # Redémarrer l'application
```

## 🎯 Résultat Attendu

Après correction, vous devriez pouvoir :
- ✅ Accéder à l'onglet "Documents" sans erreur
- ✅ Voir la liste des documents de l'entreprise
- ✅ Uploader de nouveaux documents
- ✅ Modifier et supprimer des documents existants

---

**💡 Cette correction fait partie de l'optimisation continue de l'application Fiich pour garantir une expérience utilisateur parfaite.**