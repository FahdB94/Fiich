# Guide de Résolution - Colonnes Documents Manquantes

## Problème Identifié

L'erreur `Could not find the 'document_reference' column of 'documents' in the schema cache` indique que certaines colonnes sont manquantes dans la table `documents`.

## Solution

### 1. Script SQL à Exécuter

Exécute ce script dans **Supabase SQL Editor** :

```sql
-- AJOUT COLONNES DOCUMENTS MANQUANTES
-- Ajoute toutes les colonnes manquantes à la table documents

-- Colonne display_name
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Colonne document_reference
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_reference TEXT;

-- Colonne document_version
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_version TEXT;

-- Colonne document_type (si elle n'existe pas déjà)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'autre';

-- Contrainte pour document_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_document_type'
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT check_document_type
        CHECK (document_type IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'));
    END IF;
END $$;

-- Mise à jour des documents existants
UPDATE documents
SET display_name = name
WHERE display_name IS NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_display_name ON documents(display_name);
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(document_reference);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
```

### 2. Vérification

Après l'exécution, vérifiez que toutes les colonnes sont présentes :

```sql
-- Vérification de la structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

## Colonnes Ajoutées

| Colonne | Type | Description |
|---------|------|-------------|
| `display_name` | TEXT | Nom d'affichage personnalisé |
| `document_reference` | TEXT | Référence du document |
| `document_version` | TEXT | Version du document |
| `document_type` | VARCHAR(50) | Type de document (rib, kbis, etc.) |

## Impact

- ✅ Résout l'erreur PGRST204
- ✅ Permet le renommage des documents
- ✅ Permet l'ajout de métadonnées (référence, version)
- ✅ Améliore les performances avec les index

## Après l'Exécution

1. Rechargez la page de l'application
2. Testez l'ajout d'un nouveau document
3. Testez le renommage d'un document existant
4. Testez le changement de statut public/privé

## Notes

- Les colonnes existantes ne sont pas affectées
- Les documents existants gardent leurs données
- Le script est idempotent (peut être exécuté plusieurs fois) 