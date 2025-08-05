const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Configuration Supabase:')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? 'Présent' : 'Manquant')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAuthSession() {
  console.log('\n🔍 DIAGNOSTIC AUTHENTIFICATION')
  console.log('================================')

  try {
    // Test 1: getUser()
    console.log('\n📥 Test 1: getUser()')
    const userResult = await supabase.auth.getUser()
    console.log('Résultat:', JSON.stringify(userResult, null, 2))
    
    if (userResult.data.user) {
      console.log('✅ Utilisateur trouvé:', userResult.data.user.email)
    } else {
      console.log('❌ Aucun utilisateur trouvé')
    }

    // Test 2: getSession()
    console.log('\n📥 Test 2: getSession()')
    const sessionResult = await supabase.auth.getSession()
    console.log('Résultat:', JSON.stringify(sessionResult, null, 2))
    
    if (sessionResult.data.session) {
      console.log('✅ Session trouvée:', sessionResult.data.session.user.email)
    } else {
      console.log('❌ Aucune session trouvée')
    }

    // Test 3: Lister tous les utilisateurs (pour vérifier que la connexion fonctionne)
    console.log('\n📥 Test 3: Vérification connexion DB')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email')
      .limit(1)
    
    if (usersError) {
      console.log('❌ Erreur connexion DB:', usersError.message)
    } else {
      console.log('✅ Connexion DB OK, utilisateurs trouvés:', users.length)
    }

    // Test 4: Vérifier les invitations
    console.log('\n📥 Test 4: Vérification invitations')
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)
    
    if (invitationsError) {
      console.log('❌ Erreur invitations:', invitationsError.message)
    } else {
      console.log('✅ Invitations trouvées:', invitations.length)
    }

    // Test 5: Test RPC get_invitation_by_token
    console.log('\n📥 Test 5: Test RPC get_invitation_by_token')
    const token = 'gatyP89dwM03o6wki4Er6lxZjFgsqYIPdN2NI-ke2fg'
    const { data: invitationData, error: rpcError } = await supabase.rpc('get_invitation_by_token', { 
      token_param: token 
    })
    
    if (rpcError) {
      console.log('❌ Erreur RPC:', rpcError.message)
    } else {
      console.log('✅ RPC OK, invitation trouvée:', invitationData.length > 0)
      if (invitationData.length > 0) {
        console.log('   Email invité:', invitationData[0].invited_email)
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

debugAuthSession() 