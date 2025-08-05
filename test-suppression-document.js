const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSuppressionDocument() {
  console.log('🧪 Test de suppression de document...\n')

  try {
    // =====================================================
    // 1. VÉRIFICATION DE L'ÉTAT INITIAL
    // =====================================================
    console.log('📋 1. ÉTAT INITIAL')
    console.log('==================')

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
    console.log(`   - Chemin: ${doc.file_path}`)
    console.log(`   - Entreprise: ${doc.company_id}`)

    // =====================================================
    // 2. VÉRIFICATION DU FICHIER EN STORAGE
    // =====================================================
    console.log('\n📦 2. VÉRIFICATION DU STORAGE')
    console.log('==============================')

    const fullPath = `documents/${doc.file_path}`
    console.log(`📁 Chemin complet: ${fullPath}`)

    // Vérifier si le fichier existe en storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 1000, search: '1754079146251-Document_de_Synthese_J00129376059_v1.pdf' })

    if (storageError) {
      console.log('❌ Erreur accès storage:', storageError.message)
    } else {
      const targetFile = storageFiles.find(f => f.name.includes('1754079146251-Document_de_Synthese_J00129376059_v1.pdf'))
      if (targetFile) {
        console.log(`✅ Fichier trouvé en storage: ${targetFile.name}`)
        console.log(`📊 Taille: ${targetFile.metadata?.size || 'inconnue'} bytes`)
      } else {
        console.log('❌ Fichier non trouvé en storage')
      }
    }

    // =====================================================
    // 3. SIMULATION DE LA SUPPRESSION
    // =====================================================
    console.log('\n🗑️ 3. SIMULATION DE LA SUPPRESSION')
    console.log('====================================')

    console.log('⚠️  ATTENTION: Ce test va réellement supprimer le document!')
    console.log('   - Le fichier sera supprimé du storage')
    console.log('   - L\'entrée sera supprimée de la base de données')
    console.log('   - Cette action est irréversible!')
    
    // Demander confirmation
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise((resolve) => {
      rl.question('\nVoulez-vous continuer? (oui/non): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'oui') {
      console.log('❌ Test annulé')
      return
    }

    // =====================================================
    // 4. SUPPRESSION DU FICHIER DU STORAGE
    // =====================================================
    console.log('\n📦 4. SUPPRESSION DU STORAGE')
    console.log('=============================')

    console.log(`🗑️ Suppression du fichier: ${fullPath}`)
    const { error: storageDeleteError } = await supabase.storage
      .from('company-files')
      .remove([fullPath])

    if (storageDeleteError) {
      console.log('❌ Erreur suppression storage:', storageDeleteError.message)
      if (storageDeleteError.message?.includes('Object not found')) {
        console.log('⚠️ Fichier non trouvé en storage, continuation...')
      } else {
        console.log('❌ Arrêt du test')
        return
      }
    } else {
      console.log('✅ Fichier supprimé du storage')
    }

    // =====================================================
    // 5. SUPPRESSION DE L'ENTRÉE EN BASE
    // =====================================================
    console.log('\n🗄️ 5. SUPPRESSION DE LA BASE')
    console.log('=============================')

    console.log(`🗑️ Suppression de l'entrée: ${doc.id}`)
    const { error: dbDeleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id)

    if (dbDeleteError) {
      console.log('❌ Erreur suppression base:', dbDeleteError.message)
      console.log('❌ Test échoué')
      return
    } else {
      console.log('✅ Entrée supprimée de la base de données')
    }

    // =====================================================
    // 6. VÉRIFICATION FINALE
    // =====================================================
    console.log('\n✅ 6. VÉRIFICATION FINALE')
    console.log('==========================')

    // Vérifier que le document n'existe plus en base
    const { data: finalCheck, error: finalCheckError } = await supabase
      .from('documents')
      .select('*')
      .eq('name', 'Document_de_Synthese_J00129376059_v1.pdf')

    if (finalCheckError) {
      console.log('❌ Erreur vérification finale:', finalCheckError.message)
    } else if (finalCheck.length === 0) {
      console.log('✅ Document supprimé de la base de données')
    } else {
      console.log('❌ Document toujours présent en base')
    }

    // Vérifier que le fichier n'existe plus en storage
    const { data: finalStorageCheck, error: finalStorageCheckError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 1000, search: '1754079146251-Document_de_Synthese_J00129376059_v1.pdf' })

    if (finalStorageCheckError) {
      console.log('❌ Erreur vérification storage finale:', finalStorageCheckError.message)
    } else {
      const remainingFile = finalStorageCheck.find(f => f.name.includes('1754079146251-Document_de_Synthese_J00129376059_v1.pdf'))
      if (!remainingFile) {
        console.log('✅ Fichier supprimé du storage')
      } else {
        console.log(`❌ Fichier toujours présent en storage: ${remainingFile.name}`)
      }
    }

    console.log('\n🎉 Test de suppression terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécution du script
testSuppressionDocument() 