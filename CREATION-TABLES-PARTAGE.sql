-- =====================================================
-- CRÉATION DES TABLES POUR LE SYSTÈME DE PARTAGE
-- =====================================================

-- 1. TABLE USER_COMPANIES (Relation utilisateur-entreprise)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(user_id, company_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_active ON user_companies(is_active);

-- 2. TABLE COMPANY_SHARES (Partage d'entreprises)
-- =====================================================

CREATE TABLE IF NOT EXISTS company_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shared_with_email TEXT NOT NULL,
    shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '{"view": true, "download": true, "upload": false, "delete": false}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(company_id, shared_with_email)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_company_shares_company_id ON company_shares(company_id);
CREATE INDEX IF NOT EXISTS idx_company_shares_email ON company_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_company_shares_active ON company_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_company_shares_expires ON company_shares(expires_at);

-- 3. TABLE INVITATIONS (Invitations d'utilisateurs)
-- =====================================================

CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(company_id, email)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_invitations_company_id ON invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON invitations(expires_at);

-- 4. TABLE DOCUMENT_ACCESS_LOGS (Audit des accès)
-- =====================================================

CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('signed_url', 'public_url', 'download', 'view', 'error')),
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    access_method TEXT CHECK (access_method IN ('direct', 'shared', 'invited', 'public')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_company_id ON document_access_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_access_type ON document_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_created_at ON document_access_logs(created_at);

-- 5. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un token d'invitation sécurisé
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 6. TRIGGERS POUR LA GESTION AUTOMATIQUE
-- =====================================================

-- Trigger pour user_companies
CREATE TRIGGER trigger_update_user_companies_updated_at
    BEFORE UPDATE ON user_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour company_shares
CREATE TRIGGER trigger_update_company_shares_updated_at
    BEFORE UPDATE ON company_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour invitations
CREATE TRIGGER trigger_update_invitations_updated_at
    BEFORE UPDATE ON invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. FONCTIONS DE GESTION DES PERMISSIONS
-- =====================================================

-- Fonction pour vérifier si un utilisateur peut accéder à un document
CREATE OR REPLACE FUNCTION can_access_document(document_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    doc_record RECORD;
    user_email TEXT;
BEGIN
    -- Récupérer l'email de l'utilisateur actuel
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    -- Si pas d'utilisateur connecté, vérifier seulement si le document est public
    IF user_email IS NULL THEN
        SELECT * INTO doc_record FROM documents WHERE id = document_id;
        RETURN COALESCE(doc_record.is_public, false);
    END IF;
    
    -- Récupérer le document
    SELECT * INTO doc_record FROM documents WHERE id = document_id;
    
    -- Si le document n'existe pas
    IF doc_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Si le document est public
    IF doc_record.is_public = true THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier si l'utilisateur appartient à l'entreprise
    IF EXISTS (
        SELECT 1 FROM user_companies 
        WHERE user_id = auth.uid() 
        AND company_id = doc_record.company_id
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier si l'entreprise est partagée avec l'utilisateur
    IF EXISTS (
        SELECT 1 FROM company_shares 
        WHERE company_id = doc_record.company_id 
        AND shared_with_email = user_email
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier si l'utilisateur a une invitation acceptée
    IF EXISTS (
        SELECT 1 FROM invitations 
        WHERE company_id = doc_record.company_id 
        AND email = user_email
        AND status = 'accepted'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Fonction pour obtenir les documents accessibles à un utilisateur
CREATE OR REPLACE FUNCTION get_accessible_documents()
RETURNS TABLE(
    id UUID,
    name TEXT,
    file_path TEXT,
    file_size BIGINT,
    mime_type TEXT,
    company_id UUID,
    is_public BOOLEAN,
    document_type TEXT,
    document_reference TEXT,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Récupérer l'email de l'utilisateur actuel
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.file_path,
        d.file_size,
        d.mime_type,
        d.company_id,
        d.is_public,
        d.document_type,
        d.document_reference,
        d.display_name,
        d.created_at,
        d.updated_at
    FROM documents d
    WHERE 
        -- Documents publics
        d.is_public = true
        OR
        -- Documents de l'entreprise de l'utilisateur
        d.company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
            AND is_active = true
        )
        OR
        -- Documents des entreprises partagées
        (user_email IS NOT NULL AND d.company_id IN (
            SELECT company_id FROM company_shares 
            WHERE shared_with_email = user_email
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
        ))
        OR
        -- Documents via invitations
        (user_email IS NOT NULL AND d.company_id IN (
            SELECT company_id FROM invitations 
            WHERE email = user_email
            AND status = 'accepted'
        ));
END;
$$;

-- 8. VUES POUR FACILITER L'ACCÈS
-- =====================================================

-- Vue pour les documents accessibles
CREATE OR REPLACE VIEW accessible_documents AS
SELECT 
    d.*,
    c.name as company_name,
    CASE 
        WHEN d.is_public THEN 'public'
        WHEN uc.user_id IS NOT NULL THEN 'company_member'
        WHEN cs.shared_with_email IS NOT NULL THEN 'shared'
        WHEN i.email IS NOT NULL THEN 'invited'
        ELSE 'none'
    END as access_type
FROM documents d
LEFT JOIN companies c ON d.company_id = c.id
LEFT JOIN user_companies uc ON d.company_id = uc.company_id AND uc.user_id = auth.uid() AND uc.is_active = true
LEFT JOIN company_shares cs ON d.company_id = cs.company_id AND cs.shared_with_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
) AND cs.is_active = true AND (cs.expires_at IS NULL OR cs.expires_at > NOW())
LEFT JOIN invitations i ON d.company_id = i.company_id AND i.email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
) AND i.status = 'accepted'
WHERE 
    d.is_public = true
    OR uc.user_id IS NOT NULL
    OR cs.shared_with_email IS NOT NULL
    OR i.email IS NOT NULL;

-- 9. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_companies IS 'Relation entre utilisateurs et entreprises avec rôles';
COMMENT ON TABLE company_shares IS 'Partage d''entreprises avec des utilisateurs externes';
COMMENT ON TABLE invitations IS 'Invitations d''utilisateurs à rejoindre une entreprise';
COMMENT ON TABLE document_access_logs IS 'Audit des accès aux documents';

COMMENT ON FUNCTION can_access_document(UUID) IS 'Vérifie si l''utilisateur actuel peut accéder à un document spécifique';
COMMENT ON FUNCTION get_accessible_documents() IS 'Retourne tous les documents accessibles à l''utilisateur actuel';
COMMENT ON VIEW accessible_documents IS 'Vue des documents accessibles avec leur type d''accès';

-- 10. DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Insérer des données de test si nécessaire
-- INSERT INTO user_companies (user_id, company_id, role) VALUES (...);
-- INSERT INTO company_shares (company_id, shared_with_email, shared_by_user_id) VALUES (...);

-- =====================================================
-- FIN DE LA CRÉATION DES TABLES
-- =====================================================

-- Instructions:
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier que toutes les tables sont créées
-- 3. Exécuter ensuite CONFIGURATION-PERMISSIONS-PARTAGE.sql
-- 4. Tester les fonctions de permission 