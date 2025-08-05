// TEST CONFIGURATION STORAGE - Vérifier que le bucket fonctionne
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDU4OTcsImV4cCI6MjA2OTQ4MTg5N30.zvfXx4LXIozX_3WA3M19uza83FmMP7vDjgq6hAtb12Q'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwNTg5NywiZXhwIjoyMDY5NDgxODk3fQ.XL_jXSUFAxchEu-POq3JjF5oHs7e0J22ufhYlUXfUHc'

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function testStorageConfig() {
  console.log('🔍 TEST CONFIGURATION STORAGE\n')
  console.log('=' .repeat(50))
  
  try {
    // 1. VÉRIFIER LES BUCKETS
    console.log('\n1️⃣ VÉRIFICATION DES BUCKETS')
    console.log('-'.repeat(30))
    
    const { data: buckets, error: bucketsError } = await serviceClient.storage.listBuckets()
    
    if (bucketsError) {
      console.log(`❌ Erreur: ${bucketsError.message}`)
      return
    }
    
    console.log(`Buckets trouvés: ${buckets.length}`)
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (public: ${bucket.public})`)
    })
    
    const companyFilesBucket = buckets.find(b => b.name === 'company-files')
    
    if (!companyFilesBucket) {
      console.log('\n❌ Bucket "company-files" manquant !')
      console.log('\n📋 SOLUTION:')
      console.log('1. Aller sur https://supabase.com')
      console.log('2. Projet: jjibjvxdiqvuseaexivl')
      console.log('3. Onglet "Storage"')
      console.log('4. Cliquer "New bucket"')
      console.log('5. Nom: company-files')
      console.log('6. Public: NON')
      console.log('7. File size limit: 10MB')
      console.log('8. Allowed MIME types: application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      console.log('9. Créer le bucket')
      return
    }
    
    console.log('✅ Bucket "company-files" existe')
    console.log(`   Public: ${companyFilesBucket.public}`)
    console.log(`   File size limit: ${companyFilesBucket.file_size_limit} bytes`)
    
    // 2. TESTER L'UPLOAD
    console.log('\n2️⃣ TEST UPLOAD FICHIER')
    console.log('-'.repeat(30))
    
    // Créer un fichier de test
    const testContent = 'Test file content'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    
    const testPath = 'test/test-file.txt'
    
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('company-files')
      .upload(testPath, testFile)
    
    if (uploadError) {
      console.log(`❌ Erreur upload: ${uploadError.message}`)
      if (uploadError.message.includes('Bucket not found')) {
        console.log('   → Le bucket n\'existe pas ou n\'est pas accessible')
      } else if (uploadError.message.includes('policy')) {
        console.log('   → Problème de politique RLS sur le storage')
      }
    } else {
      console.log('✅ Upload réussi')
      console.log(`   Path: ${uploadData.path}`)
      
      // Nettoyer
      await serviceClient.storage
        .from('company-files')
        .remove([testPath])
      console.log('   → Fichier de test supprimé')
    }
    
    // 3. RÉSUMÉ
    console.log('\n3️⃣ RÉSUMÉ')
    console.log('-'.repeat(30))
    
    if (companyFilesBucket && !uploadError) {
      console.log('🎉 CONFIGURATION STORAGE PARFAITE !')
      console.log('   Vous pouvez maintenant téléverser des fichiers Kbis.')
    } else if (!companyFilesBucket) {
      console.log('⚠️  CRÉER LE BUCKET MANUELLEMENT')
    } else {
      console.log('⚠️  APPLIQUER LES POLITIQUES STORAGE')
      console.log('   → Utiliser le script creation-bucket-storage.sql')
    }
    
  } catch (error) {
    console.log(`💥 Erreur inattendue: ${error.message}`)
  }
}

testStorageConfig() 