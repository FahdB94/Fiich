// TEST AUTHENTIFICATION API
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDU4OTcsImV4cCI6MjA2OTQ4MTg5N30.zvfXx4LXIozX_3WA3M19uza83FmMP7vDjgq6hAtb12Q'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthAPI() {
  console.log('🔍 TEST AUTHENTIFICATION API\n')
  console.log('=' .repeat(50))
  
  try {
    // 1. TEST CONNEXION
    console.log('\n1️⃣ TEST CONNEXION')
    console.log('-'.repeat(30))
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log(`❌ Erreur session: ${sessionError.message}`)
    } else if (session) {
      console.log('✅ Session active trouvée')
      console.log(`   User: ${session.user.email}`)
      console.log(`   Token: ${session.access_token.substring(0, 20)}...`)
    } else {
      console.log('⚠️  Aucune session active')
    }
    
    // 2. TEST CONNEXION AVEC EMAIL/MOT DE PASSE
    console.log('\n2️⃣ TEST CONNEXION')
    console.log('-'.repeat(30))
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'fahdbari94@gmail.com',
      password: 'votre_mot_de_passe' // Remplacez par votre vrai mot de passe
    })
    
    if (authError) {
      console.log(`❌ Erreur connexion: ${authError.message}`)
      console.log('   → Vérifiez votre email et mot de passe')
    } else {
      console.log('✅ Connexion réussie')
      console.log(`   User: ${authData.user.email}`)
      console.log(`   Token: ${authData.session.access_token.substring(0, 20)}...`)
      
      // 3. TEST API AVEC TOKEN
      console.log('\n3️⃣ TEST API AVEC TOKEN')
      console.log('-'.repeat(30))
      
      const response = await fetch('http://localhost:3000/api/share-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`,
        },
        body: JSON.stringify({
          companyId: 'test-company-id',
          email: 'test@example.com',
          message: 'Test message'
        }),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ API répond correctement')
        console.log(`   Status: ${response.status}`)
        console.log(`   Response: ${JSON.stringify(result)}`)
      } else {
        console.log(`❌ Erreur API: ${response.status}`)
        console.log(`   Response: ${JSON.stringify(result)}`)
      }
    }
    
    // 4. RÉSUMÉ
    console.log('\n4️⃣ RÉSUMÉ')
    console.log('-'.repeat(30))
    
    if (session || authData) {
      console.log('🎉 AUTHENTIFICATION FONCTIONNELLE !')
      console.log('')
      console.log('📋 Prochaines étapes :')
      console.log('   1. Vérifiez que l\'application est démarrée')
      console.log('   2. Connectez-vous dans l\'application')
      console.log('   3. Testez le partage d\'entreprise')
    } else {
      console.log('⚠️  Problèmes détectés :')
      console.log('   - Vérifiez vos identifiants')
      console.log('   - Assurez-vous que l\'application est démarrée')
      console.log('   - Videz le cache du navigateur')
    }
    
  } catch (error) {
    console.log(`💥 Erreur inattendue: ${error.message}`)
  }
}

testAuthAPI() 