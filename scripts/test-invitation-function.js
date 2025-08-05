const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.log('Vérifiez que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInvitationFunction() {
  console.log('🧪 Test de la fonction get_invitation_by_token')
  console.log('=============================================\n')

  try {
    // 1. Vérifier la configuration
    console.log('1. Configuration Supabase:')
    console.log('   URL:', supabaseUrl)
    console.log('   Clé présente:', !!supabaseKey)
    console.log('')

    // 2. Récupérer une invitation existante
    console.log('2. Récupération d\'une invitation existante:')
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)

    if (invitationsError) {
      console.error('❌ Erreur lors de la récupération des invitations:', invitationsError)
      return
    }

    if (!invitations || invitations.length === 0) {
      console.log('ℹ️ Aucune invitation trouvée dans la base de données')
      console.log('   Créez d\'abord une invitation via l\'application')
      return
    }

    const invitation = invitations[0]
    console.log('✅ Invitation trouvée:', {
      id: invitation.id,
      token: invitation.invitation_token,
      email: invitation.invited_email,
      expires: invitation.expires_at
    })
    console.log('')

    // 3. Tester la fonction RPC
    console.log('3. Test de la fonction RPC:')
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_invitation_by_token', { 
        token_param: invitation.invitation_token 
      })

    if (rpcError) {
      console.error('❌ Erreur RPC:', rpcError)
      console.log('')
      console.log('🔧 Solutions possibles:')
      console.log('   - Vérifiez que la fonction get_invitation_by_token existe')
      console.log('   - Exécutez le script SQL dans Supabase Dashboard')
      console.log('   - Vérifiez les types de données dans la fonction')
      return
    }

    if (!rpcData || rpcData.length === 0) {
      console.log('ℹ️ Aucune donnée retournée par la fonction RPC')
      console.log('   L\'invitation pourrait être expirée')
      return
    }

    console.log('✅ Fonction RPC fonctionne correctement:')
    console.log('   Données retournées:', rpcData[0])
    console.log('')

    // 4. Vérifier la structure des données
    console.log('4. Vérification de la structure:')
    const expectedFields = [
      'id', 'company_id', 'invited_email', 'invited_by', 
      'invitation_token', 'expires_at', 'created_at', 'updated_at',
      'company_name', 'invited_by_email', 'invited_by_name', 'invited_by_first_name'
    ]

    const returnedFields = Object.keys(rpcData[0])
    console.log('   Champs attendus:', expectedFields)
    console.log('   Champs retournés:', returnedFields)
    
    const missingFields = expectedFields.filter(field => !returnedFields.includes(field))
    if (missingFields.length > 0) {
      console.log('❌ Champs manquants:', missingFields)
    } else {
      console.log('✅ Tous les champs sont présents')
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error)
  }

  console.log('\n📋 Résumé:')
  console.log('1. Vérifiez que la fonction RPC existe dans Supabase')
  console.log('2. Vérifiez les types de données dans la fonction')
  console.log('3. Vérifiez que les variables d\'environnement sont correctes')
}

testInvitationFunction() 