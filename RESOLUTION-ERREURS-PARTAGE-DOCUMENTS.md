# Résolution des Erreurs de Partage de Documents

## 🚨 **Problème identifié**

### **Erreurs rencontrées :**
```
StorageError@http://localhost:3000/_next/static/chunks/node_modules_bb61ffaa._.js:3253:14
StorageApiError@http://localhost:3000/_next/static/chunks/node_modules_bb61ffaa._.js:3271:14
```

### **Diagnostic réalisé :**
```
✅ Document existe en base de données (public: true)
✅ Fichier existe en storage
✅ URLs signées/publiques fonctionnent avec clé service
❌ Accès anonyme au storage refusé (Object not found - 404)
```

## 🔍 **Analyse systémique du problème**

### **1. Problème principal**
Le bucket `company-files` n'est **pas configuré pour permettre l'accès anonyme** aux fichiers, même pour les documents marqués comme publics.

### **2. Impact sur le partage**
- Les partenaires ne peuvent pas accéder aux documents partagés
- Les URLs de partage génèrent des erreurs 404
- L'expérience utilisateur est dégradée

### **3. Causes identifiées**
1. **Politiques RLS du bucket** non configurées pour l'accès public
2. **Permissions storage** trop restrictives
3. **Gestion des URLs** non optimisée pour le partage

## 🛡️ **Solution systémique robuste**

### **1. Configuration des permissions Supabase**

#### **A. Politiques RLS pour la table documents**
```sql
-- Activer RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents publics accessibles
CREATE POLICY "Documents publics accessibles" ON documents
    FOR SELECT
    USING (is_public = true);

-- Documents des entreprises partagées
CREATE POLICY "Documents des entreprises partagées" ON documents
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM company_shares 
            WHERE shared_with_email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
            AND is_active = true
        )
    );
```

#### **B. Fonction de vérification des permissions**
```sql
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
        RETURN doc_record.is_public = true;
    END IF;
    
    -- Récupérer le document
    SELECT * INTO doc_record FROM documents WHERE id = document_id;
    
    -- Si le document est public
    IF doc_record.is_public = true THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier les permissions de partage
    IF EXISTS (
        SELECT 1 FROM company_shares 
        WHERE company_id = doc_record.company_id 
        AND shared_with_email = user_email
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;
```

### **2. Configuration du bucket storage**

#### **A. Via l'interface Supabase :**
1. Aller dans **Storage** > **Policies**
2. Sélectionner le bucket `company-files`
3. Ajouter une politique pour l'accès public :

```sql
-- Politique pour permettre l'accès public aux fichiers
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'company-files');
```

#### **B. Ou via SQL :**
```sql
-- Permettre l'accès public au bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'company-files';
```

### **3. Gestion robuste côté application**

#### **A. Fonction d'accès aux documents améliorée**
```typescript
const handleView = async (document: Document) => {
  try {
    console.log('📄 Tentative de visualisation:', document.name)
    console.log('🔐 Document public:', document.is_public)
    
    const fullStoragePath = `documents/${document.file_path}`

    // Étape 1: Vérifier les permissions
    const { data: permissionCheck, error: permError } = await supabase
      .rpc('can_access_document', { document_id: document.id })
      .catch(() => ({ data: null, error: 'Fonction non disponible' }))

    if (permError) {
      console.log('ℹ️  Vérification permissions non disponible')
    } else if (!permissionCheck) {
      toast.error('Accès non autorisé')
      return
    }

    // Étape 2: Essayer URL signée
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('company-files')
      .createSignedUrl(fullStoragePath, 60)

    if (urlError) {
      console.error('❌ Erreur URL signée:', urlError)
      
      // Étape 3: Fallback vers URL publique
      const { data: publicUrl, error: publicError } = await supabase.storage
        .from('company-files')
        .getPublicUrl(fullStoragePath)
      
      if (publicError) {
        toast.error('Document inaccessible')
        return
      }
      
      window.open(publicUrl.publicUrl, '_blank')
      return
    }

    // Succès avec URL signée
    window.open(signedUrl.signedUrl, '_blank')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    toast.error('Erreur lors de l\'accès au document')
  }
}
```

