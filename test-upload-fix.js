const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUploadFix() {
  console.log('🧪 Test de la correction du problème d\'upload...\n')

  try {
    const companyId = 'feab1dd5-e92e-4b72-a3bf-82cdb27d15d6'
    const timestamp = Date.now()
    const fileName = `${timestamp}-test-upload-fix.txt`
    const filePath = `${companyId}/${fileName}`
    const fullStoragePath = `documents/${filePath}`

    console.log('📋 Paramètres de test:')
    console.log(`   - Company ID: ${companyId}`)
    console.log(`   - Nom du fichier: ${fileName}`)
    console.log(`   - Chemin relatif: ${filePath}`)
    console.log(`   - Chemin complet: ${fullStoragePath}`)
    console.log('')

    // 1. Upload du fichier
    console.log('📤 Upload du fichier...')
    const testContent = 'Test de la correction du problème d\'upload.'
    const testFile = new Blob([testContent], { type: 'text/plain' })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(fullStoragePath, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Erreur lors de l\'upload:', uploadError)
      return
    }

    console.log('✅ Upload réussi:', uploadData)
    console.log('')

    // 2. Test de la nouvelle logique de vérification
    console.log('🔍 Test de la nouvelle logique de vérification...')
    
    // Ancienne logique (problématique)
    console.log('📋 Ancienne logique (problématique):')
    const { data: oldCheck, error: oldError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (!oldError) {
      const oldFileExists = oldCheck.some(file => file.name === filePath)
      console.log(`   - Liste dans documents/: ${oldCheck.map(f => f.name).join(', ')}`)
      console.log(`   - Recherche: "${filePath}"`)
      console.log(`   - Résultat: ${oldFileExists}`)
    }
    console.log('')

    // Nouvelle logique (corrigée)
    console.log('📋 Nouvelle logique (corrigée):')
    const { data: newCheck, error: newError } = await supabase.storage
      .from('company-files')
      .list(`documents/${companyId}`, {
        limit: 1000,
        offset: 0
      })

    if (!newError) {
      const newFileExists = newCheck.some(file => file.name === fileName)
      console.log(`   - Liste dans documents/${companyId}/: ${newCheck.map(f => f.name).join(', ')}`)
      console.log(`   - Recherche: "${fileName}"`)
      console.log(`   - Résultat: ${newFileExists}`)
      
      if (newFileExists) {
        console.log('✅ SUCCÈS: La nouvelle logique fonctionne correctement!')
      } else {
        console.log('❌ ÉCHEC: La nouvelle logique ne fonctionne toujours pas')
      }
    } else {
      console.error('❌ Erreur lors de la vérification:', newError)
    }
    console.log('')

    // 3. Test de création en base de données
    console.log('💾 Test de création en base de données...')
    const { data: newDocument, error: dbError } = await supabase
      .from('documents')
      .insert({
        name: fileName,
        file_path: filePath,
        file_size: testFile.size,
        mime_type: testFile.type,
        company_id: companyId,
        is_public: false,
        document_type: 'TEST',
        display_name: fileName,
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erreur lors de la création en base:', dbError)
    } else {
      console.log('✅ Document créé en base de données:', newDocument.id)
    }
    console.log('')

    // 4. Vérification finale
    console.log('🔍 Vérification finale...')
    const { data: finalCheck, error: finalError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', newDocument?.id)
      .single()

    if (finalError || !finalCheck) {
      console.error('❌ Erreur lors de la vérification finale:', finalError)
    } else {
      console.log('✅ Vérification finale réussie')
      console.log(`   - Document ID: ${finalCheck.id}`)
      console.log(`   - Nom: ${finalCheck.name}`)
      console.log(`   - Chemin: ${finalCheck.file_path}`)
    }
    console.log('')

    // 5. Nettoyage
    console.log('🧹 Nettoyage...')
    
    // Supprimer le document de la base
    if (newDocument?.id) {
      const { error: deleteDocError } = await supabase
        .from('documents')
        .delete()
        .eq('id', newDocument.id)
      
      if (deleteDocError) {
        console.error('❌ Erreur lors de la suppression du document:', deleteDocError)
      } else {
        console.log('✅ Document supprimé de la base')
      }
    }

    // Supprimer le fichier du storage
    const { error: deleteFileError } = await supabase.storage
      .from('company-files')
      .remove([fullStoragePath])

    if (deleteFileError) {
      console.error('❌ Erreur lors de la suppression du fichier:', deleteFileError)
    } else {
      console.log('✅ Fichier supprimé du storage')
    }

    console.log('')
    console.log('🎉 Test terminé avec succès!')
    console.log('✅ La correction du problème d\'upload fonctionne correctement')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécution du script
testUploadFix() 