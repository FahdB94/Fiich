const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verificationEtatActuel() {
  console.log('🔍 Vérification de l\'état actuel après nettoyage...\n')

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
    
    if (documents.length === 0) {
      console.log('ℹ️  Aucun document en base de données - le nettoyage a été efficace')
    } else {
      documents.forEach((doc, index) => {
        console.log(`\n📄 Document ${index + 1}:`)
        console.log(`   - ID: ${doc.id}`)
        console.log(`   - Nom: ${doc.name}`)
        console.log(`   - Chemin: ${doc.file_path}`)
        console.log(`   - Entreprise: ${doc.company_id}`)
        console.log(`   - Public: ${doc.is_public}`)
        console.log(`   - Type: ${doc.document_type}`)
      })
    }

    // =====================================================
    // 2. VÉRIFICATION DU STORAGE
    // =====================================================
    console.log('\n📦 2. VÉRIFICATION DU STORAGE')
    console.log('=====================================')

    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 1000 })

    if (storageError) {
      console.log('❌ Erreur accès storage:', storageError.message)
    } else {
      console.log(`📁 ${storageFiles.length} fichiers trouvés dans le storage`)
      
      if (storageFiles.length === 0) {
        console.log('ℹ️  Aucun fichier dans le storage - tous les fichiers ont été supprimés')
      } else {
        console.log('📋 Fichiers dans le storage:')
        storageFiles.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'taille inconnue'} bytes)`)
        })
      }
    }

    // =====================================================
    // 3. VÉRIFICATION DE LA COHÉRENCE
    // =====================================================
    console.log('\n🔍 3. VÉRIFICATION DE LA COHÉRENCE')
    console.log('=====================================')

    if (documents.length > 0 && storageFiles.length > 0) {
      console.log('🔍 Vérification de la cohérence base/storage...')
      
      for (const doc of documents) {
        const filePath = `documents/${doc.file_path}`
        const fileExists = storageFiles.some(file => file.name === filePath)
        
        console.log(`\n📄 Document: ${doc.name}`)
        console.log(`   - Chemin attendu: ${filePath}`)
        console.log(`   - Existe en storage: ${fileExists ? '✅ Oui' : '❌ Non'}`)
        
        if (!fileExists) {
          console.log(`   ⚠️  INCOHÉRENCE: Document en base mais fichier manquant en storage`)
        }
      }
    } else if (documents.length === 0 && storageFiles.length === 0) {
      console.log('✅ Cohérence parfaite: Aucun document en base, aucun fichier en storage')
    } else if (documents.length === 0) {
      console.log('⚠️  Fichiers orphelins en storage (pas de documents en base)')
    } else {
      console.log('⚠️  Documents orphelins en base (pas de fichiers en storage)')
    }

    // =====================================================
    // 4. TEST D'ACCÈS AU FICHIER SPÉCIFIQUE
    // =====================================================
    console.log('\n🎯 4. TEST D\'ACCÈS AU FICHIER SPÉCIFIQUE')
    console.log('==========================================')

    const testFileName = '1754075186719-Document_de_Synthese_J00129376059_v1.pdf'
    console.log(`🔍 Test d'accès au fichier: ${testFileName}`)
    
    // Chercher le fichier dans le storage
    const { data: testFile, error: testError } = await supabase.storage
      .from('company-files')
      .list('documents', { 
        limit: 1000,
        search: testFileName
      })

    if (testError) {
      console.log('❌ Erreur recherche fichier:', testError.message)
    } else {
      const foundFile = testFile.find(f => f.name.includes(testFileName))
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
        console.log('❌ Fichier non trouvé dans le storage')
      }
    }

    // =====================================================
    // 5. RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 5. RECOMMANDATIONS')
    console.log('=====================')

    if (documents.length === 0) {
      console.log('\n🎉 EXCELLENT! Le nettoyage a été efficace.')
      console.log('✅ Aucun document orphelin en base de données')
      console.log('✅ L\'erreur "Object not found" ne devrait plus apparaître')
      console.log('')
      console.log('🔄 PROCHAINES ÉTAPES:')
      console.log('1. Tester l\'upload de nouveaux documents')
      console.log('2. Vérifier que le partage fonctionne correctement')
      console.log('3. Configurer des sauvegardes régulières')
    } else {
      console.log('\n⚠️  ATTENTION: Il reste des documents en base.')
      console.log('🔍 Vérifiez si ces documents ont des fichiers correspondants en storage.')
      console.log('')
      console.log('🛠️  SOLUTIONS:')
      console.log('1. Si les fichiers existent: Vérifier les chemins')
      console.log('2. Si les fichiers n\'existent pas: Supprimer les entrées orphelines')
      console.log('3. Recharger les fichiers manquants si nécessaire')
    }

    console.log('\n🎉 Vérification terminée!')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécution du script
verificationEtatActuel() 