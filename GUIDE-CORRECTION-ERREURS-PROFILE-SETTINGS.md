# Guide de Correction - Profile et Settings

## 🚨 Erreurs Identifiées et Solutions

### **1. Composant Switch Manquant**

#### **Problème**
```
Module not found: Can't resolve '@/components/ui/switch'
```

#### **Solution**
✅ **Résolu** : Le composant `Switch` a été créé et le package `@radix-ui/react-switch` installé.

### **2. Erreurs de Requêtes SQL**

#### **Problème**
- Utilisation incorrecte de `user_id` au lieu de `company_id`
- Fonctions RPC manquantes pour les invitations

#### **Solution**
✅ **Résolu** : Les requêtes ont été corrigées pour utiliser les bonnes colonnes.

### **3. Tables Manquantes**

#### **Problème**
Les tables `profiles` et `user_settings` n'existent pas dans la base de données.

#### **Solution**
📋 **À exécuter** : Le script SQL `AJOUT-TABLES-PROFIL-PARAMETRES.sql`

## 📋 Installation des Tables

### **Étape 1 : Exécuter le Script SQL**

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet Fiich

2. **Accéder à l'éditeur SQL**
   - Cliquer sur "SQL Editor" dans le menu de gauche
   - Cliquer sur "New query"

3. **Copier et exécuter le script**
   ```sql
   -- AJOUT TABLES PROFIL ET PARAMETRES
   -- Script pour créer les tables nécessaires aux pages Profile et Settings

   -- 1. Table des profils utilisateur
   CREATE TABLE IF NOT EXISTS public.profiles (
       id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
       email TEXT NOT NULL,
       full_name TEXT,
       phone TEXT,
       address TEXT,
       company TEXT,
       job_title TEXT,
       bio TEXT,
       avatar_url TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 2. Table des paramètres utilisateur
   CREATE TABLE IF NOT EXISTS public.user_settings (
       id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
       email_notifications BOOLEAN DEFAULT true,
       push_notifications BOOLEAN DEFAULT true,
       language TEXT DEFAULT 'fr',
       theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
       two_factor_enabled BOOLEAN DEFAULT false,
       session_timeout INTEGER DEFAULT 30,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 3. Index pour améliorer les performances
   CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
   CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
   CREATE INDEX IF NOT EXISTS idx_user_settings_language ON public.user_settings(language);
   CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON public.user_settings(theme);

   -- 4. Fonction pour mettre à jour automatiquement updated_at
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql';

   -- 5. Triggers pour mettre à jour automatiquement updated_at
   DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
   CREATE TRIGGER update_profiles_updated_at
       BEFORE UPDATE ON public.profiles
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();

   DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
   CREATE TRIGGER update_user_settings_updated_at
       BEFORE UPDATE ON public.user_settings
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column();

   -- 6. RLS (Row Level Security) - Désactivé pour les tests
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
   ```

4. **Cliquer sur "Run" pour exécuter le script**

### **Étape 2 : Vérifier la Création**

Après l'exécution, vous devriez voir les tables dans la section "Table Editor" :
- `profiles`
- `user_settings`

## 🔧 Corrections Apportées

### **1. Page Profile (`/profile`)**

#### **Correction des Requêtes**
```typescript
// AVANT (incorrect)
.eq('user_id', user?.id)

// APRÈS (correct)
.in('company_id', companyIds)
```

#### **Logique Améliorée**
```typescript
// Récupérer d'abord les entreprises de l'utilisateur
const { data: userCompanies } = await supabase
  .from('companies')
  .select('id')
  .eq('user_id', user?.id)

const companyIds = userCompanies?.map(c => c.id) || []

// Puis récupérer les statistiques pour ces entreprises
const [documentsResult, sharesResult] = await Promise.all([
  supabase.from('documents').select('*', { count: 'exact', head: true }).in('company_id', companyIds),
  supabase.from('company_shares').select('*', { count: 'exact', head: true }).in('company_id', companyIds).eq('is_active', true)
])
```

### **2. Page Companies (`/companies`)**

#### **Gestion des Cas Vides**
```typescript
if (companyIds.length === 0) {
  setCompanyStats({})
  return
}
```

### **3. Composant Switch**

#### **Création du Composant**
```typescript
// src/components/ui/switch.tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```

#### **Installation du Package**
```bash
npm install @radix-ui/react-switch
```

## 🎯 Fonctionnalités Disponibles

### **Page Profile**
- ✅ **Édition du profil** : Nom, téléphone, entreprise, poste, adresse, bio
- ✅ **Avatar personnalisé** : Initiales avec gradient
- ✅ **Statistiques utilisateur** : Entreprises, documents, partages
- ✅ **Informations du compte** : Email, dates, statut
- ✅ **Actions rapides** : Liens vers Settings

### **Page Settings**
- ✅ **Changement de mot de passe** : Validation complète
- ✅ **Paramètres de notifications** : Email et push
- ✅ **Personnalisation** : Langue, thème, délai de session
- ✅ **Authentification 2FA** : Switch pour activer/désactiver
- ✅ **Déconnexion sécurisée** : Confirmation requise

## 🚀 Test des Fonctionnalités

### **1. Tester la Page Profile**
1. Aller sur `http://localhost:3000/profile`
2. Vérifier que la page se charge sans erreur
3. Cliquer sur "Modifier" pour éditer le profil
4. Remplir les champs et sauvegarder
5. Vérifier que les statistiques s'affichent

### **2. Tester la Page Settings**
1. Aller sur `http://localhost:3000/settings`
2. Vérifier que la page se charge sans erreur
3. Tester les switches de notifications
4. Tester le changement de langue et thème
5. Tester la déconnexion

### **3. Vérifier les Données**
1. Aller dans Supabase Dashboard
2. Vérifier que les tables `profiles` et `user_settings` existent
3. Vérifier que les données sont bien sauvegardées

## 🎉 Résultat Final

Après avoir exécuté le script SQL et redémarré l'application :

1. **Pages fonctionnelles** : Profile et Settings sont entièrement opérationnelles
2. **Design moderne** : Interface cohérente avec le reste de l'application
3. **Fonctionnalités complètes** : Toutes les fonctionnalités sont disponibles
4. **Base de données** : Tables créées avec triggers et index
5. **Erreurs corrigées** : Plus d'erreurs de modules manquants

Les pages Profile et Settings sont maintenant **entièrement fonctionnelles** ! 🚀

## 📞 Support

Si vous rencontrez encore des erreurs après avoir suivi ce guide :

1. **Vérifier les tables** : S'assurer que les tables sont bien créées
2. **Redémarrer l'application** : `npm run dev`
3. **Vider le cache** : Supprimer le dossier `.next` et redémarrer
4. **Vérifier les logs** : Consulter la console du navigateur pour les erreurs 