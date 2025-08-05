const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testDirectAccess() {
  console.log('🔍 Test d\'accès direct au fichier...')
  
  try {
    const filePath = 'documents/feab1dd5-e92e-4b72-a3bf-82cdb27d15d6/1754059702600-Document_de_Synthese_J00129376059_v1.pdf'
    
    // Test 1: URL publique directe
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-files/${filePath}`
    console.log('🔗 URL publique:', publicUrl)
    
    // Test 2: URL signée
    console.log('\n🔐 Test création URL signée...')
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from('company-files')
      .createSignedUrl(filePath, 60)
    
    if (signedError) {
      console.error('❌ Erreur création URL signée:', signedError)
    } else {
      console.log('✅ URL signée créée avec succès')
      console.log('🔗 URL:', signedUrl?.signedUrl)
    }
    
    // Test 3: Vérifier si le fichier existe
    console.log('\n📁 Test existence du fichier...')
    const { data: fileExists, error: existsError } = await supabase.storage
      .from('company-files')
      .list('documents/feab1dd5-e92e-4b72-a3bf-82cdb27d15d6')
    
    if (existsError) {
      console.error('❌ Erreur listing dossier:', existsError)
    } else {
      console.log('📋 Fichiers dans le dossier:', fileExists?.length || 0)
      fileExists?.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 0} bytes)`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testDirectAccess()
