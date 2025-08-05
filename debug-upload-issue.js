const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugUploadIssue() {
  console.log('🔍 Diagnostic du problème d\'upload...\n')

  try {
    // 1. Vérifier la structure du bucket
    console.log('📁 Vérification de la structure du bucket...')
    const { data: bucketStructure, error: bucketError } = await supabase.storage
      .from('company-files')
      .list('', {
        limit: 1000,
        offset: 0
      })

    if (bucketError) {
      console.error('❌ Erreur lors de la vérification du bucket:', bucketError)
      return
    }

    console.log('✅ Structure du bucket:')
    bucketStructure.forEach(item => {
      console.log(`   - ${item.name} (${item.metadata?.size || 0} bytes)`)
    })
    console.log('')

    // 2. Vérifier le dossier documents
    console.log('📄 Vérification du dossier documents...')
    const { data: documentsFolder, error: docsError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (docsError) {
      console.error('❌ Erreur lors de la vérification du dossier documents:', docsError)
      return
    }

    console.log(`✅ ${documentsFolder.length} éléments dans le dossier documents:`)
    documentsFolder.forEach(item => {
      console.log(`   - ${item.name} (${item.metadata?.size || 0} bytes)`)
    })
    console.log('')

    // 3. Vérifier l'entreprise spécifique
    const companyId = 'feab1dd5-e92e-4b72-a3bf-82cdb27d15d6'
    console.log(`🏢 Vérification de l'entreprise ${companyId}...`)
    
    const { data: companyFolder, error: companyError } = await supabase.storage
      .from('company-files')
      .list(`documents/${companyId}`, {
        limit: 1000,
        offset: 0
      })

    if (companyError) {
      console.log('ℹ️  Dossier entreprise non trouvé ou vide')
    } else {
      console.log(`✅ ${companyFolder.length} fichiers dans le dossier entreprise:`)
      companyFolder.forEach(item => {
        console.log(`   - ${item.name} (${item.metadata?.size || 0} bytes)`)
      })
    }
    console.log('')

    // 4. Simuler le processus d'upload pour identifier le problème
    console.log('🧪 Simulation du processus d\'upload...')
    
    const timestamp = Date.now()
    const testFileName = `${timestamp}-test-file.txt`
    const filePath = `${companyId}/${testFileName}`
    const fullStoragePath = `documents/${filePath}`

    console.log('📋 Paramètres de test:')
    console.log(`   - Nom du fichier: ${testFileName}`)
    console.log(`   - Chemin relatif: ${filePath}`)
    console.log(`   - Chemin complet: ${fullStoragePath}`)
    console.log('')

    // 5. Créer un fichier de test
    const testContent = 'Ceci est un fichier de test pour diagnostiquer le problème d\'upload.'
    const testFile = new Blob([testContent], { type: 'text/plain' })

    console.log('📤 Upload du fichier de test...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(fullStoragePath, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Erreur lors de l\'upload de test:', uploadError)
      return
    }

    console.log('✅ Upload de test réussi:', uploadData)
    console.log('')

    // 6. Vérifier l'existence avec la même logique que le code
    console.log('🔍 Vérification avec la logique du code...')
    const { data: fileCheck, error: checkError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError)
      return
    }

    console.log('📋 Fichiers trouvés dans documents/:')
    fileCheck.forEach(file => {
      console.log(`   - ${file.name}`)
    })
    console.log('')

    // 7. Test de la logique de comparaison
    console.log('🔍 Test de la logique de comparaison...')
    console.log(`   - filePath recherché: "${filePath}"`)
    
    const fileExists = fileCheck.some(file => file.name === filePath)
    console.log(`   - Résultat de la comparaison: ${fileExists}`)
    
    if (!fileExists) {
      console.log('❌ PROBLÈME IDENTIFIÉ: La logique de comparaison est incorrecte!')
      console.log('')
      console.log('🔍 Analyse du problème:')
      console.log('   - Le code compare file.name === filePath')
      console.log('   - Mais file.name contient le chemin complet')
      console.log('   - Et filePath ne contient que le chemin relatif')
      console.log('')
      console.log('📋 Exemples de comparaisons:')
      fileCheck.forEach(file => {
        const matches = file.name === filePath
        console.log(`   - "${file.name}" === "${filePath}" = ${matches}`)
      })
    } else {
      console.log('✅ La logique de comparaison fonctionne correctement')
    }

    // 8. Nettoyer le fichier de test
    console.log('')
    console.log('🧹 Nettoyage du fichier de test...')
    const { error: deleteError } = await supabase.storage
      .from('company-files')
      .remove([fullStoragePath])

    if (deleteError) {
      console.error('❌ Erreur lors du nettoyage:', deleteError)
    } else {
      console.log('✅ Fichier de test supprimé')
    }

    // 9. Recommandations
    console.log('')
    console.log('📋 Recommandations pour corriger le problème:')
    console.log('')
    console.log('1. 🔧 Corriger la logique de comparaison:')
    console.log('   - Utiliser file.name === filePath au lieu de la comparaison actuelle')
    console.log('   - Ou extraire le nom du fichier du chemin complet')
    console.log('')
    console.log('2. 🧪 Ajouter des logs détaillés:')
    console.log('   - Logger les valeurs exactes de file.name et filePath')
    console.log('   - Logger le résultat de chaque comparaison')
    console.log('')
    console.log('3. 🛡️ Améliorer la robustesse:')
    console.log('   - Utiliser une fonction de normalisation des chemins')
    console.log('   - Gérer les cas edge (chemins vides, caractères spéciaux)')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécution du script
debugUploadIssue() 