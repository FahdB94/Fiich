const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticStorageFiles() {
  console.log('🔍 Diagnostic des fichiers de stockage...\n')

  try {
    // 1. Récupérer tous les documents de la base de données
    console.log('📋 Récupération des documents de la base de données...')
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('❌ Erreur lors de la récupération des documents:', dbError)
      return
    }

    console.log(`✅ ${documents.length} documents trouvés dans la base de données\n`)

    // 2. Lister tous les fichiers dans le bucket
    console.log('📁 Récupération des fichiers du bucket storage...')
    const { data: files, error: storageError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (storageError) {
      console.error('❌ Erreur lors de la récupération des fichiers:', storageError)
      return
    }

    console.log(`✅ ${files.length} fichiers trouvés dans le bucket\n`)

    // 3. Analyser les correspondances
    console.log('🔍 Analyse des correspondances...\n')

    const dbFilePaths = documents.map(doc => `documents/${doc.file_path}`)
    const storageFilePaths = files.map(file => `documents/${file.name}`)

    console.log('📊 Statistiques:')
    console.log(`   - Documents en base: ${dbFilePaths.length}`)
    console.log(`   - Fichiers en storage: ${storageFilePaths.length}`)

    // Fichiers en base mais pas en storage
    const missingInStorage = dbFilePaths.filter(dbPath => 
      !storageFilePaths.includes(dbPath)
    )

    // Fichiers en storage mais pas en base
    const orphanedInStorage = storageFilePaths.filter(storagePath => 
      !dbFilePaths.includes(storagePath)
    )

    console.log(`   - Fichiers manquants en storage: ${missingInStorage.length}`)
    console.log(`   - Fichiers orphelins en storage: ${orphanedInStorage.length}\n`)

    // 4. Afficher les détails des fichiers manquants
    if (missingInStorage.length > 0) {
      console.log('❌ Fichiers manquants en storage:')
      missingInStorage.forEach((filePath, index) => {
        const doc = documents.find(doc => `documents/${doc.file_path}` === filePath)
        console.log(`   ${index + 1}. ${filePath}`)
        console.log(`      - ID: ${doc?.id}`)
        console.log(`      - Nom: ${doc?.name}`)
        console.log(`      - Créé: ${doc?.created_at}`)
        console.log(`      - Taille: ${doc?.file_size} bytes`)
        console.log('')
      })
    }

    // 5. Afficher les fichiers orphelins
    if (orphanedInStorage.length > 0) {
      console.log('⚠️  Fichiers orphelins en storage:')
      orphanedInStorage.forEach((filePath, index) => {
        console.log(`   ${index + 1}. ${filePath}`)
      })
      console.log('')
    }

    // 6. Vérifier le fichier spécifique mentionné dans l'erreur
    const specificFile = '1754059702600-Document_de_Synthese_J00129376059_v1.pdf'
    console.log(`🔍 Vérification du fichier spécifique: ${specificFile}`)
    
    const specificDoc = documents.find(doc => doc.file_path.includes(specificFile))
    if (specificDoc) {
      console.log(`   - Trouvé en base de données: ✅`)
      console.log(`   - ID: ${specificDoc.id}`)
      console.log(`   - Chemin: ${specificDoc.file_path}`)
      
      const fullPath = `documents/${specificDoc.file_path}`
      const existsInStorage = storageFilePaths.includes(fullPath)
      console.log(`   - Existe en storage: ${existsInStorage ? '✅' : '❌'}`)
      
      if (!existsInStorage) {
        console.log('   - ACTION REQUISE: Ce fichier doit être supprimé de la base de données')
      }
    } else {
      console.log(`   - Non trouvé en base de données: ✅ (déjà nettoyé)`)
    }

    console.log('\n📋 Recommandations:')
    if (missingInStorage.length > 0) {
      console.log('1. Supprimer les entrées de la base de données pour les fichiers manquants')
      console.log('2. Vérifier les logs d\'upload pour comprendre pourquoi les fichiers sont manquants')
    }
    if (orphanedInStorage.length > 0) {
      console.log('3. Nettoyer les fichiers orphelins du storage si nécessaire')
    }
    if (missingInStorage.length === 0 && orphanedInStorage.length === 0) {
      console.log('✅ Aucune action requise - tout est cohérent')
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Fonction pour nettoyer les entrées de base de données pour les fichiers manquants
async function cleanMissingFiles() {
  console.log('🧹 Nettoyage des entrées de base de données pour les fichiers manquants...\n')

  try {
    // Récupérer tous les documents
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('*')

    if (dbError) {
      console.error('❌ Erreur lors de la récupération des documents:', dbError)
      return
    }

    // Lister tous les fichiers dans le bucket
    const { data: files, error: storageError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (storageError) {
      console.error('❌ Erreur lors de la récupération des fichiers:', storageError)
      return
    }

    const storageFilePaths = files.map(file => `documents/${file.name}`)
    const missingInStorage = documents.filter(doc => 
      !storageFilePaths.includes(`documents/${doc.file_path}`)
    )

    if (missingInStorage.length === 0) {
      console.log('✅ Aucun fichier manquant à nettoyer')
      return
    }

    console.log(`🗑️  Suppression de ${missingInStorage.length} entrées de base de données...`)

    for (const doc of missingInStorage) {
      console.log(`   - Suppression: ${doc.file_path}`)
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (deleteError) {
        console.error(`   ❌ Erreur lors de la suppression de ${doc.file_path}:`, deleteError)
      } else {
        console.log(`   ✅ Supprimé: ${doc.file_path}`)
      }
    }

    console.log('\n✅ Nettoyage terminé')

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  }
}

// Exécution du script
const args = process.argv.slice(2)
if (args.includes('--clean')) {
  cleanMissingFiles()
} else {
  diagnosticStorageFiles()
} 