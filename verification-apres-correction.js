const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verificationApresCorrection() {
  console.log('🔍 Vérification après correction...\n')

  try {
    // =====================================================
    // 1. VÉRIFICATION DE L'ÉTAT ACTUEL EN BASE
    // =====================================================
    console.log('📋 1. ÉTAT ACTUEL EN BASE DE DONNÉES')
    console.log('=====================================')

    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('name', 'Document_de_Synthese_J00129376059_v1.pdf')

    if (documentsError) {
      console.log('❌ Erreur récupération document:', documentsError.message)
      return
    }

    if (documents.length === 0) {
      console.log('❌ Document non trouvé en base de données')
      return
    }

    const doc = documents[0]
    console.log('✅ Document trouvé en base:')
    console.log(`   - ID: ${doc.id}`)
    console.log(`   - Nom: ${doc.name}`)
    console.log(`   - Chemin actuel: ${doc.file_path}`)
    console.log(`   - Entreprise: ${doc.company_id}`)
    console.log(`   - Public: ${doc.is_public}`)
    console.log(`   - Type: ${doc.document_type}`)
    console.log(`   - Créé le: ${doc.created_at}`)
    console.log(`   - Modifié le: ${doc.updated_at}`)

    // =====================================================
    // 2. SIMULATION DU CHEMIN CONSTRUIT PAR L'APPLICATION
    // =====================================================
    console.log('\n🔧 2. SIMULATION DU CHEMIN DE L\'APPLICATION')
    console.log('=============================================')

    const cheminApp = `documents/${doc.file_path}`
    console.log(`📁 Chemin construit par l'app: ${cheminApp}`)

    // =====================================================
    // 3. VÉRIFICATION DU FICHIER DANS LE STORAGE
    // =====================================================
    console.log('\n📦 3. VÉRIFICATION DU STORAGE')
    console.log('==============================')

    // Tester le chemin construit par l'app
    console.log(`🔍 Test du chemin: ${cheminApp}`)
    const { data: testFile, error: testError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 1000, search: '1754079146251-Document_de_Synthese_J00129376059_v1.pdf' })

    if (testError) {
      console.log('❌ Erreur test storage:', testError.message)
    } else {
      console.log(`📁 ${testFile.length} fichiers trouvés avec ce nom`)
      testFile.forEach(file => {
        console.log(`   - ${file.name}`)
      })
    }

    // =====================================================
    // 4. TEST D'ACCÈS DIRECT AU FICHIER
    // =====================================================
    console.log('\n🎯 4. TEST D\'ACCÈS DIRECT')
    console.log('==========================')

    // Tester l'accès via URL publique
    const { data: publicUrl } = await supabase.storage
      .from('company-files')
      .getPublicUrl(cheminApp)

    console.log(`🔗 URL publique générée: ${publicUrl.publicUrl}`)

    // Tester l'accès à l'URL
    try {
      const response = await fetch(publicUrl.publicUrl, { method: 'HEAD' })
      console.log(`🌐 Accès URL: ${response.ok ? '✅ Succès' : '❌ Échec'} (status: ${response.status})`)
      
      if (!response.ok) {
        console.log(`📄 Réponse complète: ${response.status} ${response.statusText}`)
      }
    } catch (fetchError) {
      console.log(`❌ Erreur test URL: ${fetchError.message}`)
    }

    // =====================================================
    // 5. RECHERCHE DU FICHIER RÉEL
    // =====================================================
    console.log('\n🔍 5. RECHERCHE DU FICHIER RÉEL')
    console.log('================================')

    // Lister tous les fichiers dans le bucket
    const { data: allFiles, error: allFilesError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 1000 })

    if (allFilesError) {
      console.log('❌ Erreur accès storage:', allFilesError.message)
    } else {
      console.log(`📁 ${allFiles.length} fichiers dans le bucket`)
      
      // Chercher le fichier spécifique
      const targetFile = allFiles.find(f => f.name.includes('1754079146251-Document_de_Synthese_J00129376059_v1.pdf'))
      if (targetFile) {
        console.log(`✅ Fichier trouvé: ${targetFile.name}`)
        console.log(`📊 Taille: ${targetFile.metadata?.size || 'inconnue'} bytes`)
        
        // Tester l'accès à ce fichier
        const { data: realPublicUrl } = await supabase.storage
          .from('company-files')
          .getPublicUrl(targetFile.name)
        
        console.log(`🔗 URL réelle: ${realPublicUrl.publicUrl}`)
        
        try {
          const realResponse = await fetch(realPublicUrl.publicUrl, { method: 'HEAD' })
          console.log(`🌐 Accès fichier réel: ${realResponse.ok ? '✅ Succès' : '❌ Échec'} (status: ${realResponse.status})`)
        } catch (realFetchError) {
          console.log(`❌ Erreur accès fichier réel: ${realFetchError.message}`)
        }
      } else {
        console.log('❌ Fichier non trouvé dans le bucket')
      }
    }

    // =====================================================
    // 6. DIAGNOSTIC ET RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 6. DIAGNOSTIC ET RECOMMANDATIONS')
    console.log('=====================================')

    console.log('\n🔍 Diagnostic:')
    console.log(`   - Chemin en base: ${doc.file_path}`)
    console.log(`   - Chemin app: ${cheminApp}`)
    console.log(`   - Fichier existe: ${targetFile ? 'Oui' : 'Non'}`)
    
    if (targetFile) {
      console.log(`   - Chemin réel: ${targetFile.name}`)
      console.log(`   - Correspondance: ${cheminApp === targetFile.name ? '✅ Parfaite' : '❌ Différente'}`)
    }

    console.log('\n🛠️ Recommandations:')
    if (targetFile && cheminApp !== targetFile.name) {
      console.log('1. 🔄 CORRIGER LE CHEMIN EN BASE:')
      console.log(`   - Chemin actuel: ${doc.file_path}`)
      console.log(`   - Chemin nécessaire: ${targetFile.name.replace('documents/', '')}`)
      console.log('   - Mettre à jour file_path dans la base de données')
    } else if (!targetFile) {
      console.log('1. ❌ FICHIER MANQUANT:')
      console.log('   - Le fichier n\'existe pas dans le storage')
      console.log('   - Vérifier l\'upload ou restaurer le fichier')
    } else {
      console.log('1. ✅ TOUT EST CORRECT:')
      console.log('   - Le chemin correspond au fichier')
      console.log('   - Le problème vient d\'ailleurs (permissions, etc.)')
    }

    console.log('\n🎉 Vérification terminée!')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécution du script
verificationApresCorrection() 