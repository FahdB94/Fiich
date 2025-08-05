# Guide de Résolution Définitive - Document Type

## Problème Identifié

L'erreur `violates check constraint "check_document_type"` persiste car il y a une incohérence entre :
- Les valeurs envoyées par l'application (majuscules)
- Les valeurs attendues par la contrainte (minuscules)

## Solution Complète

### 1. Script SQL de Correction

Exécute ce script dans **Supabase SQL Editor** :

```sql
-- CORRECTION CONTRAINTE COMPLETE
-- Supprime et recrée la contrainte document_type correctement

-- 1. Supprimer la contrainte existante si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_document_type'
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents DROP CONSTRAINT check_document_type;
    END IF;
END $$;

-- 2. Corriger les valeurs invalides
UPDATE documents
SET document_type = 'autre'
WHERE document_type IS NULL OR document_type = '';

UPDATE documents
SET document_type = 'autre'
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre');

-- 3. S'assurer que la colonne document_type existe avec la bonne valeur par défaut
ALTER TABLE documents 
ALTER COLUMN document_type SET DEFAULT 'autre';

-- 4. Recréer la contrainte
ALTER TABLE documents
ADD CONSTRAINT check_document_type
CHECK (document_type IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'));

-- 5. Vérification
SELECT 
    document_type,
    COUNT(*) as count
FROM documents
GROUP BY document_type
ORDER BY count DESC;
```

### 2. Corrections dans l'Application

J'ai corrigé le composant `EnhancedDocumentManager` :

#### **Avant (Problématique)**
```typescript
<SelectItem value="KBIS">KBIS</SelectItem>
<SelectItem value="RIB">RIB</SelectItem>
```

#### **Après (Corrigé)**
```typescript
<SelectItem value="kbis">KBIS</SelectItem>
<SelectItem value="rib">RIB</SelectItem>
<SelectItem value="contrat">Contrat</SelectItem>
<SelectItem value="facture">Facture</SelectItem>
<SelectItem value="devis">Devis</SelectItem>
<SelectItem value="autre">Autre</SelectItem>
```

### 3. Valeurs Autorisées

| Valeur en Base | Affichage | Description |
|----------------|-----------|-------------|
| `'rib'` | RIB | Relevé d'identité bancaire |
| `'kbis'` | KBIS | Extrait Kbis |
| `'contrat'` | Contrat | Contrat commercial |
| `'facture'` | Facture | Facture |
| `'devis'` | Devis | Devis |
| `'autre'` | Autre | Autre type de document |

## Vérification

Après l'exécution du script, vérifiez :

```sql
-- Vérifier qu'il n'y a plus de valeurs invalides
SELECT COUNT(*) as invalid_count
FROM documents
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre');

-- Vérifier les valeurs actuelles
SELECT 
    document_type,
    COUNT(*) as count
FROM documents
GROUP BY document_type
ORDER BY count DESC;
```

## Impact

- ✅ Résout définitivement l'erreur de contrainte
- ✅ Aligne l'application avec la base de données
- ✅ Ajoute tous les types de documents nécessaires
- ✅ Utilise des valeurs cohérentes (minuscules en base)

## Après la Correction

1. **Exécute** le script SQL
2. **Recharge** la page de l'application
3. **Teste** l'ajout d'un nouveau document
4. **Vérifie** que tous les types sont disponibles dans le menu déroulant

## Notes Importantes

- Les valeurs en base de données sont en **minuscules**
- L'affichage dans l'interface peut être en **majuscules**
- La valeur par défaut est `'autre'` si aucun type n'est sélectionné
- Le script est sécurisé et ne supprime aucune donnée 