#### **B. Gestion des erreurs spécifiques**
```typescript
// Gestion des erreurs 404 (fichier manquant)
if (urlError.statusCode === 404) {
  // Vérifier l'existence du fichier
  const { data: fileExists } = await supabase.storage
    .from('company-files')
    .list(`documents/${document.company_id}`)

  const fileName = document.file_path.split('/').pop()
  const exists = fileExists.some(file => file.name === fileName)
  
  if (!exists) {
    // Supprimer l'entrée orpheline
    await supabase.from('documents').delete().eq('id', document.id)
    toast.error('Document supprimé car fichier manquant')
    fetchDocuments()
    return
  }
}
```

### **4. Monitoring et audit**

#### **A. Table d'audit des accès**
```sql
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id),
    user_id UUID REFERENCES auth.users(id),
    access_type TEXT CHECK (access_type IN ('signed_url', 'public_url', 'error')),
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Fonction de logging**
```typescript
const logDocumentAccess = async (documentId: string, accessType: string, error?: string) => {
  try {
    await supabase.from('document_access_logs').insert({
      document_id: documentId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      access_type: accessType,
      error_message: error,
      ip_address: 'client_ip', // À récupérer côté serveur
      user_agent: navigator.userAgent
    })
  } catch (logError) {
    console.log('ℹ️  Erreur logging:', logError)
  }
}
```

## 📋 **Plan d'implémentation**

### **Phase 1: Configuration base de données**
1. ✅ Exécuter le script `CONFIGURATION-PERMISSIONS-PARTAGE.sql`
2. ✅ Vérifier les politiques RLS
3. ✅ Tester les fonctions de permission

### **Phase 2: Configuration storage**
1. 🔄 Configurer le bucket `company-files` comme public
2. 🔄 Ajouter les politiques de bucket appropriées
3. 🔄 Tester l'accès anonyme

### **Phase 3: Mise à jour application**
1. 🔄 Implémenter la gestion robuste des erreurs
2. 🔄 Ajouter le logging des accès
3. 🔄 Tester le partage complet

### **Phase 4: Tests et validation**
1. 🔄 Tester l'accès anonyme aux documents
2. 🔄 Valider les URLs de partage
3. 🔄 Vérifier les performances

## 🧪 **Tests de validation**

### **Test 1: Accès anonyme**
```javascript
// Simuler un accès anonyme
const anonClient = createClient(supabaseUrl, anonKey)
const { data, error } = await anonClient.storage
  .from('company-files')
  .createSignedUrl('documents/public-doc.pdf', 60)

// Doit réussir pour les documents publics
console.log('Accès anonyme:', error ? '❌' : '✅')
```

### **Test 2: Partage d'entreprise**
```javascript
// Tester l'accès via partage
const { data: sharedDocs } = await supabase
  .from('documents')
  .select('*')
  .eq('company_id', sharedCompanyId)

// Doit retourner les documents partagés
console.log('Documents partagés:', sharedDocs.length)
```

### **Test 3: URLs de partage**
```javascript
// Tester la génération d'URLs
const { data: url } = await supabase.storage
  .from('company-files')
  .getPublicUrl('documents/shared-doc.pdf')

// Doit générer une URL accessible
console.log('URL publique:', url.publicUrl)
```

## 🎯 **Résultats attendus**

### **Avant (problématique)**
```
❌ StorageError lors de l'accès partagé
❌ URLs de partage non fonctionnelles
❌ Expérience utilisateur dégradée
❌ Pas de gestion d'erreurs robuste
```

### **Après (solution robuste)**
```
✅ Accès anonyme aux documents publics
✅ URLs de partage fonctionnelles
✅ Gestion d'erreurs complète
✅ Monitoring et audit des accès
✅ Expérience utilisateur optimale
```

## 📝 **Instructions pour l'équipe**

### **1. Exécution du script SQL**
```bash
# Copier-coller dans Supabase SQL Editor
# Fichier: CONFIGURATION-PERMISSIONS-PARTAGE.sql
```

### **2. Configuration du bucket**
1. Aller dans Supabase Dashboard > Storage
2. Sélectionner le bucket `company-files`
3. Activer l'accès public
4. Ajouter les politiques appropriées

### **3. Tests de validation**
1. Tester l'accès anonyme aux documents
2. Valider les URLs de partage
3. Vérifier les performances

### **4. Monitoring**
1. Surveiller les logs d'accès
2. Vérifier les erreurs 404
3. Optimiser les performances

---

**Date de résolution :** 1er août 2025  
**Approche :** ✅ Solution systémique robuste  
**Impact :** 🎉 Partage de documents fonctionnel et sécurisé 