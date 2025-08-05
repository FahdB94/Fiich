// DIAGNOSTIC DÉTAILLÉ - Pourquoi l'application ne trouve pas le bucket
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDU4OTcsImV4cCI6MjA2OTQ4MTg5N30.zvfXx4LXIozX_3WA3M19uza83FmMP7vDjgq6hAtb12Q'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwNTg5NywiZXhwIjoyMDY5NDgxODk3fQ.XL_jXSUFAxchEu-POq3JjF5oHs7e0J22ufhYlUXfUHc'

const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticDetaille() {
  console.log('🔍 DIAGNOSTIC DÉTAILLÉ - Bucket not found\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. TEST AVEC LA CLÉ ANONYME (comme l'application)
    console.log('\n1️⃣ TEST AVEC CLÉ ANONYME (comme l\'app)')
    console.log('-'.repeat(40))
    
    const { data: bucketsAnon, error: bucketsAnonError } = await anonClient.storage.listBuckets()
    
    if (bucketsAnonError) {
      console.log(`❌ Erreur avec clé anonyme: ${bucketsAnonError.message}`)
    } else {
      console.log(`✅ Buckets trouvés avec clé anonyme: ${bucketsAnon.length}`)
      bucketsAnon.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`)
      })
    }
    
    // 2. TEST AVEC LA CLÉ SERVICE
    console.log('\n2️⃣ TEST AVEC CLÉ SERVICE')
    console.log('-'.repeat(40))
    
    const { data: bucketsService, error: bucketsServiceError } = await serviceClient.storage.listBuckets()
    
    if (bucketsServiceError) {
      console.log(`❌ Erreur avec clé service: ${bucketsServiceError.message}`)
    } else {
      console.log(`✅ Buckets trouvés avec clé service: ${bucketsService.length}`)
      bucketsService.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`)
      })
    }
    
    // 3. TEST D'ACCÈS DIRECT AU BUCKET
    console.log('\n3️⃣ TEST ACCÈS DIRECT AU BUCKET')
    console.log('-'.repeat(40))
    
    // Test avec clé anonyme
    const { data: filesAnon, error: filesAnonError } = await anonClient.storage
      .from('company-files')
      .list('', { limit: 1 })
    
    if (filesAnonError) {
      console.log(`❌ Erreur accès bucket avec clé anonyme: ${filesAnonError.message}`)
    } else {
      console.log('✅ Accès bucket OK avec clé anonyme')
    }
    
    // Test avec clé service
    const { data: filesService, error: filesServiceError } = await serviceClient.storage
      .from('company-files')
      .list('', { limit: 1 })
    
    if (filesServiceError) {
      console.log(`❌ Erreur accès bucket avec clé service: ${filesServiceError.message}`)
    } else {
      console.log('✅ Accès bucket OK avec clé service')
    }
    
    // 4. VÉRIFIER LES POLITIQUES STORAGE
    console.log('\n4️⃣ VÉRIFICATION POLITIQUES STORAGE')
    console.log('-'.repeat(40))
    
    // Créer un fichier de test pour vérifier les politiques
    const testContent = 'Test file content'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    const testPath = `test-${Date.now()}/test-file.txt`
    
    const { data: uploadData, error: uploadError } = await anonClient.storage
      .from('company-files')
      .upload(testPath, testFile)
    
    if (uploadError) {
      console.log(`❌ Erreur upload avec clé anonyme: ${uploadError.message}`)
      
      if (uploadError.message.includes('Bucket not found')) {
        console.log('   → Le bucket n\'est pas accessible avec la clé anonyme')
        console.log('   → Problème de permissions ou de configuration')
      } else if (uploadError.message.includes('policy')) {
        console.log('   → Problème de politique RLS sur le storage')
      }
    } else {
      console.log('✅ Upload réussi avec clé anonyme')
      console.log(`   Path: ${uploadData.path}`)
      
      // Nettoyer
      await anonClient.storage
        .from('company-files')
        .remove([testPath])
      console.log('   → Fichier de test supprimé')
    }
    
    // 5. VÉRIFIER LA CONFIGURATION DU BUCKET
    console.log('\n5️⃣ CONFIGURATION DU BUCKET')
    console.log('-'.repeat(40))
    
    const { data: bucketConfig, error: bucketConfigError } = await serviceClient.storage.getBucket('company-files')
    
    if (bucketConfigError) {
      console.log(`❌ Erreur récupération config bucket: ${bucketConfigError.message}`)
    } else {
      console.log('✅ Configuration bucket récupérée:')
      console.log(`   Nom: ${bucketConfig.name}`)
      console.log(`   Public: ${bucketConfig.public}`)
      console.log(`   File size limit: ${bucketConfig.file_size_limit}`)
      console.log(`   Allowed MIME types: ${bucketConfig.allowed_mime_types?.join(', ')}`)
    }
    
    // 6. RÉSUMÉ ET SOLUTIONS
    console.log('\n6️⃣ RÉSUMÉ ET SOLUTIONS')
    console.log('-'.repeat(40))
    
    if (uploadError && uploadError.message.includes('Bucket not found')) {
      console.log('🎯 PROBLÈME IDENTIFIÉ: Bucket non accessible')
      console.log('')
      console.log('📋 SOLUTIONS:')
      console.log('1. Vérifier que le bucket existe dans Supabase Dashboard')
      console.log('2. Appliquer le script creation-bucket-storage.sql')
      console.log('3. Vérifier les politiques RLS sur storage.objects')
      console.log('4. Redémarrer l\'application après correction')
    } else if (uploadError && uploadError.message.includes('policy')) {
      console.log('🎯 PROBLÈME IDENTIFIÉ: Politiques storage')
      console.log('')
      console.log('📋 SOLUTION:')
      console.log('1. Appliquer creation-bucket-storage.sql dans Supabase')
      console.log('2. Vider le cache du navigateur')
      console.log('3. Reconnectez-vous à l\'application')
    } else if (!uploadError) {
      console.log('✅ TOUT FONCTIONNE !')
      console.log('   Le problème vient du cache du navigateur.')
      console.log('   → Vider le cache: Cmd+Shift+R')
      console.log('   → Reconnectez-vous à l\'application')
    }
    
  } catch (error) {
    console.log(`💥 Erreur inattendue: ${error.message}`)
  }
}

diagnosticDetaille() 