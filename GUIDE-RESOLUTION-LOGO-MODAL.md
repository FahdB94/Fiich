# 🔧 Guide de Résolution - Logo et Modal

## 🚨 Problèmes Identifiés

### 1. **Logo ne s'affiche pas**
### 2. **Modal de succès n'apparaît pas**

## 🔍 Diagnostic et Solutions

### **Étape 1: Vérifier la Base de Données**

#### **1.1 Exécuter le Script SQL**
Dans **Supabase Dashboard > SQL Editor**, exécutez :

```sql
-- Script pour ajouter la colonne logo_url à la table companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND table_schema = 'public' 
AND column_name = 'logo_url';
```

#### **1.2 Vérifier les Permissions**
Assurez-vous que les politiques RLS permettent la mise à jour :

```sql
-- Vérifier les politiques sur la table companies
SELECT * FROM pg_policies WHERE tablename = 'companies';
```

### **Étape 2: Vérifier le Storage**

#### **2.1 Bucket company-files**
1. Aller dans **Supabase Dashboard > Storage**
2. Vérifier que le bucket `company-files` existe
3. Si non, le créer avec les permissions publiques

#### **2.2 Politiques de Storage**
Dans **Storage > Policies**, ajouter :

```sql
-- Politique pour permettre l'upload de logos
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-files' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'logos'
);

-- Politique pour permettre la lecture publique des logos
CREATE POLICY "Allow public read access to logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'company-files' AND 
  (storage.foldername(name))[1] = 'logos'
);
```

### **Étape 3: Vérifier les Logs**

#### **3.1 Console du Navigateur**
1. Ouvrir **F12 > Console**
2. Modifier une entreprise
3. Vérifier les logs :
   - `📤 Upload du logo:` - Confirme l'upload
   - `✅ Logo uploadé avec succès:` - Confirme le succès
   - `🎉 Succès - Affichage du modal:` - Confirme le modal
   - `🎯 SuccessModal render:` - Confirme le rendu du modal

#### **3.2 Logs d'Erreur**
Rechercher :
- `❌ Erreur upload logo:` - Problème d'upload
- `❌ Erreur chargement logo:` - Problème d'affichage

### **Étape 4: Tests Manuels**

#### **4.1 Test d'Upload de Logo**
1. Aller sur `/companies/new`
2. Remplir le formulaire
3. Sélectionner un logo (image < 5MB)
4. Sauvegarder
5. Vérifier dans la console les logs

#### **4.2 Test de Modification**
1. Aller sur `/companies/[id]/edit`
2. Modifier le logo
3. Sauvegarder
4. Vérifier l'affichage du modal

#### **4.3 Test d'Affichage**
1. Aller sur `/companies`
2. Vérifier que les logos s'affichent sur les cartes
3. Aller sur `/companies/[id]`
4. Vérifier que le logo s'affiche dans l'en-tête

## 🛠️ Solutions Spécifiques

### **Problème: Logo ne s'affiche pas**

#### **Cause 1: Colonne manquante**
```sql
-- Solution
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

#### **Cause 2: URL invalide**
- Vérifier que l'URL commence par `https://`
- Vérifier que l'URL est accessible publiquement
- Tester l'URL dans un nouvel onglet

#### **Cause 3: Permissions de lecture**
```sql
-- Solution
CREATE POLICY "Allow public read access to logos" ON storage.objects
FOR SELECT USING (bucket_id = 'company-files');
```

### **Problème: Modal ne s'affiche pas**

#### **Cause 1: Import manquant**
Vérifier dans `company-form.tsx` :
```typescript
import { SuccessModal } from '@/components/ui/success-modal'
```

#### **Cause 2: État non mis à jour**
Vérifier les logs :
- `setShowSuccessModal(true)` est appelé
- `SuccessModal render` apparaît dans la console

#### **Cause 3: CSS/Overlay**
Vérifier que le modal n'est pas caché par :
- `z-index` trop bas
- `position: fixed` non supportée
- Overlay transparent

## 🔧 Script de Diagnostic

Exécuter le script de diagnostic :

```bash
# Avec les variables d'environnement
NEXT_PUBLIC_SUPABASE_URL=votre_url NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle node scripts/diagnostic-logo-modal.js
```

## 📋 Checklist de Vérification

### **Base de Données**
- [ ] Colonne `logo_url` existe dans `companies`
- [ ] Politiques RLS configurées
- [ ] Permissions de mise à jour activées

### **Storage**
- [ ] Bucket `company-files` existe
- [ ] Dossier `logos/` accessible
- [ ] Politiques d'upload configurées
- [ ] Politiques de lecture publiques

### **Application**
- [ ] Composant `SuccessModal` importé
- [ ] Logs de débogage activés
- [ ] Console du navigateur ouverte
- [ ] Pas d'erreurs JavaScript

### **Test**
- [ ] Upload de logo fonctionne
- [ ] Modal de succès s'affiche
- [ ] Logos s'affichent sur les cartes
- [ ] Redirection après fermeture du modal

## 🚀 Résolution Rapide

### **Si rien ne fonctionne :**

1. **Réinitialiser la base** :
```sql
-- Supprimer et recréer la colonne
ALTER TABLE public.companies DROP COLUMN IF EXISTS logo_url;
ALTER TABLE public.companies ADD COLUMN logo_url TEXT;
```

2. **Recréer le bucket** :
   - Supprimer le bucket `company-files`
   - Le recréer avec permissions publiques
   - Reconfigurer les politiques

3. **Redémarrer l'application** :
```bash
npm run dev
```

4. **Vider le cache** :
   - Ctrl+F5 (hard refresh)
   - Vider le localStorage
   - Redémarrer le navigateur

---

**Note** : Si les problèmes persistent, vérifiez les logs dans la console du navigateur et partagez les erreurs spécifiques. 