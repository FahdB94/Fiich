-- Script pour étendre la table companies avec les nouvelles informations
-- et créer la table company_contacts

-- 1. Ajout des nouvelles colonnes à la table companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS ape_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(25),
ADD COLUMN IF NOT EXISTS payment_terms TEXT[],
ADD COLUMN IF NOT EXISTS rib VARCHAR(50);

-- 2. Création de la table company_contacts
CREATE TABLE IF NOT EXISTS public.company_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    job_title VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON public.company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_type ON public.company_contacts(contact_type);

-- 4. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_company_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_contacts_updated_at
    BEFORE UPDATE ON public.company_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_company_contacts_updated_at();

-- 5. RLS pour company_contacts
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir les contacts de leurs entreprises
CREATE POLICY "Users can view contacts of their companies" ON public.company_contacts
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Politique pour permettre aux utilisateurs de créer des contacts pour leurs entreprises
CREATE POLICY "Users can create contacts for their companies" ON public.company_contacts
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Politique pour permettre aux utilisateurs de modifier les contacts de leurs entreprises
CREATE POLICY "Users can update contacts of their companies" ON public.company_contacts
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- Politique pour permettre aux utilisateurs de supprimer les contacts de leurs entreprises
CREATE POLICY "Users can delete contacts of their companies" ON public.company_contacts
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    );

-- 6. Permissions pour le rôle authenticated
GRANT ALL ON public.company_contacts TO authenticated;

-- 7. Commentaires pour la documentation
COMMENT ON COLUMN public.companies.ape_code IS 'Code APE (Activité Principale Exercée) au format 4 chiffres + 1 lettre';
COMMENT ON COLUMN public.companies.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN public.companies.payment_terms IS 'Conditions de paiement acceptées par l''entreprise';
COMMENT ON COLUMN public.companies.rib IS 'Relevé d''Identité Bancaire';

COMMENT ON TABLE public.company_contacts IS 'Contacts associés aux entreprises';
COMMENT ON COLUMN public.company_contacts.contact_type IS 'Type de contact (commercial, comptable, technique, etc.)';
COMMENT ON COLUMN public.company_contacts.name IS 'Nom du contact';
COMMENT ON COLUMN public.company_contacts.job_title IS 'Poste/fonction du contact';
COMMENT ON COLUMN public.company_contacts.notes IS 'Notes supplémentaires sur le contact';

-- 8. Validation des contraintes
-- Validation du format APE (optionnel)
ALTER TABLE public.companies 
ADD CONSTRAINT check_ape_code_format 
CHECK (ape_code IS NULL OR ape_code ~ '^\d{4}[A-Z]$');

-- Validation du format TVA (optionnel)
ALTER TABLE public.companies 
ADD CONSTRAINT check_vat_number_format 
CHECK (vat_number IS NULL OR vat_number ~ '^[A-Z]{2}[A-Z0-9]{2,20}$');

-- Validation du format RIB (optionnel)
ALTER TABLE public.companies 
ADD CONSTRAINT check_rib_format 
CHECK (rib IS NULL OR rib ~ '^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}[A-Z0-9]{13}\d{2}$');

-- 9. Fonction utilitaire pour récupérer les contacts d'une entreprise
CREATE OR REPLACE FUNCTION get_company_contacts(p_company_id UUID)
RETURNS TABLE (
    id UUID,
    contact_type VARCHAR(50),
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    job_title VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.id,
        cc.contact_type,
        cc.name,
        cc.email,
        cc.phone,
        cc.job_title,
        cc.notes,
        cc.created_at
    FROM public.company_contacts cc
    WHERE cc.company_id = p_company_id
    ORDER BY cc.contact_type, cc.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RPC pour les contacts
GRANT EXECUTE ON FUNCTION get_company_contacts(UUID) TO authenticated;

-- Politique RLS pour la fonction
CREATE POLICY "Users can access get_company_contacts for their companies" ON public.company_contacts
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies WHERE user_id = auth.uid()
        )
    ); 