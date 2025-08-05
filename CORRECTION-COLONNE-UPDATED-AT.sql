-- CORRECTION : Ajout de la colonne updated_at manquante
-- Exécutez ce script si vous avez des erreurs avec la colonne updated_at

-- 1. Ajouter la colonne updated_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Colonne updated_at ajoutée à la table notifications';
  ELSE
    RAISE NOTICE 'ℹ️  La colonne updated_at existe déjà';
  END IF;
END $$;

-- 2. Mettre à jour les enregistrements existants
UPDATE public.notifications 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON public.notifications;

-- Créer le trigger
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_updated_at();

-- 4. Vérification
DO $$
BEGIN
  RAISE NOTICE '✅ Correction appliquée avec succès';
  RAISE NOTICE '📋 Colonne updated_at disponible';
  RAISE NOTICE '🔄 Trigger de mise à jour automatique configuré';
END $$; 