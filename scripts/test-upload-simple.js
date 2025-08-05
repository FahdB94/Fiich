#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🧪 TEST UPLOAD SIMPLE')
console.log('=' .repeat(30))

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpload() {
  try {
    // Créer un fichier de test
    const testContent = 'Test file content - ' + new Date().toISOString()
    const testFile = new Blob([testContent], { type: 'text/plain' })
    const testFileName = `test-upload-${Date.now()}.txt`
    const testPath = `test/${testFileName}`

    console.log('📤 Tentative d\'upload...')
    console.log('Fichier:', testFileName)
    console.log('Chemin:', testPath)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.log('❌ Erreur d\'upload:', uploadError.message)
      console.log('Code:', uploadError.statusCode)
      
      if (uploadError.statusCode === 403) {
        console.log('\n💡 SOLUTION: Configurez les politiques de storage via l\'interface Supabase')
        console.log('   - Dashboard > Storage > company-files > Policies')
        console.log('   - Ou rendez le bucket public temporairement')
      }
      
      return false
    } else {
      console.log('✅ Upload réussi!')
      console.log('Fichier uploadé:', uploadData.path)
      
      // Nettoyer le fichier de test
      console.log('🧹 Suppression du fichier de test...')
      const { error: deleteError } = await supabase.storage
        .from('company-files')
        .remove([testPath])
      
      if (deleteError) {
        console.log('⚠️ Erreur lors de la suppression:', deleteError.message)
      } else {
        console.log('✅ Fichier de test supprimé')
      }
      
      return true
    }
  } catch (err) {
    console.log('❌ Erreur inattendue:', err.message)
    return false
  }
}

async function main() {
  const success = await testUpload()
  
  console.log('\n' + '=' .repeat(30))
  if (success) {
    console.log('🎉 UPLOAD FONCTIONNE!')
    console.log('Vous pouvez maintenant tester dans l\'application web.')
  } else {
    console.log('❌ UPLOAD NE FONCTIONNE PAS')
    console.log('Suivez le guide de configuration manuelle.')
  }
}

main().catch(console.error) 