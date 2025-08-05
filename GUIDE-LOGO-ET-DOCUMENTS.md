# 🎨 Guide - Logo et Documents pour Entreprises

## ✨ Nouvelles Fonctionnalités

### 1. **Upload de Logo d'Entreprise**
- **Ajout de logo** lors de la création d'une entreprise
- **Modification de logo** lors de l'édition d'une entreprise
- **Affichage moderne** sur toutes les cartes d'entreprise
- **Prévisualisation** avant upload
- **Validation** : Images uniquement, max 5MB

### 2. **Documents en Mode Édition**
- **Ajout de documents** maintenant possible lors de la modification d'une entreprise
- **Même fonctionnalité** que lors de la création
- **Upload automatique** après sauvegarde des modifications

## 🚀 Installation

### 1. **Base de Données**
Exécutez ce script dans **Supabase Dashboard > SQL Editor** :

```sql
-- Script pour ajouter la colonne logo_url à la table companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

### 2. **Fonctionnalités Disponibles**

#### **Création d'Entreprise** (`/companies/new`)
- ✅ Upload de logo avec prévisualisation
- ✅ Sélection de type de document
- ✅ Upload de plusieurs documents
- ✅ Validation en temps réel

#### **Modification d'Entreprise** (`/companies/[id]/edit`)
- ✅ Modification du logo existant
- ✅ Suppression du logo
- ✅ Ajout de nouveaux documents
- ✅ Conservation des documents existants

#### **Affichage des Logos**
- ✅ **Page Dashboard** : Logos sur les cartes d'entreprises récentes
- ✅ **Page Companies** : Logos sur toutes les cartes d'entreprises
- ✅ **Page Détail** : Logo en grand format dans l'en-tête
- ✅ **Fallback** : Icône générique si pas de logo

## 🎯 Utilisation

### **Upload de Logo**
1. **Création** : Section "Logo de l'entreprise" dans le formulaire
2. **Modification** : Même section, avec prévisualisation du logo actuel
3. **Drag & Drop** : Glissez-déposez votre image
4. **Validation** : Format PNG, JPG, GIF, max 5MB
5. **Prévisualisation** : Voir le résultat avant sauvegarde

### **Documents en Édition**
1. **Accéder** à la page de modification d'entreprise
2. **Section Documents** : Même interface que la création
3. **Sélectionner** les types de documents
4. **Uploader** les fichiers
5. **Sauvegarder** : Les documents sont uploadés automatiquement

## 🎨 Design Moderne

### **Cartes d'Entreprise**
- **Logo** : 48x48px, bordure arrondie, effet hover
- **Fallback** : Icône Building avec fond bleu
- **Responsive** : Adaptation sur mobile et desktop

### **Page de Détail**
- **Logo** : 64x64px dans l'en-tête
- **Positionnement** : À gauche du nom d'entreprise
- **Ombre** : Effet de profondeur subtil

### **Formulaire**
- **Zone de drop** : Bordure pointillée, effet hover
- **Prévisualisation** : Image centrée avec bouton de suppression
- **Validation** : Messages d'erreur clairs

## 🔧 Configuration Technique

### **Stockage**
- **Bucket** : `company-files`
- **Dossier** : `logos/{company_id}/`
- **Nom** : `{timestamp}-{filename}`
- **URL publique** : Générée automatiquement

### **Types Supportés**
- **Images** : PNG, JPG, JPEG, GIF, WebP
- **Taille max** : 5MB
- **Validation** : Côté client et serveur

### **Sécurité**
- **Authentification** : Utilisateur connecté uniquement
- **Permissions** : RLS sur les entreprises
- **Validation** : Type MIME et taille

## 🐛 Résolution de Problèmes

### **Logo ne s'affiche pas**
1. Vérifiez que la colonne `logo_url` existe dans la base
2. Vérifiez les permissions du bucket `company-files`
3. Vérifiez que l'URL est accessible publiquement

### **Erreur d'upload**
1. Vérifiez la taille du fichier (max 5MB)
2. Vérifiez le format (images uniquement)
3. Vérifiez la connexion internet

### **Documents non uploadés**
1. Vérifiez que l'entreprise a été sauvegardée
2. Vérifiez les permissions du bucket
3. Vérifiez les logs d'erreur dans la console

## 📱 Responsive Design

### **Mobile**
- **Logo** : 40x40px sur les cartes
- **Formulaire** : Zone de drop adaptée
- **Prévisualisation** : Taille réduite

### **Desktop**
- **Logo** : 48x48px sur les cartes, 64x64px en détail
- **Formulaire** : Zone de drop complète
- **Prévisualisation** : Taille normale

## 🎉 Résultat Final

Vos entreprises ont maintenant :
- ✅ **Logo personnalisé** sur toutes les cartes
- ✅ **Documents** ajoutables en création ET modification
- ✅ **Design moderne** et cohérent
- ✅ **Expérience utilisateur** améliorée
- ✅ **Interface intuitive** et responsive

---

**Note** : Les logos et documents sont stockés de manière sécurisée dans Supabase Storage et liés à chaque entreprise individuellement. 