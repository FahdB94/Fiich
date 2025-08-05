# 🔧 Guide de Diagnostic - Partage d'Entreprise

## 🚨 Problème Identifié
**Pas de message de confirmation lors de l'envoi d'invitation**

## 🔍 Diagnostic Étape par Étape

### **Étape 1: Vérifier les Logs du Navigateur**

1. **Ouvrir la console** (F12 > Console)
2. **Aller sur** `http://localhost:3000/companies/2d195791-4300-45f7-8f58-839750874903`
3. **Cliquer sur "Partager"** puis "Envoyer l'invitation"
4. **Vérifier les logs** :
   - `🚀 Début de l'envoi d'invitation:` - Confirme le début
   - `🔑 Session récupérée:` - Confirme l'authentification
   - `📤 Envoi de la requête:` - Confirme l'envoi
   - `📥 Réponse reçue:` - Confirme la réponse
   - `✅ Succès - Données reçues:` - Confirme le succès
   - `❌ Erreur API:` - Indique une erreur

### **Étape 2: Vérifier les Logs du Serveur**

1. **Ouvrir le terminal** où Next.js tourne
2. **Envoyer une invitation**
3. **Vérifier les logs** :
   - `📨 API share-company appelée` - Confirme l'appel API
   - `🔑 Auth header: Présent` - Confirme l'authentification
   - `👤 Authentification: hasUser: true` - Confirme l'utilisateur
   - `🏢 Vérification entreprise: hasCompany: true` - Confirme l'entreprise

### **Étape 3: Vérifier les Variables d'Environnement**

Créer ou vérifier le fichier `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon

# SMTP (pour l'envoi d'emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app
FROM_EMAIL=noreply@fiich-app.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Étape 4: Tester l'API Manuellement**

Exécuter le script de test :

```bash
# Avec les variables d'environnement
NEXT_PUBLIC_SUPABASE_URL=votre_url NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle node scripts/test-share-api.js
```

### **Étape 5: Vérifier les Tables de Base de Données**

Dans **Supabase Dashboard > SQL Editor**, exécuter :

```sql
-- Vérifier la table invitations
SELECT COUNT(*) FROM invitations;

-- Vérifier la table company_shares
SELECT COUNT(*) FROM company_shares;

-- Vérifier les permissions
SELECT * FROM pg_policies WHERE tablename = 'invitations';
SELECT * FROM pg_policies WHERE tablename = 'company_shares';
```

## 🛠️ Solutions Spécifiques

### **Problème: Pas de logs dans la console**

#### **Cause 1: JavaScript désactivé**
- Vérifier que JavaScript est activé
- Vérifier qu'il n'y a pas d'erreurs JavaScript

#### **Cause 2: Composant non rendu**
- Vérifier que le composant `ShareCompany` est bien importé
- Vérifier que l'onglet "Partage" est actif

### **Problème: Erreur d'authentification**

#### **Cause 1: Session expirée**
```javascript
// Dans la console du navigateur
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

#### **Cause 2: Token invalide**
- Se déconnecter et se reconnecter
- Vérifier les cookies du navigateur

### **Problème: Erreur API**

#### **Cause 1: Variables SMTP manquantes**
- Configurer toutes les variables SMTP
- Redémarrer le serveur Next.js

#### **Cause 2: Tables manquantes**
```sql
-- Créer la table invitations si elle n'existe pas
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table company_shares si elle n'existe pas
CREATE TABLE IF NOT EXISTS company_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['view_company'],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Problème: Toast non affiché**

#### **Cause 1: Toaster non monté**
- Vérifier que `<Toaster />` est dans le layout
- Vérifier qu'il n'y a pas de CSS qui cache les toasts

#### **Cause 2: Hook useToast non fonctionnel**
```javascript
// Dans la console du navigateur
import { useToast } from '@/hooks/use-toast'
const { toast } = useToast()
toast.success('Test de toast')
```

## 📋 Checklist de Vérification

### **Frontend**
- [ ] Console du navigateur ouverte
- [ ] Pas d'erreurs JavaScript
- [ ] Composant ShareCompany rendu
- [ ] Formulaire rempli correctement
- [ ] Bouton "Envoyer l'invitation" cliqué

### **Backend**
- [ ] Serveur Next.js en cours d'exécution
- [ ] Logs API visibles dans le terminal
- [ ] Variables d'environnement configurées
- [ ] Tables de base de données existantes
- [ ] Permissions RLS configurées

### **SMTP**
- [ ] Variables SMTP définies
- [ ] Serveur SMTP accessible
- [ ] Identifiants SMTP valides
- [ ] Port SMTP ouvert

## 🚀 Résolution Rapide

### **Si rien ne fonctionne :**

1. **Redémarrer l'application** :
```bash
npm run dev
```

2. **Vider le cache** :
```bash
rm -rf .next
npm run dev
```

3. **Vérifier l'authentification** :
- Se déconnecter
- Se reconnecter
- Tester à nouveau

4. **Tester avec un email valide** :
- Utiliser une vraie adresse email
- Vérifier les spams

---

**Note** : Après avoir ajouté les logs de débogage, testez à nouveau et partagez les logs de la console pour un diagnostic plus précis. 