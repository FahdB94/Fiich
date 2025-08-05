# 🚨 RÉSOLUTION ERREUR COLONNE CONTACTS

## ❌ Problème identifié

**Erreur lors de la création d'entreprise :**
```
Could not find the 'contacts' column of 'companies' in the schema cache
```

## ✅ Solution rapide

### **Étape 1 : Exécuter le script SQL**

Copiez et exécutez ce script dans l'éditeur SQL de Supabase :

```sql
-- AJOUT COLONNE CONTACTS
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne contacts à la table companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;

-- 2. Ajouter un index sur contacts pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_contacts ON companies USING GIN (contacts);

-- 3. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN companies.contacts IS 'Contacts de l''entreprise au format JSONB';

-- 4. Vérifier la structure de la table companies
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN ('id', 'company_name', 'ape_code', 'vat_number', 'payment_terms', 'rib', 'contacts', 'created_at');

-- 5. Message de confirmation
SELECT 'Colonne contacts ajoutée avec succès!' as status;
```

### **Étape 2 : Vérifier l'exécution**

Vous devriez voir :
- ✅ **Colonne contacts ajoutée avec succès!**
- ✅ **Liste des colonnes** avec `contacts` présent

### **Étape 3 : Tester l'application**

1. **Allez sur** http://localhost:3001/companies/new
2. **Remplissez** le formulaire d'entreprise
3. **Ajoutez des contacts** dans la section "Contacts"
4. **Cliquez sur "Créer l'entreprise"**
5. **Vérifiez** qu'il n'y a plus d'erreur

## 🧪 Test automatique

Exécutez ce script pour vérifier :

```bash
node scripts/test-company-creation.js
```

**Résultat attendu :**
- ✅ Table companies accessible
- ✅ Entreprise créée avec succès
- ✅ Tous les champs fonctionnent

## 📋 Colonnes requises

La table `companies` doit avoir ces colonnes :

| Colonne | Type | Description |
|---------|------|-------------|
| `ape_code` | VARCHAR | Code APE |
| `vat_number` | VARCHAR | Numéro de TVA |
| `payment_terms` | TEXT[] | Conditions de paiement |
| `rib` | VARCHAR | RIB/IBAN |
| `contacts` | JSONB | Contacts de l'entreprise |

## 🎯 Résultat attendu

✅ **Création d'entreprise** sans erreur
✅ **Tous les champs** fonctionnent
✅ **Contacts sauvegardés** en JSONB
✅ **Application** complètement fonctionnelle

**L'erreur devrait maintenant être résolue ! 🚀** 