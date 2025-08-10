# 🚀 Fiich - Plateforme de Gestion d'Entreprises

## 📋 Description

Fiich est une plateforme moderne de gestion d'entreprises avec partage de documents, construite avec Next.js 15, TypeScript et Supabase. L'application permet aux utilisateurs de créer et gérer des entreprises, partager des documents de manière sécurisée, et collaborer avec des membres d'équipe.

## ✨ Fonctionnalités Principales

- 🔐 **Authentification sécurisée** avec Supabase Auth
- 🏢 **Gestion d'entreprises** complète
- 👥 **Gestion des membres** et permissions
- 📄 **Partage de documents** sécurisé
- 📧 **Système d'invitations** par email
- 🔔 **Notifications en temps réel**
- 📱 **Interface responsive** et moderne
- 🛡️ **Sécurité RLS** (Row Level Security)

## 🏗️ Architecture Technique

### Frontend
- **Framework**: Next.js 15 avec App Router
- **Language**: TypeScript strict
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks + Context API

### Backend
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Storage**: Supabase Storage
- **API**: Next.js API Routes

### Sécurité
- **RLS**: Row Level Security activé
- **Politiques de sécurité**: Granulaires et basées sur les rôles
- **Validation**: TypeScript + Zod pour la validation des données

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### 1. Cloner le projet
```bash
git clone <repository-url>
cd fiich-app
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
```bash
cp env.local.example .env.local
```

Remplir les variables dans `.env.local` :
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL="Fiich <your-email@gmail.com>"
```

### 4. Configuration de la base de données
```bash
# Créer le schéma propre
npm run db:create-schema

# Activer RLS
npm run db:activate-rls
```

### 5. Lancer l'application
```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 🗄️ Structure de la Base de Données

### Tables Principales
- **users**: Utilisateurs de l'application
- **companies**: Entreprises créées
- **company_members**: Membres des entreprises
- **company_shares**: Partages d'entreprises
- **documents**: Documents stockés
- **invitations**: Invitations envoyées
- **notifications**: Notifications système

### Sécurité RLS
Toutes les tables ont RLS activé avec des politiques de sécurité appropriées :
- Accès basé sur l'authentification
- Permissions granulaires selon les rôles
- Isolation des données entre entreprises

## 📁 Structure du Projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # API Routes
│   ├── auth/              # Pages d'authentification
│   ├── companies/         # Gestion des entreprises
│   ├── dashboard/         # Tableau de bord
│   └── shared/            # Pages de partage
├── components/             # Composants React
│   ├── auth/              # Composants d'authentification
│   ├── company/            # Composants d'entreprise
│   ├── documents/          # Composants de documents
│   ├── layout/             # Composants de mise en page
│   └── ui/                 # Composants UI (shadcn/ui)
├── hooks/                  # Hooks React personnalisés
├── lib/                    # Utilitaires et configuration
│   ├── supabase/           # Configuration Supabase
│   ├── email/              # Configuration email
│   └── utils/              # Fonctions utilitaires
└── types/                  # Types TypeScript
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

## 🚀 Déploiement

### Build de production
```bash
npm run build
```

### Variables d'environnement de production
Assurez-vous de configurer les variables d'environnement appropriées sur votre plateforme de déploiement.

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run start            # Serveur de production
npm run lint             # Vérification du code
npm run type-check       # Vérification des types

# Base de données
npm run db:create-schema # Créer le schéma
npm run db:activate-rls  # Activer RLS
npm run db:cleanup       # Nettoyer la base
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'équipe de développement

---

**🎉 Merci d'utiliser Fiich !**