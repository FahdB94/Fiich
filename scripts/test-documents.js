const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDocuments() {
  console.log('📄 Test des documents...\n')

  try {
    // 1. Récupérer une entreprise
    console.log('1. Récupération d\'une entreprise...')
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name')
      .limit(1)

    if (companyError || !companies || companies.length === 0) {
      console.log('❌ Aucune entreprise trouvée')
      return
    }

    const company = companies[0]
    console.log(`✅ Entreprise trouvée: ${company.company_name}`)

    // 2. Récupérer les documents de cette entreprise
    console.log('\n2. Récupération des documents...')
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.log(`❌ Erreur: ${documentsError.message}`)
      return
    }

    console.log(`✅ ${documents.length} documents trouvés`)

    if (documents.length > 0) {
      documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.document_name} (${doc.document_type})`)
        console.log(`      Chemin: ${doc.file_path}`)
        console.log(`      Créé: ${doc.created_at}`)
      })

      // 3. Tester la génération d'URL pour le premier document
      console.log('\n3. Test de génération d\'URL...')
      const firstDoc = documents[0]
      const { data: urlData, error: urlError } = await supabase.storage
        .from('company-files')
        .createSignedUrl(firstDoc.file_path, 60)

      if (urlError) {
        console.log(`❌ Erreur génération URL: ${urlError.message}`)
      } else {
        console.log(`✅ URL générée avec succès`)
        console.log(`   URL: ${urlData.signedUrl.substring(0, 100)}...`)
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testDocuments()
