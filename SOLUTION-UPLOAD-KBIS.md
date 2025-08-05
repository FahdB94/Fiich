# 🎯 SOLUTION COMPLÈTE - Erreur téléversement fichiers Kbis

## ❌ Problème identifié

L'erreur **"new row violates row-level security policy"** lors du téléversement de fichiers Kbis est causée par des **politiques RLS (Row Level Security) défaillantes** dans votre base de données Supabase.

## 🔍 Diagnostic

### Étape 1 : Vérifier le problème
```bash
cd /Users/fahdbari/fiich-app
node diagnostic-upload-files.js
```

Ce script va :
- ✅ Vérifier la configuration storage
- ✅ Tester l'insertion de documents
- ✅ Identifier précisément le problème RLS

## 🛠️ Solution en 3 étapes

### Étape 1 : Appliquer la correction SQL

1. **Ouvrez [supabase.com](https://supabase.com)**
2. **Connectez-vous** → Projet `jjibjvxdiqvuseaexivl`
3. **Onglet "SQL"** (barre latérale gauche)
4. **Copiez-collez** TOUT le contenu du fichier `correction-rls-automatique.sql`
5. **Cliquez "Run"** (bouton en bas à droite)
6. **Attendez** le message de succès

### Étape 2 : Vider le cache du navigateur

**Chrome/Edge :**
- `Cmd + Shift + R` (Mac)
- `Ctrl + Shift + R` (Windows)

**Firefox :**
- `Cmd + Shift + R` (Mac)
- `Ctrl + F5` (Windows)

### Étape 3 : Tester le téléversement

1. **Allez sur** http://localhost:3000
2. **Reconnectez-vous** à l'application
3. **Créez une entreprise** ou sélectionnez une existante
4. **Onglet "Documents"**
5. **Téléversez un fichier Kbis**
6. ✅ **Ça devrait marcher !**

## 🔧 Si le problème persiste

### Option A : Redémarrer l'application
```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### Option B : Vérifier les variables d'environnement
```bash
cat .env.local
```

Assurez-vous que vous avez :
```
NEXT_PUBLIC_SUPABASE_URL=https://jjibjvxdiqvuseaexivl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Option C : Diagnostic complet
```bash
node diagnostic-complet.js
```

## 📋 Ce que fait la correction

La correction SQL :

1. **Supprime** toutes les politiques RLS problématiques
2. **Recrée** des politiques simples et sûres
3. **Configure** le bucket storage `company-files`
4. **Ajoute** les politiques storage nécessaires
5. **Élimine** la récursion infinie

## 🎉 Résultat attendu

Après la correction, vous pourrez :
- ✅ Téléverser des fichiers Kbis sans erreur
- ✅ Téléverser des RIB, CGV, et autres documents
- ✅ Voir vos documents dans la liste
- ✅ Télécharger vos documents
- ✅ Supprimer vos documents

## 🚨 Important

- **Ne pas modifier** les politiques RLS manuellement
- **Utiliser** uniquement les scripts fournis
- **Toujours** vider le cache après modification SQL
- **Tester** sur un navigateur en mode privé si nécessaire

---

💡 **Note** : Cette erreur est courante avec Supabase quand les politiques RLS se référencent mutuellement. La correction élimine cette récursion et simplifie les politiques. 