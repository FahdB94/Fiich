# 🔍 Diagnostic de Cohérence Base de Données ↔ Application

## 📊 Tables de la Base de Données
Basé sur `mcp_supabase_list_tables`, voici les tables existantes :

1. **users** - Utilisateurs
2. **companies** - Entreprises
3. **company_members** - Membres d'entreprise
4. **company_shares** - Partages d'entreprise
5. **company_contacts** - Contacts d'entreprise
6. **documents** - Documents
7. **invitations** - Invitations
8. **notifications** - Notifications
9. **plans** - Plans d'abonnement
10. **company_subscriptions** - Abonnements d'entreprise

## 🎯 Types TypeScript Définis
Basé sur `src/lib/types.ts` :

### Tables Correspondantes ✅
- `users` ↔ `User`
- `companies` ↔ `Company`
- `company_contacts` ↔ `CompanyContact`
- `documents` ↔ `Document`
- `company_shares` ↔ `CompanyShare`
- `invitations` ↔ `Invitation`

### Tables Manquantes dans les Types ❌
- `company_members` - Pas de type correspondant
- `notifications` - Pas de type correspondant
- `plans` - Pas de type correspondant
- `company_subscriptions` - Pas de type correspondant

## 🔧 Composants et Hooks Analysés

### Hooks
- `useCompaniesWithRoles` ✅ - Utilise `companies` et `company_members`
- `useCompanies` ✅ - Utilise `companies`

### Composants
- `EnhancedDocumentManager` ✅ - Utilise `documents`
- `ShareCompany` ✅ - Utilise `company_shares`
- `Dashboard` ✅ - Utilise `documents`, `company_shares`, `invitations`

### API Routes
- `/api/companies/[id]` ✅ - Utilise `companies`
- `/api/invitations` ✅ - Utilise `invitations`

## 🚨 Incohérences Identifiées

### 1. Type `CompanyMembers` Manquant
**Problème** : La table `company_members` existe mais n'a pas de type TypeScript correspondant.
**Impact** : Le hook `useCompaniesWithRoles` utilise `any` pour typer les données.
**Solution** : Créer le type `CompanyMember`.

### 2. Types Manquants pour Nouvelles Tables
**Problème** : Tables `notifications`, `plans`, `company_subscriptions` sans types.
**Impact** : Impossible d'utiliser ces tables de manière typée.
**Solution** : Créer les types correspondants.

### 3. Relations Manquantes dans les Types
**Problème** : Les types ne reflètent pas toutes les relations entre tables.
**Impact** : Requêtes avec joins peuvent être mal typées.
**Solution** : Étendre les types avec les relations.

## 📋 Actions à Effectuer

### Phase 1 : Types Manquants
- [ ] Créer `CompanyMember` type
- [ ] Créer `Notification` type
- [ ] Créer `Plan` type
- [ ] Créer `CompanySubscription` type

### Phase 2 : Relations et Contraintes
- [ ] Étendre les types avec les relations
- [ ] Vérifier les contraintes de base de données
- [ ] Mettre à jour les validations

### Phase 3 : Composants et Hooks
- [ ] Vérifier l'utilisation des nouveaux types
- [ ] Mettre à jour les composants si nécessaire
- [ ] Tester la cohérence des données

### Phase 4 : Tests et Validation
- [ ] Tests de cohérence des types
- [ ] Validation des requêtes API
- [ ] Tests d'intégration

## 🔍 Prochaines Étapes
1. Créer les types manquants
2. Vérifier la structure exacte des tables
3. Mettre à jour les composants
4. Tester la cohérence globale
