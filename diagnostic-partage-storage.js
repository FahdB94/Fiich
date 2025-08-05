const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticPartageStorage() {
  console.log('🔍 Diagnostic des problèmes de partage et stockage...\n')

  try {
    // =====================================================
    // 1. VÉRIFICATION DES DOCUMENTS PARTAGÉS
    // =====================================================
    console.log('📋 1. VÉRIFICATION DES DOCUMENTS PARTAGÉS')
    console.log('==========================================')

    // Récupérer tous les documents
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (documentsError) {
      console.log('❌ Erreur récupération documents:', documentsError.message)
      return
    }

    console.log(`✅ ${documents.length} documents trouvés`)
    
    // Afficher les documents avec leurs détails
    documents.forEach((doc, index) => {
      console.log(`\n📄 Document ${index + 1}:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Nom: ${doc.name}`)
      console.log(`   - Chemin: ${doc.file_path}`)
      console.log(`   - Entreprise: ${doc.company_id}`)
      console.log(`   - Public: ${doc.is_public}`)
      console.log(`   - Type: ${doc.document_type}`)
    })

    // =====================================================
    // 2. VÉRIFICATION DU BUCKET STORAGE
    // =====================================================
    console.log('\n📦 2. VÉRIFICATION DU BUCKET STORAGE')
    console.log('=====================================')

    // Lister les buckets disponibles
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.log('❌ Erreur récupération buckets:', bucketsError.message)
    } else {
      console.log('📦 Buckets disponibles:')
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`)
      })
    }

    // Vérifier le bucket company-files spécifiquement
    const { data: companyFiles, error: companyFilesError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 100 })

    if (companyFilesError) {
      console.log('❌ Erreur accès bucket company-files:', companyFilesError.message)
    } else {
      console.log(`\n📁 Contenu du bucket company-files (${companyFiles.length} éléments):`)
      companyFiles.forEach(file => {
        console.log(`   - ${file.name} (${file.metadata?.size || 'taille inconnue'} bytes)`)
      })
    }

    // =====================================================
    // 3. VÉRIFICATION DES FICHIERS SPÉCIFIQUES
    // =====================================================
    console.log('\n🔍 3. VÉRIFICATION DES FICHIERS SPÉCIFIQUES')
    console.log('============================================')

    // Vérifier chaque document dans le storage
    for (const doc of documents) {
      const filePath = `documents/${doc.file_path}`
      console.log(`\n🔍 Vérification: ${filePath}`)
      
      try {
        // Essayer de récupérer les métadonnées du fichier
        const { data: fileInfo, error: fileError } = await supabase.storage
          .from('company-files')
          .list('documents', { 
            limit: 1000,
            search: doc.file_path.split('/').pop() // Chercher par nom de fichier
          })

        if (fileError) {
          console.log(`   ❌ Erreur accès fichier: ${fileError.message}`)
        } else {
          const foundFile = fileInfo.find(f => f.name === doc.file_path.split('/').pop())
          if (foundFile) {
            console.log(`   ✅ Fichier trouvé: ${foundFile.name}`)
            console.log(`   📊 Taille: ${foundFile.metadata?.size || 'inconnue'} bytes`)
            console.log(`   📅 Modifié: ${foundFile.updated_at}`)
          } else {
            console.log(`   ❌ Fichier non trouvé dans le storage`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Erreur lors de la vérification: ${error.message}`)
      }
    }

    // =====================================================
    // 4. TEST D'ACCÈS PUBLIC AU BUCKET
    // =====================================================
    console.log('\n🌐 4. TEST D\'ACCÈS PUBLIC AU BUCKET')
    console.log('====================================')

    // Créer un client anonyme pour tester l'accès public
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    try {
      const { data: publicFiles, error: publicError } = await anonClient.storage
        .from('company-files')
        .list('documents', { limit: 10 })

      if (publicError) {
        console.log('❌ Erreur accès public bucket:', publicError.message)
        console.log('💡 Le bucket n\'est pas configuré pour l\'accès public')
      } else {
        console.log('✅ Accès public au bucket fonctionne')
        console.log(`📁 ${publicFiles.length} fichiers accessibles publiquement`)
      }
    } catch (error) {
      console.log('❌ Erreur test accès public:', error.message)
    }

    // =====================================================
    // 5. VÉRIFICATION DES URLS PUBLIQUES
    // =====================================================
    console.log('\n🔗 5. VÉRIFICATION DES URLS PUBLIQUES')
    console.log('=====================================')

    // Tester la génération d'URLs publiques pour quelques documents
    for (const doc of documents.slice(0, 3)) {
      const filePath = `documents/${doc.file_path}`
      console.log(`\n🔗 Test URL publique pour: ${filePath}`)
      
      try {
        const { data: publicUrl, error: urlError } = await supabase.storage
          .from('company-files')
          .getPublicUrl(filePath)

        if (urlError) {
          console.log(`   ❌ Erreur génération URL: ${urlError.message}`)
        } else {
          console.log(`   ✅ URL publique: ${publicUrl.publicUrl}`)
          
          // Tester l'accès à l'URL
          try {
            const response = await fetch(publicUrl.publicUrl, { method: 'HEAD' })
            if (response.ok) {
              console.log(`   ✅ URL accessible (status: ${response.status})`)
            } else {
              console.log(`   ❌ URL non accessible (status: ${response.status})`)
            }
          } catch (fetchError) {
            console.log(`   ❌ Erreur test URL: ${fetchError.message}`)
          }
        }
      } catch (error) {
        console.log(`   ❌ Erreur lors du test URL: ${error.message}`)
      }
    }

    // =====================================================
    // 6. RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 6. RECOMMANDATIONS')
    console.log('=====================')

    console.log('\n🛠️  Solutions pour résoudre l\'erreur "StorageApiError: Object not found":')
    console.log('')
    console.log('1. 🔧 CONFIGURER LE BUCKET POUR L\'ACCÈS PUBLIC:')
    console.log('   - Aller dans Supabase Dashboard > Storage')
    console.log('   - Sélectionner le bucket "company-files"')
    console.log('   - Activer "Public bucket"')
    console.log('   - Ajouter des politiques RLS pour le bucket')
    console.log('')
    console.log('2. 📝 AJOUTER DES POLITIQUES RLS AU BUCKET:')
    console.log('   - Politique pour les fichiers publics')
    console.log('   - Politique pour les fichiers partagés')
    console.log('   - Politique pour les membres d\'entreprise')
    console.log('')
    console.log('3. 🔄 VÉRIFIER LA COHÉRENCE BASE/STORAGE:')
    console.log('   - S\'assurer que tous les fichiers en base existent en storage')
    console.log('   - Nettoyer les entrées orphelines')
    console.log('')
    console.log('4. 🌐 UTILISER DES URLS PUBLIQUES:')
    console.log('   - Utiliser getPublicUrl() au lieu de createSignedUrl()')
    console.log('   - Ou configurer des URLs signées avec expiration')
    console.log('')
    console.log('5. 🧪 TESTER L\'ACCÈS ANONYME:')
    console.log('   - Vérifier que les fichiers publics sont accessibles sans authentification')

    console.log('\n🎉 Diagnostic terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécution du script
diagnosticPartageStorage() 