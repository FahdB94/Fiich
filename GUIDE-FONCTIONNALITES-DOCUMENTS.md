# Guide des Fonctionnalités Documents

## Nouvelles Fonctionnalités Ajoutées

### 1. Renommage des Documents

**Comment ça marche :**
- Cliquez sur le nom du document pour le renommer
- Un champ de saisie apparaît avec le nom actuel
- Tapez le nouveau nom et appuyez sur Entrée ou cliquez sur ✓
- Appuyez sur Échap ou cliquez sur ✕ pour annuler

**Avantages :**
- Noms personnalisés plus lisibles
- Conservation du nom de fichier original
- Interface intuitive

### 2. Changement de Statut Public/Privé

**Comment ça marche :**
- Cliquez sur le badge "Public" ou "Privé" à côté du nom
- Le statut change instantanément
- Couleur verte pour "Public", orange pour "Privé"

**Impact sur le Partage :**
- **Documents Publics** : Visibles par tous les partenaires avec accès à l'entreprise
- **Documents Privés** : Visibles uniquement par les membres de l'entreprise

### 3. Script SQL Requis

Exécutez ce script dans Supabase SQL Editor :

```sql
-- AJOUT COLONNE DISPLAY_NAME
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Copie le nom existant dans display_name pour les anciens documents
UPDATE documents
SET display_name = name
WHERE display_name IS NULL;

-- Ajoute un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_display_name ON documents(display_name);
```

## Utilisation

### Renommer un Document
1. Allez sur la page de l'entreprise
2. Section "Documents"
3. Cliquez sur le nom du document
4. Tapez le nouveau nom
5. Appuyez sur Entrée

### Changer le Statut
1. Cliquez sur le badge "Public" ou "Privé"
2. Le changement est automatique
3. Un message de confirmation apparaît

## Impact sur le Partage

### Documents Publics
- ✅ Visibles par les partenaires partagés
- ✅ Téléchargeables (si autorisé)
- ✅ Apparaissent dans les listes de documents partagés

### Documents Privés
- ❌ Masqués aux partenaires
- ❌ Non téléchargeables
- ❌ N'apparaissent pas dans les partages

## Notes Techniques

- Le `display_name` est stocké séparément du nom de fichier original
- Le statut `is_public` contrôle la visibilité
- Les changements sont immédiats et persistants
- Interface responsive (fonctionne sur mobile et desktop) 