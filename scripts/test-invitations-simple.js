const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInvitationsSimple() {
  console.log('🧪 Test simple des fonctionnalités d\'invitations...\n')

  try {
    // 1. Tester la fonction get_invitations_by_email
    console.log('1. Test de get_invitations_by_email...')
    const { data: receivedInvitations, error: receivedError } = await supabase
      .rpc('get_invitations_by_email', { user_email: 'coroalamelo@gmail.com' })

    if (receivedError) {
      console.log(`❌ Erreur get_invitations_by_email: ${receivedError.message}`)
    } else {
      console.log(`✅ get_invitations_by_email: ${receivedInvitations?.length || 0} invitations reçues`)
      if (receivedInvitations && receivedInvitations.length > 0) {
        console.log('   Détails:', receivedInvitations[0])
      }
    }

    // 2. Vérifier les fonctions existantes
    console.log('\n2. Vérification des fonctions RPC...')
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .in('routine_name', ['get_invitations_by_email', 'get_sent_invitations_by_user'])
      .eq('routine_schema', 'public')

    if (funcError) {
      console.log(`❌ Erreur vérification fonctions: ${funcError.message}`)
    } else {
      console.log(`✅ Fonctions trouvées: ${functions?.length || 0}`)
      functions?.forEach(func => {
        console.log(`   - ${func.routine_name} (${func.routine_type})`)
      })
    }

    // 3. Tester la récupération des entreprises partagées
    console.log('\n3. Test de récupération des entreprises partagées...')
    const { data: sharedCompanies, error: sharedError } = await supabase
      .from('company_shares')
      .select(`
        *,
        companies(company_name)
      `)
      .eq('shared_with_email', 'coroalamelo@gmail.com')
      .eq('is_active', true)

    if (sharedError) {
      console.log(`❌ Erreur récupération entreprises partagées: ${sharedError.message}`)
    } else {
      console.log(`✅ Entreprises partagées: ${sharedCompanies?.length || 0} entreprises`)
      if (sharedCompanies && sharedCompanies.length > 0) {
        console.log('   Détails:', sharedCompanies[0])
      }
    }

    console.log('\n🎉 Tests terminés !')

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testInvitationsSimple()
