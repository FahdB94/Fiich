# Solution : Erreur lors de la création d'entreprise

## 🔍 Problème identifié

L'erreur 500 lors de la création d'entreprise est causée par un problème de base de données :

1. **Utilisateur manquant dans `public.users`** : Quand un utilisateur s'inscrit, il est créé dans `auth.users` (table d'authentification Supabase) mais pas dans `public.users` (votre table applicative).

2. **Contrainte de clé étrangère** : La table `companies` référence `public.users(id)`, donc l'insertion échoue si l'utilisateur n'existe pas dans cette table.

3. **Trigger manquant** : Le trigger qui devrait automatiquement créer l'utilisateur dans `public.users` lors de l'inscription n'est pas actif.

## 🛠️ Solution

J'ai créé un script de correction : `fix-database-issues.sql`

### Étapes pour résoudre :

1. **Connectez-vous à votre projet Supabase** :
   - Allez sur [supabase.com](https://supabase.com)
   - Ouvrez votre projet : `jjibjvxdiqvuseaexivl`
   - Allez dans l'onglet "SQL"

2. **Exécutez le script de correction** :
   - Copiez le contenu du fichier `fix-database-issues.sql`
   - Collez-le dans l'éditeur SQL de Supabase
   - Cliquez sur "Run" pour exécuter

3. **Testez la création d'entreprise** :
   - Retournez sur votre application : http://localhost:3000/companies/new
   - Essayez de créer une entreprise
   - Ça devrait maintenant fonctionner ! ✅

## 🔧 Ce que fait le script de correction

1. **Crée le trigger manquant** : Synchronise automatiquement `auth.users` avec `public.users`
2. **Ajoute les utilisateurs existants** : Copie les utilisateurs déjà inscrits mais manquants
3. **Corrige les politiques RLS** : Évite les récursions infinies dans les requêtes

## 🚀 Après la correction

Une fois appliqué, le bouton "Créer l'entreprise" fonctionnera parfaitement et vous pourrez :
- Créer des entreprises sans erreur 500
- Voir vos entreprises dans la liste
- Partager vos fiches d'identité entreprise

---

💡 **Note importante** : Cette correction doit être appliquée une seule fois et résoudra définitivement le problème pour tous les utilisateurs futurs.