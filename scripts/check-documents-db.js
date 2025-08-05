const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkDocumentsDB() {
  console.log('🔍 Vérification des documents en base de données...')
  
  try {
    // Récupérer tous les documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération documents:', error)
      return
    }
    
    console.log(`📋 Nombre total de documents en DB: ${documents?.length || 0}`)
    
    if (documents && documents.length > 0) {
      console.log('\n📄 Documents trouvés:')
      documents.forEach((doc, index) => {
        console.log(`${index + 1}. ID: ${doc.id}`)
        console.log(`   Nom: ${doc.name}`)
        console.log(`   File path: ${doc.file_path}`)
        console.log(`   Company ID: ${doc.company_id}`)
        console.log(`   Taille: ${doc.file_size} bytes`)
        console.log(`   Type: ${doc.mime_type}`)
        console.log(`   Créé: ${doc.created_at}`)
        console.log('   ---')
      })
    } else {
      console.log('❌ Aucun document trouvé en base de données')
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

checkDocumentsDB()
