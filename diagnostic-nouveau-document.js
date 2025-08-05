const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticNouveauDocument() {
  console.log('🔍 Diagnostic du nouveau document...\n')

  try {
    // =====================================================
    // 1. VÉRIFICATION DES DOCUMENTS EN BASE
    // =====================================================
    console.log('📋 1. VÉRIFICATION DES DOCUMENTS EN BASE')
    console.log('==========================================')

    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.log('❌ Erreur récupération documents:', documentsError.message)
      return
    }

    console.log(`✅ ${documents.length} documents trouvés en base de données`)
    
    documents.forEach((doc, index) => {
      console.log(`\n📄 Document ${index + 1}:`)
      console.log(`   - ID: ${doc.id}`)
      console.log(`   - Nom: ${doc.name}`)
      console.log(`   - Chemin: ${doc.file_path}`)
      console.log(`   - Entreprise: ${doc.company_id}`)
      console.log(`   - Public: ${doc.is_public}`)
      console.log(`   - Type: ${doc.document_type}`)
      console.log(`   - Créé le: ${doc.created_at}`)
    })

    // =====================================================
    // 2. VÉRIFICATION DU STORAGE
    // =====================================================
    console.log('\n📦 2. VÉRIFICATION DU STORAGE')
    console.log('=====================================')

    // Lister tous les fichiers dans le bucket
    const { data: allFiles, error: allFilesError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 1000 })

    if (allFilesError) {
      console.log('❌ Erreur accès storage:', allFilesError.message)
    } else {
      console.log(`📁 ${allFiles.length} fichiers trouvés dans le storage`)
      
      allFiles.forEach(file => {
        console.log(`   - ${file.name} (${file.metadata?.size || 'taille inconnue'} bytes)`)
      })
    }

    // =====================================================
    // 3. VÉRIFICATION SPÉCIFIQUE DU FICHIER
    // =====================================================
    console.log('\n🎯 3. VÉRIFICATION SPÉCIFIQUE DU FICHIER')
    console.log('==========================================')

    const targetFileName = '1754079146251-Document_de_Synthese_J00129376059_v1.pdf'
    console.log(`🔍 Recherche du fichier: ${targetFileName}`)

    // Chercher dans le dossier documents
    const { data: docFiles, error: docFilesError } = await supabase.storage
      .from('company-files')
      .list('documents', { limit: 1000 })

    if (docFilesError) {
      console.log('❌ Erreur accès dossier documents:', docFilesError.message)
    } else {
      console.log(`📁 ${docFiles.length} fichiers dans le dossier documents`)
      
      // Chercher le fichier spécifique
      const foundFile = docFiles.find(f => f.name.includes(targetFileName))
      if (foundFile) {
        console.log(`✅ Fichier trouvé: ${foundFile.name}`)
        console.log(`📊 Taille: ${foundFile.metadata?.size || 'inconnue'} bytes`)
        
        // Tester l'accès via URL publique
        const { data: publicUrl } = await supabase.storage
          .from('company-files')
          .getPublicUrl(foundFile.name)
        
        console.log(`🔗 URL publique: ${publicUrl.publicUrl}`)
        
        // Tester l'accès à l'URL
        try {
          const response = await fetch(publicUrl.publicUrl, { method: 'HEAD' })
          console.log(`🌐 Accès URL: ${response.ok ? '✅ Succès' : '❌ Échec'} (status: ${response.status})`)
        } catch (fetchError) {
          console.log(`❌ Erreur test URL: ${fetchError.message}`)
        }
      } else {
        console.log('❌ Fichier non trouvé dans le dossier documents')
        
        // Chercher dans tous les sous-dossiers
        console.log('🔍 Recherche dans tous les sous-dossiers...')
        for (const file of allFiles) {
          if (file.name.includes(targetFileName)) {
            console.log(`✅ Fichier trouvé: ${file.name}`)
            break
          }
        }
      }
    }

    // =====================================================
    // 4. COMPARAISON BASE/STORAGE
    // =====================================================
    console.log('\n🔍 4. COMPARAISON BASE/STORAGE')
    console.log('=====================================')

    if (documents.length > 0) {
      const doc = documents[0] // Prendre le plus récent
      const expectedPath = `documents/${doc.file_path}`
      
      console.log(`📄 Document en base: ${doc.name}`)
      console.log(`📁 Chemin attendu: ${expectedPath}`)
      
      // Chercher le fichier correspondant
      const matchingFile = allFiles.find(f => f.name === expectedPath)
      if (matchingFile) {
        console.log(`✅ Fichier trouvé en storage: ${matchingFile.name}`)
      } else {
        console.log(`❌ Fichier non trouvé en storage`)
        console.log(`🔍 Recherche de fichiers similaires...`)
        
        // Chercher des fichiers avec un nom similaire
        const similarFiles = allFiles.filter(f => 
          f.name.includes(doc.name) || 
          f.name.includes(targetFileName)
        )
        
        if (similarFiles.length > 0) {
          console.log(`📋 Fichiers similaires trouvés:`)
          similarFiles.forEach(file => {
            console.log(`   - ${file.name}`)
          })
        } else {
          console.log(`❌ Aucun fichier similaire trouvé`)
        }
      }
    }

    // =====================================================
    // 5. RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 5. RECOMMANDATIONS')
    console.log('=====================')

    console.log('\n🛠️  Solutions possibles:')
    console.log('')
    console.log('1. 🔄 CORRIGER LE CHEMIN EN BASE:')
    console.log('   - Si le fichier existe mais avec un chemin différent')
    console.log('   - Mettre à jour file_path dans la base de données')
    console.log('')
    console.log('2. 📝 VÉRIFIER LE PROCESSUS D\'UPLOAD:')
    console.log('   - S\'assurer que le chemin est correctement enregistré')
    console.log('   - Vérifier la logique de génération du file_path')
    console.log('')
    console.log('3. 🔍 ANALYSER LES DIFFÉRENCES:')
    console.log('   - Comparer le nom en base avec le nom réel en storage')
    console.log('   - Identifier pourquoi ils sont différents')

    console.log('\n🎉 Diagnostic terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécution du script
diagnosticNouveauDocument() 