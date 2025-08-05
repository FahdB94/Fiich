# Guide de Résolution - Contrainte Document Type

## Problème Identifié

L'erreur `new row for relation "documents" violates check constraint "check_document_type"` indique que l'application essaie d'insérer une valeur `document_type` qui n'est pas autorisée par la contrainte.

## Valeurs Autorisées

La contrainte `check_document_type` n'autorise que ces valeurs :
- `'rib'`
- `'kbis'`
- `'contrat'`
- `'facture'`
- `'devis'`
- `'autre'`

## Solution

### 1. Script SQL de Correction

Exécute ce script dans **Supabase SQL Editor** :

```sql
-- CORRECTION DOCUMENT TYPE
-- Corrige les valeurs document_type invalides dans les documents existants

-- Mettre à jour les documents avec des valeurs NULL ou vides
UPDATE documents
SET document_type = 'autre'
WHERE document_type IS NULL OR document_type = '';

-- Mettre à jour les documents avec des valeurs non autorisées
UPDATE documents
SET document_type = 'autre'
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre');

-- Vérifier les valeurs actuelles
SELECT 
    document_type,
    COUNT(*) as count
FROM documents
GROUP BY document_type
ORDER BY count DESC;
```

### 2. Correction dans l'Application

J'ai corrigé le code pour utiliser `'autre'` comme valeur par défaut au lieu de `null` :

```typescript
// Avant (problématique)
document_type: documentType || null,

// Après (corrigé)
document_type: documentType || 'autre',
```

## Vérification

Après l'exécution du script, vérifiez qu'il n'y a plus de valeurs invalides :

```sql
-- Vérifier qu'il n'y a plus de valeurs invalides
SELECT 
    id,
    name,
    document_type
FROM documents
WHERE document_type NOT IN ('rib', 'kbis', 'contrat', 'facture', 'devis', 'autre');
```

Cette requête doit retourner 0 lignes.

## Impact

- ✅ Résout l'erreur de contrainte
- ✅ Permet l'ajout de nouveaux documents
- ✅ Corrige les documents existants avec des valeurs invalides
- ✅ Utilise 'autre' comme valeur par défaut sécurisée

## Après la Correction

1. **Rechargez** la page de l'application
2. **Testez** l'ajout d'un nouveau document
3. **Vérifiez** que les documents existants s'affichent correctement

## Notes

- Le script est sécurisé et ne supprime aucune donnée
- Toutes les valeurs invalides sont converties en 'autre'
- L'application utilise maintenant une valeur par défaut valide 