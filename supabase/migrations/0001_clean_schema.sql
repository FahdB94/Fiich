-- Migration 0001: Schéma de base propre et organisé
-- Date: 2024-01-XX
-- Description: Création du schéma de base pour l'application Fiich

-- Suppression des types et tables existants (nettoyage)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Création des types ENUM
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE notification_type AS ENUM ('invitation', 'document_shared', 'company_update', 'system');

-- Création de la table users (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table companies
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    industry TEXT,
    size TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table company_members
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role user_role DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- Création de la table company_shares
CREATE TABLE IF NOT EXISTS public.company_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{"view": true, "edit": false, "delete": false}' NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role user_role DEFAULT 'member' NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status invitation_status DEFAULT 'pending' NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    invited_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_company ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_company ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE NOT is_read;

-- Création des triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Création des fonctions RPC utiles
CREATE OR REPLACE FUNCTION get_user_companies(user_uuid UUID)
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    user_role user_role,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        cm.role,
        (c.owner_id = user_uuid) as is_owner
    FROM public.companies c
    INNER JOIN public.company_members cm ON c.id = cm.company_id
    WHERE cm.user_id = user_uuid
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Politiques pour companies
CREATE POLICY "Users can view companies they are members of" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members 
            WHERE company_id = id AND user_id = auth.uid()
        ) OR is_public = true
    );

CREATE POLICY "Only owners can update companies" ON public.companies
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Only owners can delete companies" ON public.companies
    FOR DELETE USING (owner_id = auth.uid());

-- Politiques pour company_members
CREATE POLICY "Members can view company members" ON public.company_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members 
            WHERE company_id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only owners can manage company members" ON public.company_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE id = company_id AND owner_id = auth.uid()
        )
    );

-- Politiques pour documents
CREATE POLICY "Users can view documents from their companies" ON public.documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members 
            WHERE company_id = company_id AND user_id = auth.uid()
        ) OR is_public = true
    );

CREATE POLICY "Members can upload documents" ON public.documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_members 
            WHERE company_id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only uploaders and company owners can update documents" ON public.documents
    FOR UPDATE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE id = company_id AND owner_id = auth.uid()
        )
    );

-- Politiques pour invitations
CREATE POLICY "Company members can view invitations" ON public.invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members 
            WHERE company_id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only company owners can manage invitations" ON public.invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE id = company_id AND owner_id = auth.uid()
        )
    );

-- Politiques pour notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Politiques pour company_shares
CREATE POLICY "Company members can view shares" ON public.company_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members 
            WHERE company_id = company_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only company owners can manage shares" ON public.company_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE id = company_id AND owner_id = auth.uid()
        )
    );

