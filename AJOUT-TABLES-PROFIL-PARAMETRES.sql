-- AJOUT TABLES PROFIL ET PARAMETRES
-- Script pour créer les tables nécessaires aux pages Profile et Settings

-- 1. Table des profils utilisateur
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    company TEXT,
    job_title TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des paramètres utilisateur
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    language TEXT DEFAULT 'fr',
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON public.user_settings(language);
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON public.user_settings(theme);

-- 4. Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Triggers pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) - Désactivé pour les tests
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- 7. Politiques RLS (commentées pour les tests, à activer en production)
/*
-- Politiques pour profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = id);
*/

-- 8. Vérification de la création des tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('profiles', 'user_settings')
ORDER BY table_name, ordinal_position;

-- 9. Insertion de données de test (optionnel)
-- Décommentez les lignes suivantes pour insérer des données de test
/*
INSERT INTO public.profiles (id, email, full_name, phone, company, job_title, bio)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Utilisateur Test', '+33123456789', 'Entreprise Test', 'Développeur', 'Bio de test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_settings (id, email_notifications, push_notifications, language, theme, two_factor_enabled, session_timeout)
VALUES 
    ('00000000-0000-0000-0000-000000000001', true, true, 'fr', 'system', false, 30)
ON CONFLICT (id) DO NOTHING;
*/ 