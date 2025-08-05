# 🏢 GUIDE - FORMULAIRE ENTREPRISE ÉTENDU

## ✅ FONCTIONNALITÉS AJOUTÉES

Le formulaire de création d'entreprise a été considérablement enrichi avec de nouvelles sections pour une fiche d'identité complète :

### 📋 **Nouvelles sections ajoutées :**

1. **Informations légales et financières**
2. **Conditions de paiement**
3. **Contacts multiples**

---

## 🏛️ INFORMATIONS LÉGALES ET FINANCIÈRES

### **Code APE (Activité Principale Exercée)**
- **Format** : 4 chiffres + 1 lettre (ex: `6201A`)
- **Validation** : Format automatique vérifié
- **Exemples** : `6201A` (Programmation informatique), `7021Z` (Conseil en relations publiques)

### **TVA intracommunautaire**
- **Format** : Code pays + numéro (ex: `FR12345678901`)
- **Validation** : Format européen vérifié
- **Exemples** : `FR12345678901`, `DE123456789`, `IT12345678901`

### **RIB (Relevé d'Identité Bancaire)**
- **Format** : Format français standard
- **Validation** : Structure bancaire vérifiée
- **Exemple** : `FR76 1234 5678 9012 3456 7890 123`

---

## 💳 CONDITIONS DE PAIEMENT

### **Interface intuitive :**
- **Zone de saisie** : Tapez vos conditions personnalisées
- **Suggestions rapides** : Cliquez sur les suggestions prédéfinies
- **Liste dynamique** : Ajoutez/supprimez des conditions
- **Validation** : Pas de doublons, format libre

### **Suggestions disponibles :**
- Paiement comptant
- Paiement à 30 jours
- Paiement à 45 jours
- Paiement à 60 jours
- Paiement à réception

### **Utilisation :**
1. Cliquez sur une suggestion pour l'ajouter
2. Ou tapez votre condition personnalisée
3. Appuyez sur Entrée ou cliquez sur "+"
4. Supprimez avec le "X" sur chaque badge

---

## 👥 CONTACTS MULTIPLES

### **Types de contacts disponibles :**
- **Commercial** : Contacts commerciaux
- **Comptable** : Contacts comptables/financiers
- **Technique** : Contacts techniques/IT
- **Administratif** : Contacts administratifs
- **Direction** : Contacts de direction
- **Autre** : Autres types de contacts

### **Informations par contact :**
- **Type** : Catégorie du contact (obligatoire)
- **Nom** : Nom complet (obligatoire)
- **Email** : Adresse email (optionnel)
- **Téléphone** : Numéro de téléphone (optionnel)
- **Poste** : Fonction dans l'entreprise (optionnel)
- **Notes** : Informations supplémentaires (optionnel)

### **Interface :**
- **Ajout** : Bouton "Ajouter un contact"
- **Formulaire** : Interface intuitive avec validation
- **Affichage** : Cartes avec icônes et badges
- **Suppression** : Bouton "X" sur chaque carte
- **Édition** : Suppression + réajout (pour simplifier)

---

## 🗄️ BASE DE DONNÉES

### **Nouvelles colonnes dans `companies` :**
```sql
ape_code VARCHAR(5)           -- Code APE
vat_number VARCHAR(25)        -- TVA intracommunautaire
payment_terms TEXT[]          -- Conditions de paiement
rib VARCHAR(50)              -- RIB
```

### **Nouvelle table `company_contacts` :**
```sql
id UUID PRIMARY KEY
company_id UUID REFERENCES companies(id)
contact_type VARCHAR(50)      -- Type de contact
name VARCHAR(100)            -- Nom
email VARCHAR(255)           -- Email
phone VARCHAR(20)            -- Téléphone
position VARCHAR(100)        -- Poste
notes TEXT                   -- Notes
created_at TIMESTAMP
updated_at TIMESTAMP
```

### **Sécurité :**
- **RLS activé** : Chaque utilisateur ne voit que ses contacts
- **Index** : Performance optimisée
- **Contraintes** : Validation des formats
- **Triggers** : Mise à jour automatique des timestamps

---

## 🧪 TESTS À EFFECTUER

### **Test 1 : Informations légales**
1. Allez sur http://localhost:3000/companies/new
2. Remplissez les informations générales
3. Dans "Informations légales et financières" :
   - Code APE : `6201A` ✅
   - TVA : `FR12345678901` ✅
   - RIB : `FR76 1234 5678 9012 3456 7890 123` ✅
