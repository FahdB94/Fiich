# 🚀 RÉSOLUTION - Erreur "Entreprise non trouvée" API share-company

## ❌ Problème identifié

L'erreur "Entreprise non trouvée ou vous n'avez pas les droits pour la partager" vient de l'API `/api/share-company` qui n'arrive pas à trouver l'entreprise ou à vérifier les permissions.

## 🔧 Solution en 3 étapes

### Étape 1 : Appliquer le script SQL complet

1. **Allez dans Supabase** → SQL Editor
2. **Copiez-collez** le contenu de `NETTOYAGE-AGGRESSIF.sql`
3. **Cliquez "Run"** pour nettoyer
4. **Copiez-collez** le contenu de `SCRIPT-COMPLET-ANTICIPATION-ERREURS.sql`
5. **Cliquez "Run"** pour appliquer

### Étape 2 : Tester l'API

1. **Démarrez l'application** : `npm run dev`
2. **Connectez-vous** dans l'application
3. **Créez une entreprise** ou sélectionnez une existante
4. **Testez le diagnostic** :
   ```bash
   node test-api-share.js
   ```

### Étape 3 : Vérifier la configuration

1. **Vérifiez .env.local** :
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre_email@gmail.com
   SMTP_PASS=votre_mot_de_passe_app
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## 🔍 Diagnostic détaillé

### Si le test échoue :

1. **Vérifiez la session** :
   - Êtes-vous connecté ?
   - Le token est-il valide ?

2. **Vérifiez les entreprises** :
   - Avez-vous créé des entreprises ?
   - L'ID de l'entreprise est-il correct ?

3. **Vérifiez les politiques RLS** :
   - Les politiques sont-elles créées ?
   - L'utilisateur a-t-il les droits ?

### Si l'API répond mais l'email n'arrive pas :

1. **Vérifiez SMTP** :
   - Configuration correcte ?
   - Mot de passe d'application Gmail ?

2. **Vérifiez les spams** :
   - L'email est-il dans les spams ?

## 🎯 Résultat attendu

Après ces étapes, vous devriez pouvoir :
- ✅ Envoyer des invitations par email
- ✅ Voir les messages de succès
- ✅ Recevoir les emails d'invitation
- ✅ Gérer les invitations dans le tableau de bord

## 🚨 Points importants

- **L'API utilise maintenant `createServiceClient()`** pour contourner les problèmes RLS
- **Le script SQL corrige toutes les politiques** de permissions
- **Le diagnostic identifie précisément** le problème

---

💡 **Note** : Si le problème persiste après ces étapes, le diagnostic `test-api-share.js` vous donnera des informations précises sur la cause. 