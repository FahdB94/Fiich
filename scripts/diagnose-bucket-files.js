const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function diagnoseBucketFiles() {
  console.log('🔍 Diagnostic des fichiers dans le bucket...')
  
  try {
    // 1. Lister tous les fichiers dans le bucket company-files
    console.log('\n📁 Listing du bucket company-files:')
    const { data: bucketFiles, error: bucketError } = await supabase.storage
      .from('company-files')
      .list('', { limit: 100, offset: 0 })
    
    if (bucketError) {
      console.error('❌ Erreur listing bucket:', bucketError)
      return
    }
    
    console.log('📋 Fichiers/dossiers trouvés:', bucketFiles?.length || 0)
    bucketFiles?.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 0} bytes)`)
    })
    
    // 2. Lister les fichiers dans le dossier documents
    console.log('\n📁 Listing du dossier documents:')
    const { data: docsFiles, error: docsError } = await supabase.storage
      .from('company-files')
      .list('documents', { limit: 100, offset: 0 })
    
    if (docsError) {
      console.error('❌ Erreur listing documents:', docsError)
    } else {
      console.log('📋 Fichiers dans documents:', docsFiles?.length || 0)
      docsFiles?.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 0} bytes)`)
      })
    }
    
    // 3. Lister les fichiers dans le dossier de l'entreprise spécifique
    const companyId = 'feab1dd5-e92e-4b72-a3bf-82cdb27d15d6'
    console.log(`\n📁 Listing du dossier de l'entreprise ${companyId}:`)
    const { data: companyFiles, error: companyError } = await supabase.storage
      .from('company-files')
      .list(`documents/${companyId}`, { limit: 100, offset: 0 })
    
    if (companyError) {
      console.error('❌ Erreur listing entreprise:', companyError)
    } else {
      console.log('📋 Fichiers dans l\'entreprise:', companyFiles?.length || 0)
      companyFiles?.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 0} bytes)`)
      })
    }
    
    // 4. Vérifier un fichier spécifique
    const testFile = 'documents/feab1dd5-e92e-4b72-a3bf-82cdb27d15d6/1754059702600-Document_de_Synthese_J00129376059_v1.pdf'
    console.log(`\n🔍 Test du fichier: ${testFile}`)
    
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from('company-files')
      .createSignedUrl(testFile, 60)
    
    if (signedError) {
      console.error('❌ Erreur création URL signée:', signedError)
    } else {
      console.log('✅ URL signée créée avec succès')
      console.log('🔗 URL:', signedUrl?.signedUrl)
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

diagnoseBucketFiles()