4. Vérifiez qu'aucune erreur de validation n'apparaît

### **Test 2 : Conditions de paiement**
1. Dans la section "Conditions de paiement" :
   - Cliquez sur "Paiement comptant" → Badge ajouté
   - Cliquez sur "Paiement à 30 jours" → Badge ajouté
   - Tapez "Paiement à 45 jours fin de mois" → Badge ajouté
   - Supprimez un badge avec le "X"
2. Vérifiez que la liste se met à jour

### **Test 3 : Contacts**
1. Dans la section "Contacts" :
   - Cliquez sur "Ajouter un contact"
   - Type : "Commercial"
   - Nom : "Jean Dupont"
   - Email : "jean.dupont@entreprise.com"
   - Téléphone : "01 23 45 67 89"
   - Poste : "Directeur commercial"
   - Notes : "Contact principal pour les ventes"
   - Cliquez sur "Ajouter le contact"
2. Vérifiez que la carte apparaît
3. Ajoutez un second contact (type "Comptable")
4. Supprimez un contact avec le "X"

### **Test 4 : Validation des erreurs**
1. Testez des formats invalides :
   - Code APE : `1234` (manque la lettre) → Erreur
   - TVA : `FR123` (trop court) → Erreur
   - RIB : `123456789` (format invalide) → Erreur
2. Vérifiez que les messages d'erreur s'affichent

### **Test 5 : Création complète**
1. Remplissez toutes les sections
2. Ajoutez 2-3 conditions de paiement
3. Ajoutez 2-3 contacts différents
4. Créez l'entreprise
5. Vérifiez le message de succès
6. Vérifiez la redirection vers `/companies`

---

## 🔧 INSTALLATION

### **1. Exécuter le script SQL :**
```sql
-- Copiez le contenu de AJOUT-COLONNES-ENTREPRISE-ETENDUE.sql
-- et exécutez-le dans l'éditeur SQL de Supabase
```

### **2. Vérifier l'application :**
```bash
npm run dev
# Allez sur http://localhost:3000/companies/new
```

### **3. Tester les fonctionnalités :**
- Vérifiez que toutes les sections s'affichent
- Testez l'ajout de conditions de paiement
- Testez l'ajout de contacts
- Vérifiez les validations

---

## 🎯 FONCTIONNALITÉS AVANCÉES

### **Validation côté client :**
- Formats vérifiés en temps réel
- Messages d'erreur contextuels
- Prévention des doublons

### **Validation côté serveur :**
- Contraintes SQL pour les formats
- RLS pour la sécurité
- Triggers pour la cohérence

### **Interface utilisateur :**
- Design cohérent avec l'existant
- Responsive sur mobile
- Accessibilité respectée
- Feedback visuel immédiat

### **Performance :**
- Index sur les colonnes clés
- Requêtes optimisées
- Pagination pour les contacts (si nécessaire)

---

## 🐛 DÉPANNAGE

### **Erreur : "Format APE invalide"**
- **Cause** : Format incorrect
- **Solution** : Utilisez 4 chiffres + 1 lettre (ex: `6201A`)

### **Erreur : "Format TVA invalide"**
- **Cause** : Format incorrect
- **Solution** : Utilisez le format européen (ex: `FR12345678901`)

### **Erreur : "Format RIB invalide"**
- **Cause** : Format incorrect
- **Solution** : Utilisez le format français standard

### **Contacts ne s'affichent pas**
- **Cause** : Script SQL non exécuté
- **Solution** : Exécutez le script dans Supabase

### **Validation ne fonctionne pas**
- **Cause** : Types TypeScript non mis à jour
- **Solution** : Redémarrez le serveur de développement

---

## 🎉 RÉSULTAT FINAL

Votre formulaire d'entreprise dispose maintenant de :

✅ **Informations légales complètes** (APE, TVA, RIB)
✅ **Conditions de paiement flexibles** (liste dynamique)
✅ **Contacts multiples** (types personnalisables)
✅ **Validation robuste** (client + serveur)
✅ **Interface intuitive** (suggestions, badges, cartes)
✅ **Sécurité renforcée** (RLS, contraintes)
✅ **Performance optimisée** (index, requêtes)

**Le formulaire est maintenant prêt pour une utilisation professionnelle ! 🚀** 