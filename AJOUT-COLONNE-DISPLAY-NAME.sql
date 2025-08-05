-- AJOUT COLONNE DISPLAY_NAME
-- Ajoute la colonne display_name si elle n'existe pas déjà
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- (Optionnel) Copie le nom existant dans display_name pour les anciens documents
UPDATE documents
SET display_name = name
WHERE display_name IS NULL;

-- Ajoute un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_documents_display_name ON documents(display_name);
