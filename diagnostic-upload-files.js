// DIAGNOSTIC SPÉCIFIQUE - Téléversement de fichiers Kbis
// Ce script teste spécifiquement l'upload de documents

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDU4OTcsImV4cCI6MjA2OTQ4MTg5N30.zvfXx4LXIozX_3WA3M19uza83FmMP7vDjgq6hAtb12Q'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwNTg5NywiZXhwIjoyMDY5NDgxODk3fQ.XL_jXSUFAxchEu-POq3JjF5oHs7e0J22ufhYlUXfUHc'

const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function diagnostiqueUpload() {
  console.log('🔍 DIAGNOSTIC TÉLÉVERSEMENT DE FICHIERS KBIS\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. VÉRIFIER LA CONFIGURATION STORAGE
    console.log('\n1️⃣ CONFIGURATION STORAGE')
    console.log('-'.repeat(30))
    
    const { data: buckets, error: bucketsError } = await serviceClient.storage.listBuckets()
    
    if (bucketsError) {
      console.log(`❌ Erreur storage: ${bucketsError.message}`)
      return
    }
    
    const companyFilesBucket = buckets.find(b => b.name === 'company-files')
    if (companyFilesBucket) {
      console.log('✅ Bucket "company-files" existe')
      console.log(`   Public: ${companyFilesBucket.public}`)
    } else {
      console.log('❌ Bucket "company-files" manquant')
      console.log('   → Créer le bucket dans Supabase Dashboard')
    }
    
    // 2. VÉRIFIER LES POLITIQUES STORAGE
    console.log('\n2️⃣ POLITIQUES STORAGE')
    console.log('-'.repeat(30))
    
    // Créer un bucket de test si nécessaire
    if (!companyFilesBucket) {
      const { error: createError } = await serviceClient.storage.createBucket('company-files', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      })
      
      if (createError) {
        console.log(`❌ Erreur création bucket: ${createError.message}`)
      } else {
        console.log('✅ Bucket "company-files" créé')
      }
    }
    
    // 3. TESTER L'INSERTION DE DOCUMENT
    console.log('\n3️⃣ TEST INSERTION DOCUMENT')
    console.log('-'.repeat(30))
    
    // Récupérer un utilisateur et une entreprise de test
    const { data: users } = await serviceClient.from('users').select('id, email').limit(1)
    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé')
      return
    }
    
    const userId = users[0].id
    console.log(`Utilisateur test: ${users[0].email}`)
    
    // Créer une entreprise de test
    const { data: company, error: companyError } = await serviceClient
      .from('companies')
      .insert({
        user_id: userId,
        company_name: 'Test Company Upload',
        address_line_1: '123 Test Street',
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
        email: 'test@upload.com'
      })
      .select()
      .single()
    
    if (companyError) {
      console.log(`❌ Erreur création entreprise: ${companyError.message}`)
      if (companyError.message.includes('row-level security')) {
        console.log('   → Problème RLS détecté !')
        console.log('   → Appliquer fix-recursion-final.sql')
      }
      return
    }
    
    console.log(`✅ Entreprise créée: ${company.company_name}`)
    
    // 4. TESTER L'INSERTION DE DOCUMENT
    console.log('\n4️⃣ TEST INSERTION DOCUMENT')
    console.log('-'.repeat(30))
    
    const testDocument = {
      company_id: company.id,
      type: 'kbis',
      name: 'Test Kbis',
      file_path: 'documents/test/test-kbis.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      is_public: false
    }
    
    const { data: document, error: documentError } = await serviceClient
      .from('documents')
      .insert(testDocument)
      .select()
      .single()
    
    if (documentError) {
      console.log(`❌ Erreur insertion document: ${documentError.message}`)
      if (documentError.message.includes('row-level security')) {
        console.log('   → PROBLÈME RLS CONFIRMÉ !')
        console.log('   → Les politiques RLS bloquent l\'insertion')
        console.log('   → Solution: Appliquer fix-recursion-final.sql')
      }
    } else {
      console.log('✅ Document inséré avec succès')
      console.log(`   ID: ${document.id}`)
      console.log(`   Nom: ${document.name}`)
      
      // Nettoyer
      await serviceClient.from('documents').delete().eq('id', document.id)
    }
    
    // 5. NETTOYER
    await serviceClient.from('companies').delete().eq('id', company.id)
    
    // 6. RÉSUMÉ
    console.log('\n5️⃣ RÉSUMÉ')
    console.log('-'.repeat(30))
    
    if (documentError && documentError.message.includes('row-level security')) {
      console.log('🎯 PROBLÈME IDENTIFIÉ: Politiques RLS')
      console.log('')
      console.log('📋 SOLUTION:')
      console.log('1. Aller sur https://supabase.com')
      console.log('2. Projet: jjibjvxdiqvuseaexivl')
      console.log('3. Onglet SQL')
      console.log('4. Copier-coller le contenu de fix-recursion-final.sql')
      console.log('5. Cliquer "Run"')
      console.log('6. Vider le cache du navigateur (Cmd+Shift+R)')
      console.log('7. Tester l\'upload de Kbis')
    } else {
      console.log('✅ Tout fonctionne ! Le problème vient peut-être du cache du navigateur.')
      console.log('   → Vider le cache: Cmd+Shift+R')
      console.log('   → Reconnectez-vous à l\'application')
    }
    
  } catch (error) {
    console.log(`💥 Erreur inattendue: ${error.message}`)
  }
}

diagnostiqueUpload() 