# Fiich - Professional Business Identity Sharing Platform

Fiich est une application web moderne permettant aux entreprises de créer, stocker et partager leur fiche d'identité entreprise avec leurs partenaires de manière sécurisée.

## 🚀 Fonctionnalités

- **Gestion d'entreprise complète** : Création et édition de fiches d'identité avec informations légales
- **Stockage sécurisé** : Hébergement de documents (RIB, Kbis, CGV) avec contrôle d'accès
- **Partage intelligent** : Liens sécurisés avec permissions granulaires
- **Authentification robuste** : Système d'auth avec Supabase
- **Interface moderne** : UI responsive avec ShadCN/UI et Tailwind CSS
- **Multilingue** : Support français/anglais

## 🛠️ Technologies

- **Frontend** : Next.js 14, TypeScript, Tailwind CSS, ShadCN/UI
- **Backend** : Supabase (Auth + Database + Storage)
- **Authentification** : Supabase Auth avec JWT
- **Base de données** : PostgreSQL avec RLS
- **Stockage** : Supabase Storage
- **Validation** : Zod avec React Hook Form
- **UI Components** : ShadCN/UI + Radix UI
- **Icons** : Lucide React

## 🎯 Installation et Configuration

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase

### 1. Installation

\`\`\`bash
# Cloner le projet
git clone <repo-url>
cd fiich-app

# Installer les dépendances
npm install
\`\`\`

### 2. Configuration Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com)

2. Exécutez le script SQL de création de base de données :
   - Allez dans l'onglet SQL Editor de votre projet Supabase
   - Copiez et exécutez le contenu du fichier \`supabase-schema.sql\`

3. Configurez le stockage :
   - Allez dans Storage > Buckets
   - Créez un bucket nommé \`company-files\`
   - Définissez-le comme privé (non public)

4. Récupérez vos clés API :
   - Project URL
   - Anon key
   - Service role key (pour les opérations admin)

### 3. Variables d'environnement

Créez un fichier \`.env.local\` à la racine du projet :

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_aleatoire

# Email Configuration (optionnel)
RESEND_API_KEY=votre_cle_resend
FROM_EMAIL=noreply@votredomaine.com
\`\`\`

### 4. Lancement en développement

\`\`\`bash
npm run dev
\`\`\`

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

\`\`\`
src/
├── app/                    # App Router (Next.js 14)
│   ├── auth/              # Pages d'authentification
│   ├── companies/         # Gestion des entreprises
│   ├── dashboard/         # Tableau de bord
│   └── share/             # Pages de partage public
├── components/            # Composants réutilisables
│   ├── auth/              # Composants d'authentification
│   ├── company/           # Composants entreprise
│   ├── documents/         # Gestion des documents
│   ├── forms/             # Formulaires
│   ├── layout/            # Layout et navigation
│   ├── sharing/           # Composants de partage
│   └── ui/                # Composants UI (ShadCN)
├── hooks/                 # Hooks personnalisés
├── lib/                   # Utilitaires et configuration
│   ├── config.ts          # Configuration app
│   ├── supabase.ts        # Client Supabase
│   ├── types.ts           # Types TypeScript
│   ├── validations.ts     # Schémas Zod
│   └── utils.ts           # Fonctions utilitaires
└── styles/                # Styles globaux
\`\`\`

## 🔐 Sécurité

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour garantir que :
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Les partages sont sécurisés avec des tokens uniques
- Les permissions sont respectées lors de l'accès aux documents

### Authentification

- JWT tokens via Supabase Auth
- Validation côté client et serveur
- Sessions sécurisées avec refresh automatique

### Stockage

- Fichiers stockés dans Supabase Storage avec accès contrôlé
- URLs signées pour l'accès temporaire aux documents
- Validation des types de fichiers et tailles

## 🌐 Déploiement

### Vercel (Recommandé)

1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel
3. Déployez automatiquement

### Variables d'environnement de production

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase_prod
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_prod
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_prod
NEXT_PUBLIC_APP_URL=https://votredomaine.com
NEXTAUTH_SECRET=secret_production_fort
\`\`\`

## 📝 Utilisation

### Pour les administrateurs d'entreprise

1. **Inscription/Connexion** : Créez votre compte ou connectez-vous
2. **Créer une entreprise** : Remplissez le formulaire avec vos informations
3. **Ajouter des documents** : Téléversez RIB, Kbis, CGV, etc.
4. **Partager** : Générez des liens sécurisés pour vos partenaires
5. **Gérer les accès** : Contrôlez qui peut voir quoi et pour combien de temps

### Pour les partenaires invités

1. **Réception d'invitation** : Recevez un lien sécurisé par email
2. **Accès à la fiche** : Consultez les informations partagées
3. **Téléchargement** : Accédez aux documents selon vos permissions

## 🔧 Développement

### Scripts disponibles

\`\`\`bash
npm run dev          # Développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linting
npm run type-check   # Vérification TypeScript
\`\`\`

### Contribution

1. Fork le projet
2. Créez une branche feature (\`git checkout -b feature/AmazingFeature\`)
3. Committez vos changements (\`git commit -m 'Add some AmazingFeature'\`)
4. Push sur la branche (\`git push origin feature/AmazingFeature\`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier \`LICENSE\` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue GitHub
- Contactez l'équipe via [contact@fiich.com](mailto:contact@fiich.com)

## 🚀 Roadmap

- [ ] Notifications temps réel
- [ ] API REST publique
- [ ] Intégrations tierces (CRM, etc.)
- [ ] Analytics et rapports
- [ ] App mobile
- [ ] SSO Enterprise

---

Développé avec ❤️ par l'équipe Fiich