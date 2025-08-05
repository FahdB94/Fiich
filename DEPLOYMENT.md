# Guide de déploiement Fiich

## 🚀 Déploiement rapide

### 1. Configuration Supabase

1. **Créer un projet Supabase** :
   - Allez sur [supabase.com](https://supabase.com)
   - Créez un nouveau projet
   - Notez l'URL et les clés API

2. **Exécuter le schéma de base de données** :
   - Ouvrez l'éditeur SQL dans Supabase
   - Copiez le contenu de `supabase-schema.sql`
   - Exécutez le script

3. **Configurer le stockage** :
   ```sql
   -- Créer le bucket pour les fichiers
   INSERT INTO storage.buckets (id, name, public) VALUES ('company-files', 'company-files', false);
   
   -- Politique pour télécharger des fichiers
   CREATE POLICY "Users can upload files for own companies" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'company-files' 
     AND auth.uid() IS NOT NULL
   );
   
   -- Politique pour voir ses propres fichiers
   CREATE POLICY "Users can view own files" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'company-files' 
     AND auth.uid() IS NOT NULL
   );
   
   -- Politique pour supprimer ses propres fichiers
   CREATE POLICY "Users can delete own files" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'company-files' 
     AND auth.uid() IS NOT NULL
   );
   ```

### 2. Variables d'environnement

Créez un fichier `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=un_secret_aleatoire_fort

# Email (optionnel)
RESEND_API_KEY=votre_cle_resend
FROM_EMAIL=noreply@votre-domaine.com
```

### 3. Installation et lancement

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Ouvrir http://localhost:3000
```

## 🌐 Déploiement en production

### Vercel (Recommandé)

1. **Préparer le repository** :
   ```bash
   git add .
   git commit -m "Initial Fiich setup"
   git push origin main
   ```

2. **Déployer sur Vercel** :
   - Connectez votre repository GitHub à Vercel
   - Configurez les variables d'environnement
   - Déployez automatiquement

3. **Variables d'environnement Vercel** :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
   NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
   NEXTAUTH_SECRET=secret_production_securise
   ```

### Netlify

1. **Build settings** :
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Configurer les variables d'environnement** dans Netlify

### Railway/Render

1. **Configurer le service**
2. **Ajouter les variables d'environnement**
3. **Déployer depuis GitHub**

## 🔧 Configuration avancée

### Authentification personnalisée

Pour personnaliser l'authentification :

```typescript
// src/lib/auth-config.ts
export const authConfig = {
  providers: ['email'],
  redirectTo: '/dashboard',
  appearance: {
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: 'hsl(var(--primary))',
          brandAccent: 'hsl(var(--primary))',
        },
      },
    },
  },
}
```

### Email personnalisé

Pour utiliser Resend pour les emails :

1. Créez un compte [Resend](https://resend.com)
2. Ajoutez votre API key dans `.env.local`
3. Configurez votre domaine

### Domaine personnalisé

1. **Dans Supabase** :
   - Allez dans Authentication > Settings
   - Ajoutez votre domaine dans "Site URL"

2. **Dans Vercel** :
   - Ajoutez votre domaine personnalisé
   - Configurez les DNS

## 🧪 Tests et validation

### Tests manuels

1. **Authentification** :
   - [ ] Inscription utilisateur
   - [ ] Connexion/déconnexion
   - [ ] Récupération de mot de passe

2. **Gestion d'entreprise** :
   - [ ] Création d'entreprise
   - [ ] Modification d'entreprise
   - [ ] Téléchargement de logo

3. **Documents** :
   - [ ] Upload de documents
   - [ ] Visualisation des documents
   - [ ] Suppression de documents

4. **Partage** :
   - [ ] Création de lien de partage
   - [ ] Accès avec le lien
   - [ ] Permissions respectées

### Performance

```bash
# Analyser le bundle
npm run build
npx @next/bundle-analyzer

# Tests de performance
npm install -g lighthouse
lighthouse https://votre-domaine.com
```

## 🔍 Monitoring et analytics

### Supabase Analytics

Surveillez dans le dashboard Supabase :
- Nombre d'utilisateurs actifs
- Requêtes de base de données
- Utilisation du stockage

### Vercel Analytics

Activez Vercel Analytics pour :
- Performances des pages
- Core Web Vitals
- Erreurs client

### Logs et erreurs

```typescript
// src/lib/logger.ts
export const logger = {
  error: (message: string, error?: Error) => {
    console.error(message, error)
    // Envoyer à votre service de monitoring
  },
  info: (message: string) => {
    console.log(message)
  },
}
```

## 🚀 Optimisations

### Images

```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['votre-projet.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### Cache

```typescript
// src/lib/cache.ts
export const revalidateTime = {
  companies: 60, // 1 minute
  documents: 300, // 5 minutes
  user: 3600, // 1 heure
}
```

### SEO

```typescript
// src/app/layout.tsx
export const metadata = {
  robots: 'index, follow',
  sitemap: '/sitemap.xml',
  verification: {
    google: 'votre-code-google',
  },
}
```

## 🔒 Sécurité en production

### Headers de sécurité

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### HTTPS

- Forcez HTTPS en production
- Utilisez HSTS headers
- Configurez CSP si nécessaire

### Backup

- Sauvegardez régulièrement votre base Supabase
- Versionnez vos schémas de base de données
- Testez vos procédures de récupération

---

✅ **Votre application Fiich est maintenant prête pour la production !**