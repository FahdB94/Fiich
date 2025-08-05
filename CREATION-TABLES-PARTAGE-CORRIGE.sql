-- =====================================================
-- CRÉATION DES TABLES POUR LE SYSTÈME DE PARTAGE (CORRIGÉ)
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

-- 2. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour récupérer l'email de l'utilisateur actuel
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Récupérer l'email de l'utilisateur actuel via l'API auth
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    RETURN user_email;
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

-- 3. TRIGGERS POUR LA GESTION AUTOMATIQUE
-- =====================================================

-- Trigger pour user_companies
CREATE TRIGGER trigger_update_user_companies_updated_at
    BEFORE UPDATE ON user_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. FONCTIONS DE GESTION DES PERMISSIONS (CORRIGÉES)
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
    user_email := get_current_user_email();
    
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
    user_email := get_current_user_email();
    
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

-- 5. VUES POUR FACILITER L'ACCÈS (CORRIGÉES)
-- =====================================================

-- Vue pour les documents accessibles
CREATE OR REPLACE VIEW accessible_documents AS
SELECT 
    d.*,
    c.company_name,
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
LEFT JOIN company_shares cs ON d.company_id = cs.company_id AND cs.shared_with_email = get_current_user_email() AND cs.is_active = true AND (cs.expires_at IS NULL OR cs.expires_at > NOW())
LEFT JOIN invitations i ON d.company_id = i.company_id AND i.email = get_current_user_email() AND i.status = 'accepted'
WHERE 
    d.is_public = true
    OR uc.user_id IS NOT NULL
    OR cs.shared_with_email IS NOT NULL
    OR i.email IS NOT NULL;

-- 6. POLITIQUES RLS POUR LA TABLE DOCUMENTS
-- =====================================================

-- Activer RLS sur la table documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès aux documents publics
CREATE POLICY "Documents publics accessibles" ON documents
    FOR SELECT
    USING (is_public = true);

-- Politique pour permettre l'accès aux documents de l'entreprise de l'utilisateur
CREATE POLICY "Documents de l'entreprise de l'utilisateur" ON documents
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Politique pour permettre l'accès aux documents des entreprises partagées
CREATE POLICY "Documents des entreprises partagées" ON documents
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM company_shares 
            WHERE shared_with_email = get_current_user_email()
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- Politique pour permettre l'accès aux documents via invitations
CREATE POLICY "Documents via invitations" ON documents
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM invitations 
            WHERE email = get_current_user_email()
            AND status = 'accepted'
        )
    );

-- Politique pour permettre la création de documents
CREATE POLICY "Création de documents" ON documents
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Politique pour permettre la modification de documents
CREATE POLICY "Modification de documents" ON documents
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Politique pour permettre la suppression de documents
CREATE POLICY "Suppression de documents" ON documents
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- 7. INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour les recherches par entreprise
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);

-- Index pour les recherches par statut public
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON documents(is_public);

-- Index pour les recherches par type de document
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- Index composite pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_documents_company_public ON documents(company_id, is_public);

-- 8. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_companies IS 'Relation entre utilisateurs et entreprises avec rôles';
COMMENT ON FUNCTION get_current_user_email() IS 'Récupère l''email de l''utilisateur actuel';
COMMENT ON FUNCTION can_access_document(UUID) IS 'Vérifie si l''utilisateur actuel peut accéder à un document spécifique';
COMMENT ON FUNCTION get_accessible_documents() IS 'Retourne tous les documents accessibles à l''utilisateur actuel';
COMMENT ON VIEW accessible_documents IS 'Vue des documents accessibles avec leur type d''accès';

-- 9. TESTS ET VALIDATION
-- =====================================================

-- Test de la fonction get_current_user_email
-- SELECT get_current_user_email();

-- Test de la fonction can_access_document
-- SELECT can_access_document('document-id-here');

-- Test de la fonction get_accessible_documents
-- SELECT * FROM get_accessible_documents();

-- Test de la vue accessible_documents
-- SELECT * FROM accessible_documents;

-- =====================================================
-- FIN DE LA CONFIGURATION
-- =====================================================

-- Instructions pour l'application:
-- 1. Utiliser la fonction can_access_document() avant tout accès
-- 2. Utiliser la vue accessible_documents pour lister les documents
-- 3. Utiliser get_current_user_email() pour récupérer l'email de l'utilisateur
-- 4. Configurer les politiques de bucket storage via l'interface Supabase 