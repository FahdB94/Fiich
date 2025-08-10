-- 🏗️ Création du Schéma Propre de la Base de Données Fiich
-- Architecture normalisée et sécurisée avec RLS

-- 1. Créer les types ENUM
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE document_type AS ENUM ('kbis', 'rib', 'contrat', 'facture', 'devis', 'autre');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'trialing', 'past_due');

-- 2. Créer la table users (extension de auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer la table companies
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    siren TEXT UNIQUE,
    siret TEXT,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'France',
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    ape_code TEXT,
    vat_number TEXT,
    payment_terms TEXT[],
    rib TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Créer la table company_members (gestion des rôles)
CREATE TABLE company_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- 5. Créer la table company_contacts
CREATE TABLE company_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    job_title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Créer la table documents
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    document_type document_type NOT NULL,
    document_reference TEXT,
    document_version TEXT DEFAULT '1.0',
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Créer la table invitations
CREATE TABLE invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by UUID REFERENCES users(id) NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    role_requested user_role NOT NULL DEFAULT 'member',
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Créer la table company_shares (partage public)
CREATE TABLE company_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE NOT NULL,
    shared_by UUID REFERENCES users(id) NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['view_company', 'view_documents'],
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Créer la table plans
CREATE TABLE plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Créer la table company_subscriptions
CREATE TABLE company_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    status subscription_status DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Créer la table notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Créer les index pour les performances
CREATE INDEX idx_companies_user_id ON companies(id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_invitations_company_id ON invitations(company_id);
CREATE INDEX idx_invitations_email ON invitations(invited_email);
CREATE INDEX idx_invitations_token ON invitations(invitation_token);
CREATE INDEX idx_company_shares_company_id ON company_shares(company_id);
CREATE INDEX idx_company_shares_token ON company_shares(share_token);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- 13. Créer les triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_members_updated_at BEFORE UPDATE ON company_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_contacts_updated_at BEFORE UPDATE ON company_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_shares_updated_at BEFORE UPDATE ON company_shares FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON company_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Insérer les plans par défaut
INSERT INTO plans (code, name, description, price_monthly, price_yearly, features) VALUES
('free', 'Gratuit', 'Plan gratuit avec fonctionnalités de base', 0, 0, '{"max_companies": 1, "max_documents": 10, "max_members": 2, "storage_gb": 1}'),
('pro', 'Professionnel', 'Plan professionnel pour PME', 29, 290, '{"max_companies": 5, "max_documents": 100, "max_members": 10, "storage_gb": 10, "advanced_sharing": true, "analytics": true}'),
('business', 'Business', 'Plan business pour grandes entreprises', 99, 990, '{"max_companies": 20, "max_documents": 1000, "max_members": 50, "storage_gb": 100, "advanced_sharing": true, "analytics": true, "priority_support": true, "custom_branding": true}');

-- 15. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Schéma de base de données créé avec succès !';
    RAISE NOTICE '📊 Tables créées: users, companies, company_members, company_contacts, documents, invitations, company_shares, plans, company_subscriptions, notifications';
    RAISE NOTICE '🔒 RLS sera activé dans le prochain script.';
END $$;
