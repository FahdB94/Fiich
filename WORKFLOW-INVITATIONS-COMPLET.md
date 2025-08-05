# 🚀 WORKFLOW COMPLET - Système d'Invitations par Email

## 📋 Vue d'ensemble

Ce système permet d'inviter des entreprises à consulter vos fiches, que l'invité ait un compte ou non. Voici le workflow complet :

### 🔄 Workflow d'Invitation

1. **Vous invitez une entreprise** → Email envoyé automatiquement
2. **L'invité reçoit l'email** → Peut créer un compte ou se connecter
3. **L'invité voit l'invitation** → Dans son tableau de bord
4. **L'invité accepte/refuse** → Accès automatique à la fiche
5. **L'invité consulte** → Informations + documents partagés

## 🛠️ Installation

### Étape 1 : Appliquer le SQL
```sql
-- Copiez-collez ce script dans Supabase SQL Editor
-- activation-invitations-complete.sql
```

### Étape 2 : Vérifier la configuration SMTP
```env
# Dans .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app
```

### Étape 3 : Redémarrer l'application
```bash
npm run dev
```

## 🎯 Utilisation

### Pour l'expéditeur (vous)

1. **Allez dans une entreprise** → http://localhost:3000/companies/[id]
2. **Onglet "Partage"** → Section "Invitation par email"
3. **Entrez l'email** de l'invité
4. **Ajoutez un message** (optionnel)
5. **Cliquez "Envoyer l'invitation"** ✅

### Pour l'invité

#### Si l'invité n'a pas de compte :
1. **Reçoit l'email** avec lien d'invitation
2. **Clique sur le lien** → Redirection vers l'app
3. **Crée un compte** → Inscription normale
4. **Voit l'invitation** → Dans "Invitations reçues"
5. **Accepte l'invitation** → Accès à la fiche

#### Si l'invité a déjà un compte :
1. **Reçoit l'email** avec lien d'invitation
2. **Se connecte** → Connexion normale
3. **Voit l'invitation** → Dans "Invitations reçues"
4. **Accepte l'invitation** → Accès à la fiche

## 📱 Interface Utilisateur

### Tableau de bord des invitations
- **Accès** : Menu utilisateur → "Invitations reçues"
- **Fonctionnalités** :
  - Voir toutes les invitations reçues
  - Accepter/refuser les invitations
  - Voir le statut (en attente, acceptée, expirée, refusée)
  - Accéder directement aux entreprises partagées

### Page d'entreprise partagée
- **URL** : `/shared/[company-id]`
- **Contenu** :
  - Informations de l'entreprise
  - Documents publics
  - Permissions accordées

## 🔐 Sécurité et Permissions

### Niveaux d'accès
- **view_company** : Voir les informations de l'entreprise
- **view_documents** : Voir les documents publics
- **edit_company** : Modifier l'entreprise (non implémenté)
- **edit_documents** : Modifier les documents (non implémenté)

### Expiration automatique
- **Invitations** : Expirent après 7 jours par défaut
- **Partages** : Expirent en même temps que l'invitation
- **Renouvellement** : Possible en renvoyant une invitation

## 📧 Configuration Email

### Template d'invitation
```
Sujet : Invitation à consulter une entreprise sur Fiich

Bonjour,

[Votre nom] vous invite à consulter les informations de l'entreprise [Nom de l'entreprise] sur Fiich.

Message : [Message personnalisé]

Pour accepter cette invitation :
1. Cliquez sur le lien ci-dessous
2. Créez un compte ou connectez-vous
3. Acceptez l'invitation dans votre tableau de bord

[LIEN D'INVITATION]

L'invitation expire le [DATE].

Cordialement,
L'équipe Fiich
```

### Variables disponibles
- `{inviter_name}` : Nom de l'expéditeur
- `{company_name}` : Nom de l'entreprise
- `{invitation_link}` : Lien d'invitation
- `{expires_at}` : Date d'expiration
- `{message}` : Message personnalisé

## 🐛 Dépannage

### Erreur "Token d'authentification manquant"
1. Videz le cache : `Cmd + Shift + R`
2. Reconnectez-vous
3. Vérifiez que vous êtes connecté

### Erreur "Entreprise non trouvée"
1. Vérifiez que vous possédez l'entreprise
2. Vérifiez que l'ID de l'entreprise est correct
3. Reconnectez-vous si nécessaire

### Emails non reçus
1. Vérifiez la configuration SMTP
2. Vérifiez les spams
3. Testez avec un email valide

### Invitation non visible
1. Vérifiez que l'email correspond
2. Vérifiez que vous êtes connecté
3. Rafraîchissez la page

## 🎉 Fonctionnalités Avancées

### Statistiques d'invitations
- Nombre d'invitations envoyées
- Taux d'acceptation
- Invitations expirées

### Gestion des partages
- Révoquer un accès
- Modifier les permissions
- Renouveler une invitation

### Notifications
- Email de confirmation d'acceptation
- Rappel avant expiration
- Notification de nouveau partage

## 📊 Base de données

### Tables principales
- `invitations` : Invitations envoyées
- `company_shares` : Partages actifs
- `users` : Utilisateurs
- `companies` : Entreprises
- `documents` : Documents

### Relations
- Une invitation → Un partage (quand acceptée)
- Un utilisateur → Plusieurs invitations (envoyées/reçues)
- Une entreprise → Plusieurs partages

---

🎯 **Résultat** : Système complet d'invitations par email avec workflow automatisé ! 