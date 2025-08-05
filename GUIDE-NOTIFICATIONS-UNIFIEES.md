# 🔔 Guide du Système de Notifications Unifiées

## 📋 **Vue d'ensemble**

Le système de notifications unifiées regroupe toutes les notifications et invitations dans une seule interface, similaire aux réseaux sociaux modernes comme Facebook ou Instagram.

## 🎯 **Fonctionnalités**

### **1. Cloche Unifiée**
- **1 seule cloche** dans le header
- **Compteur global** qui additionne notifications + invitations
- **Design moderne** avec onglets pour séparer les types

### **2. Types de Notifications**

#### **🔔 Notifications Générales**
- **Modifications d'entreprise** - Changements dans les informations
- **Documents ajoutés** - Nouveaux documents publics
- **Documents supprimés** - Documents publics supprimés
- **Documents modifiés** - Changements dans les documents

#### **📧 Invitations**
- **Demandes d'accès** - Invitations à accéder aux entreprises
- **Liens directs** - Redirection vers la page d'invitation

### **3. Interface Utilisateur**

#### **Dropdown avec Onglets**
```
┌─────────────────────────────────────┐
│ Notifications              [Tout lu] │
├─────────────────────────────────────┤
│ [Tout] [Modifications] [Invitations] │
├─────────────────────────────────────┤
│ 🔔 Notification 1                    │
│ 📧 Invitation 1                      │
│ 🔔 Notification 2                    │
├─────────────────────────────────────┤
│ [Voir toutes les notifications]      │
└─────────────────────────────────────┘
```

#### **Actions Disponibles**
- ✅ **Marquer comme lu** (notifications uniquement)
- 🗑️ **Supprimer** (notifications et invitations)
- 🔗 **Voir les détails** (redirection vers la page concernée)
- 📋 **Tout marquer comme lu** (notifications uniquement)

## 🚀 **Installation**

### **1. Exécuter le Script SQL**
Dans **Supabase Dashboard > SQL Editor**, exécutez :
```sql
-- Contenu du fichier CREATION-TABLE-NOTIFICATIONS.sql
```

### **2. Vérifier l'Installation**
```bash
node scripts/test-notifications.js
```

### **3. Tester l'Interface**
1. Modifiez une entreprise partagée
2. Ajoutez/supprimez un document public
3. Vérifiez la cloche dans le header
4. Testez les onglets et actions

## 🔧 **Architecture Technique**

### **Base de Données**
- **Table `notifications`** - Stockage des notifications
- **Table `invitations`** - Stockage des invitations
- **Triggers automatiques** - Détection des modifications
- **Fonctions RPC** - Création et gestion

### **Frontend**
- **Hook `useNotifications`** - Gestion unifiée des données
- **Composant `UnifiedNotificationBell`** - Interface utilisateur
- **Temps réel** - Supabase Realtime pour les mises à jour

### **Types de Données**
```typescript
interface UnifiedNotification {
  id: string
  type: 'notification' | 'invitation'
  title: string
  message: string
  is_read: boolean
  created_at: string
  company_id?: string
  metadata?: any
  // Pour les invitations
  invitation_id?: string
  invited_by_email?: string
  expires_at?: string
}
```

## 📱 **Utilisation**

### **Pour les Utilisateurs**
1. **Cliquez sur la cloche** dans le header
2. **Naviguez entre les onglets** :
   - **Tout** : Toutes les notifications et invitations
   - **Modifications** : Seulement les notifications d'entreprise
   - **Invitations** : Seulement les demandes d'accès
3. **Actions rapides** :
   - Cliquez sur "Détails" pour voir les modifications
   - Cliquez sur "Voir" pour les invitations
   - Marquez comme lu ou supprimez

### **Pour les Développeurs**
1. **Notifications automatiques** - Créées par les triggers
2. **Invitations manuelles** - Créées lors du partage
3. **Temps réel** - Mises à jour instantanées
4. **Gestion d'état** - Hook React pour l'interface

## 🎨 **Design et UX**

### **Indicateurs Visuels**
- 🔵 **Point bleu** - Notification non lue
- 🏢 **Icône bâtiment** - Modifications d'entreprise
- 📄 **Icône document** - Modifications de documents
- 📧 **Icône mail** - Invitations
- 🗑️ **Icône poubelle** - Supprimer

### **Couleurs**
- **Bleu** - Invitations et modifications d'entreprise
- **Vert** - Documents ajoutés
- **Rouge** - Documents supprimés
- **Orange** - Documents modifiés

## 🔄 **Flux de Données**

### **Création de Notifications**
```
Modification → Trigger → Fonction RPC → Table notifications → Interface utilisateur
```

### **Création d'Invitations**
```
Partage → API → Table invitations → Interface utilisateur
```

### **Temps Réel**
```
Base de données → Supabase Realtime → Hook React → Interface utilisateur
```

## 🧪 **Tests**

### **Tests Automatiques**
```bash
# Test du système complet
node scripts/test-notifications.js

# Vérification des tables
# Test des fonctions RPC
# Test des triggers
```

### **Tests Manuels**
1. **Modifiez une entreprise** partagée
2. **Ajoutez un document** public
3. **Supprimez un document** public
4. **Partagez une entreprise** avec un email
5. **Vérifiez les notifications** dans l'interface

## 🐛 **Dépannage**

### **Problèmes Courants**

#### **Notifications ne s'affichent pas**
- Vérifiez que les triggers sont créés
- Vérifiez les politiques RLS
- Vérifiez la connexion Supabase Realtime

#### **Invitations ne s'affichent pas**
- Vérifiez que l'email correspond
- Vérifiez que l'invitation n'a pas expiré
- Vérifiez les jointures dans la requête

#### **Erreurs de temps réel**
- Vérifiez la configuration Supabase
- Vérifiez les permissions de la base de données
- Vérifiez la connexion réseau

### **Logs de Débogage**
```javascript
// Dans le hook useNotifications
console.log('Notifications:', notifications)
console.log('Invitations:', invitations)
console.log('Unified:', unifiedNotifications)
```

## 📈 **Évolutions Futures**

### **Fonctionnalités Possibles**
- 🔔 **Notifications push** - Notifications navigateur
- 📧 **Notifications email** - Envoi automatique d'emails
- ⚙️ **Préférences** - Choix des types de notifications
- 📱 **Notifications mobiles** - Application mobile
- 🔔 **Sons** - Sons de notification
- 🎨 **Thèmes** - Personnalisation des couleurs

### **Optimisations**
- 📊 **Pagination** - Chargement par pages
- 🔍 **Filtres** - Filtrage avancé
- 📅 **Archivage** - Suppression automatique
- ⚡ **Performance** - Optimisation des requêtes

## ✅ **Checklist de Validation**

- [ ] Script SQL exécuté
- [ ] Tables créées
- [ ] Triggers configurés
- [ ] Politiques RLS activées
- [ ] Hook React fonctionnel
- [ ] Interface utilisateur opérationnelle
- [ ] Temps réel configuré
- [ ] Tests passés
- [ ] Documentation mise à jour

---

**🎉 Le système de notifications unifiées est maintenant opérationnel !** 