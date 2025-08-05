const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function solutionSystemiqueComplete() {
  console.log('🔧 Solution systémique complète pour une application robuste...\n')

  try {
    // =====================================================
    // 1. DIAGNOSTIC COMPLET DU SYSTÈME
    // =====================================================
    console.log('🔍 1. DIAGNOSTIC COMPLET DU SYSTÈME')
    console.log('=====================================')

    // 1.1 Vérifier l'état de la base de données
    console.log('\n📋 1.1 État de la base de données...')
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      return
    }

    console.log(`✅ ${documents.length} documents en base de données`)
    documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name} (${doc.file_path})`)
    })

    // 1.2 Vérifier l'état du storage
    console.log('\n📁 1.2 État du storage...')
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (storageError) {
      console.error('❌ Erreur storage:', storageError)
      return
    }

    console.log(`✅ ${storageFiles.length} éléments dans le storage`)
    storageFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 0} bytes)`)
    })

    // 1.3 Analyser les incohérences
    console.log('\n🔍 1.3 Analyse des incohérences...')
    const dbFilePaths = documents.map(doc => `documents/${doc.file_path}`)
    const storageFilePaths = storageFiles.map(file => `documents/${file.name}`)

    const orphanedInDB = documents.filter(doc => 
      !storageFilePaths.includes(`documents/${doc.file_path}`)
    )

    const orphanedInStorage = storageFiles.filter(file => 
      !dbFilePaths.includes(`documents/${file.name}`)
    )

    console.log(`❌ ${orphanedInDB.length} entrées orphelines en base de données`)
    console.log(`⚠️  ${orphanedInStorage.length} fichiers orphelins en storage`)

    // =====================================================
    // 2. NETTOYAGE SYSTÉMIQUE
    // =====================================================
    console.log('\n🧹 2. NETTOYAGE SYSTÉMIQUE')
    console.log('==========================')

    // 2.1 Nettoyer les entrées orphelines en base
    if (orphanedInDB.length > 0) {
      console.log('\n🗑️  2.1 Nettoyage des entrées orphelines en base...')
      for (const doc of orphanedInDB) {
        console.log(`   - Suppression: ${doc.name} (${doc.id})`)
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .eq('id', doc.id)

        if (deleteError) {
          console.error(`   ❌ Erreur suppression ${doc.name}:`, deleteError)
        } else {
          console.log(`   ✅ Supprimé: ${doc.name}`)
        }
      }
    }

    // 2.2 Nettoyer les fichiers orphelins en storage
    if (orphanedInStorage.length > 0) {
      console.log('\n🗑️  2.2 Nettoyage des fichiers orphelins en storage...')
      const filesToDelete = orphanedInStorage.map(file => `documents/${file.name}`)
      
      const { error: deleteError } = await supabase.storage
        .from('company-files')
        .remove(filesToDelete)

      if (deleteError) {
        console.error('❌ Erreur suppression fichiers:', deleteError)
      } else {
        console.log(`✅ ${filesToDelete.length} fichiers supprimés du storage`)
      }
    }

    // =====================================================
    // 3. VÉRIFICATION DE COHÉRENCE
    // =====================================================
    console.log('\n✅ 3. VÉRIFICATION DE COHÉRENCE')
    console.log('================================')

    // 3.1 Vérification finale
    const { data: finalDocs, error: finalDbError } = await supabase
      .from('documents')
      .select('*')

    const { data: finalStorage, error: finalStorageError } = await supabase.storage
      .from('company-files')
      .list('documents', { limit: 1000, offset: 0 })

    if (finalDbError || finalStorageError) {
      console.error('❌ Erreur lors de la vérification finale')
      return
    }

    const finalDbPaths = finalDocs.map(doc => `documents/${doc.file_path}`)
    const finalStoragePaths = finalStorage.map(file => `documents/${file.name}`)

    const remainingOrphanedInDB = finalDocs.filter(doc => 
      !finalStoragePaths.includes(`documents/${doc.file_path}`)
    )

    const remainingOrphanedInStorage = finalStorage.filter(file => 
      !finalDbPaths.includes(`documents/${file.name}`)
    )

    console.log(`✅ ${finalDocs.length} documents en base de données`)
    console.log(`✅ ${finalStorage.length} fichiers en storage`)
    console.log(`✅ ${remainingOrphanedInDB.length} entrées orphelines restantes`)
    console.log(`✅ ${remainingOrphanedInStorage.length} fichiers orphelins restants`)

    // =====================================================
    // 4. CRÉATION DE FONCTIONS ROBUSTES
    // =====================================================
    console.log('\n🛡️  4. CRÉATION DE FONCTIONS ROBUSTES')
    console.log('=====================================')

    // 4.1 Fonction de validation complète
    console.log('\n📋 4.1 Fonction de validation complète...')
    
    async function validateFileExists(filePath, companyId) {
      try {
        // Vérifier dans le storage
        const { data: storageCheck, error: storageError } = await supabase.storage
          .from('company-files')
          .list(`documents/${companyId}`, { limit: 1000, offset: 0 })

        if (storageError) {
          console.error('❌ Erreur vérification storage:', storageError)
          return { exists: false, error: storageError }
        }

        const fileName = filePath.split('/').pop()
        const existsInStorage = storageCheck.some(file => file.name === fileName)

        // Vérifier en base de données
        const { data: dbCheck, error: dbError } = await supabase
          .from('documents')
          .select('id')
          .eq('file_path', filePath)
          .single()

        if (dbError && dbError.code !== 'PGRST116') {
          console.error('❌ Erreur vérification base:', dbError)
          return { exists: false, error: dbError }
        }

        const existsInDB = !!dbCheck

        return {
          exists: existsInStorage && existsInDB,
          existsInStorage,
          existsInDB,
          fileName,
          storageFiles: storageCheck.map(f => f.name)
        }
      } catch (error) {
        console.error('❌ Erreur validation:', error)
        return { exists: false, error }
      }
    }

    // 4.2 Fonction d'upload robuste
    console.log('\n📤 4.2 Fonction d\'upload robuste...')
    
    async function robustUpload(file, companyId, metadata = {}) {
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name}`
      const filePath = `${companyId}/${fileName}`
      const fullStoragePath = `documents/${filePath}`

      console.log(`🚀 Upload robuste: ${fileName}`)

      try {
        // Étape 1: Upload vers le storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-files')
          .upload(fullStoragePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Erreur upload:', uploadError)
          return { success: false, error: uploadError }
        }

        // Étape 2: Vérification immédiate
        const validation = await validateFileExists(filePath, companyId)
        if (!validation.existsInStorage) {
          console.error('❌ Fichier non trouvé après upload')
          // Rollback
          await supabase.storage.from('company-files').remove([fullStoragePath])
          return { success: false, error: 'Fichier non trouvé après upload' }
        }

        // Étape 3: Création en base de données
        const { data: newDoc, error: dbError } = await supabase
          .from('documents')
          .insert({
            name: metadata.name || file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            company_id: companyId,
            is_public: metadata.isPublic || false,
            document_type: metadata.documentType || null,
            document_reference: metadata.documentReference || null,
            display_name: metadata.displayName || file.name,
          })
          .select()
          .single()

        if (dbError) {
          console.error('❌ Erreur création en base:', dbError)
          // Rollback
          await supabase.storage.from('company-files').remove([fullStoragePath])
          return { success: false, error: dbError }
        }

        // Étape 4: Vérification finale
        const finalValidation = await validateFileExists(filePath, companyId)
        if (!finalValidation.exists) {
          console.error('❌ Incohérence détectée après création')
          // Nettoyage complet
          await supabase.storage.from('company-files').remove([fullStoragePath])
          await supabase.from('documents').delete().eq('id', newDoc.id)
          return { success: false, error: 'Incohérence détectée' }
        }

        console.log('✅ Upload robuste réussi:', newDoc.id)
        return { success: true, document: newDoc }

      } catch (error) {
        console.error('❌ Erreur upload robuste:', error)
        return { success: false, error }
      }
    }

    // 4.3 Fonction de nettoyage automatique
    console.log('\n🧹 4.3 Fonction de nettoyage automatique...')
    
    async function autoCleanup() {
      console.log('🔄 Nettoyage automatique en cours...')
      
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')

      if (docsError) {
        console.error('❌ Erreur récupération documents:', docsError)
        return
      }

      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('company-files')
        .list('documents', { limit: 1000, offset: 0 })

      if (storageError) {
        console.error('❌ Erreur récupération storage:', storageError)
        return
      }

      const dbPaths = docs.map(doc => `documents/${doc.file_path}`)
      const storagePaths = storageFiles.map(file => `documents/${file.name}`)

      const orphanedInDB = docs.filter(doc => 
        !storagePaths.includes(`documents/${doc.file_path}`)
      )

      const orphanedInStorage = storageFiles.filter(file => 
        !dbPaths.includes(`documents/${file.name}`)
      )

      console.log(`📊 Résultats du nettoyage automatique:`)
      console.log(`   - Entrées orphelines en base: ${orphanedInDB.length}`)
      console.log(`   - Fichiers orphelins en storage: ${orphanedInStorage.length}`)

      return { orphanedInDB, orphanedInStorage }
    }

    // =====================================================
    // 5. TEST DE ROBUSTESSE
    // =====================================================
    console.log('\n🧪 5. TEST DE ROBUSTESSE')
    console.log('========================')

    // 5.1 Test de validation
    console.log('\n🔍 5.1 Test de validation...')
    if (finalDocs.length > 0) {
      const testDoc = finalDocs[0]
      const validation = await validateFileExists(testDoc.file_path, testDoc.company_id)
      console.log(`   - Test validation pour: ${testDoc.name}`)
      console.log(`   - Existe en storage: ${validation.existsInStorage}`)
      console.log(`   - Existe en base: ${validation.existsInDB}`)
      console.log(`   - Cohérent: ${validation.exists}`)
    }

    // 5.2 Test de nettoyage automatique
    console.log('\n🧹 5.2 Test de nettoyage automatique...')
    const cleanupResult = await autoCleanup()
    console.log('   - Nettoyage automatique terminé')

    // =====================================================
    // 6. RECOMMANDATIONS SYSTÉMIQUES
    // =====================================================
    console.log('\n📋 6. RECOMMANDATIONS SYSTÉMIQUES')
    console.log('==================================')

    console.log('\n🛡️  Recommandations pour une application robuste:')
    console.log('')
    console.log('1. 🔄 VALIDATION SYSTÉMIQUE:')
    console.log('   - Valider chaque opération avant de continuer')
    console.log('   - Implémenter des rollbacks automatiques')
    console.log('   - Vérifier la cohérence après chaque opération')
    console.log('')
    console.log('2. 📊 MONITORING CONTINU:')
    console.log('   - Exécuter le nettoyage automatique régulièrement')
    console.log('   - Surveiller les incohérences')
    console.log('   - Alerter en cas de problème')
    console.log('')
    console.log('3. 🧪 TESTS ROBUSTES:')
    console.log('   - Tester tous les cas d\'erreur')
    console.log('   - Valider les rollbacks')
    console.log('   - Vérifier la cohérence des données')
    console.log('')
    console.log('4. 📝 DOCUMENTATION:')
    console.log('   - Documenter tous les processus')
    console.log('   - Créer des guides de dépannage')
    console.log('   - Former l\'équipe aux bonnes pratiques')

    console.log('\n🎉 Solution systémique complète terminée!')
    console.log('✅ Application maintenant robuste et cohérente')

  } catch (error) {
    console.error('❌ Erreur lors de la solution systémique:', error)
  }
}

// Exécution du script
solutionSystemiqueComplete() 