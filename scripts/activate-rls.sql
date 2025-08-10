-- 🔒 Activation de la Sécurité RLS (Row Level Security)
-- Ce script active RLS sur toutes les tables et définit les politiques de sécurité

-- 1. Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Politiques pour la table users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Politiques pour la table companies
CREATE POLICY "Company members can view their companies" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = companies.id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Company owners and admins can update their companies" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = companies.id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Company owners and admins can delete their companies" ON companies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = companies.id 
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

CREATE POLICY "Authenticated users can create companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Politiques pour la table company_members
CREATE POLICY "Company members can view other members" ON company_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            WHERE cm.company_id = company_members.company_id 
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Company owners and admins can manage members" ON company_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            WHERE cm.company_id = company_members.company_id 
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can view their own memberships" ON company_members
    FOR SELECT USING (user_id = auth.uid());

-- 5. Politiques pour la table company_contacts
CREATE POLICY "Company members can view contacts" ON company_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = company_contacts.company_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Company owners and admins can manage contacts" ON company_contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = company_contacts.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- 6. Politiques pour la table documents
CREATE POLICY "Company members can view documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = documents.company_id 
            AND user_id = auth.uid()
        )
        OR is_public = true
    );

CREATE POLICY "Company members can upload documents" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = documents.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Company owners and admins can manage documents" ON documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = documents.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Company owners and admins can delete documents" ON documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = documents.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- 7. Politiques pour la table invitations
CREATE POLICY "Company members can view invitations" ON invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = invitations.company_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Company owners and admins can manage invitations" ON invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = invitations.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can view invitations sent to them" ON invitations
    FOR SELECT USING (
        invited_email = (
            SELECT email FROM users WHERE id = auth.uid()
        )
    );

-- 8. Politiques pour la table company_shares
CREATE POLICY "Company members can view shares" ON company_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = company_shares.company_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Company owners and admins can manage shares" ON company_shares
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = company_shares.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- 9. Politiques pour la table plans
CREATE POLICY "All authenticated users can view plans" ON plans
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- 10. Politiques pour la table company_subscriptions
CREATE POLICY "Company members can view subscriptions" ON company_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = company_subscriptions.company_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Company owners can manage subscriptions" ON company_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM company_members 
            WHERE company_id = company_subscriptions.company_id 
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- 11. Politiques pour la table notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- 12. Fonction helper pour vérifier les permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_company_id UUID,
    p_permission TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role
    FROM company_members
    WHERE company_id = p_company_id AND user_id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    CASE p_permission
        WHEN 'read' THEN
            RETURN TRUE;
        WHEN 'write' THEN
            RETURN user_role IN ('owner', 'admin');
        WHEN 'admin' THEN
            RETURN user_role IN ('owner', 'admin');
        WHEN 'owner' THEN
            RETURN user_role = 'owner';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '🔒 Sécurité RLS activée avec succès !';
    RAISE NOTICE '📋 Toutes les tables sont maintenant sécurisées.';
    RAISE NOTICE '🛡️ Les politiques de sécurité sont en place.';
END $$;
