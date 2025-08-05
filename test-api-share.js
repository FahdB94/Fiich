// TEST API SHARE-COMPANY - Diagnostic complet
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDU4OTcsImV4cCI6MjA2OTQ4MTg5N30.zvfXx4LXIozX_3WA3M19uza83FmMP7vDjgq6hAtb12Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testApiShare() {
  console.log('🔍 TEST API SHARE-COMPANY - Diagnostic complet\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. TEST CONNEXION
    console.log('\n1️⃣ TEST CONNEXION')
    console.log('-'.repeat(30))
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log(`❌ Erreur session: ${sessionError.message}`)
      return
    } else if (session) {
      console.log('✅ Session active trouvée')
      console.log(`   User: ${session.user.email}`)
      console.log(`   User ID: ${session.user.id}`)
      console.log(`   Token: ${session.access_token.substring(0, 20)}...`)
    } else {
      console.log('⚠️  Aucune session active')
      console.log('   → Connectez-vous d\'abord dans l\'application')
      return
    }
    
    // 2. TEST RÉCUPÉRATION DES ENTREPRISES
    console.log('\n2️⃣ TEST ENTREPRISES')
    console.log('-'.repeat(30))
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (companiesError) {
      console.log(`❌ Erreur entreprises: ${companiesError.message}`)
      return
    }
    
    if (!companies || companies.length === 0) {
      console.log('⚠️  Aucune entreprise trouvée')
      console.log('   → Créez d\'abord une entreprise')
      return
    }
    
    console.log(`✅ ${companies.length} entreprise(s) trouvée(s)`)
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.company_name} (ID: ${company.id})`)
    })
    
    const testCompany = companies[0]
    
    // 3. TEST API AVEC TOKEN
    console.log('\n3️⃣ TEST API SHARE-COMPANY')
    console.log('-'.repeat(30))
    
    const response = await fetch('http://localhost:3000/api/share-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        companyId: testCompany.id,
        email: 'test@example.com',
        message: 'Test message'
      }),
    })
    
    const result = await response.json()
    
    console.log(`📊 Status: ${response.status}`)
    console.log(`📊 Response: ${JSON.stringify(result, null, 2)}`)
    
    if (response.ok) {
      console.log('✅ API répond correctement')
    } else {
      console.log('❌ Erreur API détectée')
      
      // 4. DIAGNOSTIC DÉTAILLÉ
      console.log('\n4️⃣ DIAGNOSTIC DÉTAILLÉ')
      console.log('-'.repeat(30))
      
      // Vérifier si l'entreprise existe vraiment
      const { data: companyCheck, error: companyCheckError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', testCompany.id)
        .eq('user_id', session.user.id)
        .single()
      
      if (companyCheckError) {
        console.log(`❌ Erreur vérification entreprise: ${companyCheckError.message}`)
      } else if (!companyCheck) {
        console.log('❌ Entreprise non trouvée avec les critères')
      } else {
        console.log('✅ Entreprise trouvée en base')
        console.log(`   Nom: ${companyCheck.company_name}`)
        console.log(`   User ID: ${companyCheck.user_id}`)
        console.log(`   Session User ID: ${session.user.id}`)
        console.log(`   Match: ${companyCheck.user_id === session.user.id}`)
      }
      
      // Vérifier les politiques RLS
      console.log('\n5️⃣ VÉRIFICATION RLS')
      console.log('-'.repeat(30))
      
      const { data: rlsTest, error: rlsError } = await supabase
        .from('companies')
        .select('id, company_name, user_id')
        .eq('id', testCompany.id)
      
      if (rlsError) {
        console.log(`❌ Erreur RLS: ${rlsError.message}`)
      } else {
        console.log(`✅ RLS OK - ${rlsTest?.length || 0} résultat(s)`)
        if (rlsTest && rlsTest.length > 0) {
          console.log(`   Données: ${JSON.stringify(rlsTest[0])}`)
        }
      }
    }
    
    // 6. RÉSUMÉ
    console.log('\n6️⃣ RÉSUMÉ')
    console.log('-'.repeat(30))
    
    if (response.ok) {
      console.log('🎉 TOUT FONCTIONNE !')
      console.log('')
      console.log('📋 Prochaines étapes :')
      console.log('   1. Testez avec un vrai email')
      console.log('   2. Vérifiez la réception de l\'email')
      console.log('   3. Testez l\'acceptation de l\'invitation')
    } else {
      console.log('⚠️  Problèmes détectés :')
      console.log('   - Vérifiez que l\'application est démarrée')
      console.log('   - Vérifiez la configuration SMTP')
      console.log('   - Vérifiez les politiques RLS')
      console.log('   - Videz le cache du navigateur')
    }
    
  } catch (error) {
    console.log(`💥 Erreur inattendue: ${error.message}`)
  }
}

testApiShare() 