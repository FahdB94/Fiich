-- Création de la table invitations si elle n'existe pas
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'invitations'
  ) THEN
    -- Créer la table invitations
    CREATE TABLE public.invitations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
      invited_email TEXT NOT NULL,
      invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      invitation_token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Créer un index sur le token pour les recherches rapides
    CREATE INDEX idx_invitations_token ON public.invitations(invitation_token);
    CREATE INDEX idx_invitations_email ON public.invitations(invited_email);
    CREATE INDEX idx_invitations_expires ON public.invitations(expires_at);

    -- Activer RLS
    ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

    -- Politique pour permettre la lecture des invitations par token (pour les liens publics)
    CREATE POLICY "Allow read invitations by token" ON public.invitations
      FOR SELECT USING (true);

    -- Politique pour permettre la création d'invitations par le propriétaire de l'entreprise
    CREATE POLICY "Allow create invitations by company owner" ON public.invitations
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.companies 
          WHERE id = company_id 
          AND user_id = auth.uid()
        )
      );

    -- Politique pour permettre la suppression d'invitations par le créateur
    CREATE POLICY "Allow delete invitations by creator" ON public.invitations
      FOR DELETE USING (invited_by = auth.uid());

    RAISE NOTICE '✅ Table invitations créée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Table invitations existe déjà';
  END IF;
END $$;

-- Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position; 