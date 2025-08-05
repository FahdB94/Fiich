const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.log('Vérifiez que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testShareAPI() {
  console.log('🧪 Test de l\'API de partage')
  console.log('============================\n')

  try {
    // 1. Vérifier l'authentification
    console.log('1. Vérification de l\'authentification...')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError)
      return
    }
    
    if (!session) {
      console.log('⚠️  Aucune session active - Connectez-vous d\'abord')
      return
    }
    
    console.log('✅ Session active trouvée')
    console.log('   User ID:', session.user.id)
    console.log('   Email:', session.user.email)

    // 2. Récupérer une entreprise de l'utilisateur
    console.log('\n2. Récupération d\'une entreprise...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('user_id', session.user.id)
      .limit(1)

    if (companiesError) {
      console.error('❌ Erreur lors de la récupération des entreprises:', companiesError)
      return
    }

    if (!companies || companies.length === 0) {
      console.log('⚠️  Aucune entreprise trouvée pour cet utilisateur')
      return
    }

    const company = companies[0]
    console.log('✅ Entreprise trouvée:', company.company_name)
    console.log('   Company ID:', company.id)

    // 3. Tester l'API de partage
    console.log('\n3. Test de l\'API de partage...')
    const testEmail = 'test@example.com'
    
    const response = await fetch('http://localhost:3000/api/share-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        companyId: company.id,
        email: testEmail,
        message: 'Test de partage'
      })
    })

    console.log('📥 Réponse API:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    const responseData = await response.json()
    console.log('📋 Données de réponse:', responseData)

    if (response.ok) {
      console.log('✅ API de partage fonctionnelle')
    } else {
      console.error('❌ Erreur API:', responseData)
    }

    // 4. Vérifier les variables d'environnement SMTP
    console.log('\n4. Vérification des variables SMTP...')
    const smtpVars = [
      'SMTP_HOST',
      'SMTP_PORT', 
      'SMTP_USER',
      'SMTP_PASS',
      'FROM_EMAIL',
      'NEXT_PUBLIC_APP_URL'
    ]

    smtpVars.forEach(varName => {
      const value = process.env[varName]
      if (value) {
        console.log(`✅ ${varName}: ${varName.includes('PASS') ? '***' : value}`)
      } else {
        console.log(`❌ ${varName}: Non définie`)
      }
    })

    // 5. Vérifier les tables nécessaires
    console.log('\n5. Vérification des tables...')
    
    // Vérifier la table invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('count', { count: 'exact', head: true })

    if (invitationsError) {
      console.error('❌ Erreur table invitations:', invitationsError)
    } else {
      console.log('✅ Table invitations accessible')
    }

    // Vérifier la table company_shares
    const { data: shares, error: sharesError } = await supabase
      .from('company_shares')
      .select('count', { count: 'exact', head: true })

    if (sharesError) {
      console.error('❌ Erreur table company_shares:', sharesError)
    } else {
      console.log('✅ Table company_shares accessible')
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }

  console.log('\n📋 Résumé:')
  console.log('1. Vérifiez que vous êtes connecté dans l\'application')
  console.log('2. Vérifiez les variables d\'environnement SMTP')
  console.log('3. Vérifiez les logs dans la console du navigateur')
  console.log('4. Vérifiez les logs du serveur Next.js')
}

testShareAPI() 