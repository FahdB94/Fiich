const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testInvitationSend() {
  console.log('🧪 Test d\'envoi d\'invitation...\n')

  try {
    // 1. Récupérer une entreprise existante
    console.log('1. Récupération d\'une entreprise...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, user_id')
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.log('❌ Aucune entreprise trouvée')
      return
    }

    const company = companies[0]
    console.log(`✅ Entreprise trouvée: ${company.company_name} (ID: ${company.id})`)

    // 2. Récupérer l'utilisateur propriétaire
    console.log('\n2. Récupération de l\'utilisateur propriétaire...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', company.user_id)
      .single()

    if (userError || !user) {
      console.log('❌ Utilisateur propriétaire non trouvé')
      return
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`)

    // 3. Créer un token d'invitation de test
    console.log('\n3. Création d\'une invitation de test...')
    const testEmail = 'test-invitation@example.com'
    const invitationToken = 'TEST-TOKEN-' + Date.now()
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        company_id: company.id,
        invited_email: testEmail,
        invited_by: user.id,
        invitation_token: invitationToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (invitationError) {
      console.log('❌ Erreur lors de la création de l\'invitation:', invitationError)
      return
    }

    console.log(`✅ Invitation créée: ${invitation.id}`)
    console.log(`   - Email: ${invitation.invited_email}`)
    console.log(`   - Token: ${invitation.invitation_token}`)
    console.log(`   - Expire: ${invitation.expires_at}`)

    // 4. Tester la fonction RPC
    console.log('\n4. Test de la fonction RPC get_invitation_by_token...')
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_invitation_by_token', { token_param: invitationToken })

    if (rpcError) {
      console.log('❌ Erreur RPC:', rpcError)
    } else if (!rpcResult || rpcResult.length === 0) {
      console.log('❌ Aucun résultat de la fonction RPC')
    } else {
      console.log('✅ Fonction RPC fonctionne correctement')
      console.log(`   - Nom inviteur: ${rpcResult[0].invited_by_first_name} ${rpcResult[0].invited_by_name}`)
      console.log(`   - Email inviteur: ${rpcResult[0].invited_by_email}`)
    }

    // 5. Nettoyer
    console.log('\n5. Nettoyage...')
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitation.id)

    if (deleteError) {
      console.log('⚠️ Erreur lors du nettoyage:', deleteError)
    } else {
      console.log('✅ Invitation de test supprimée')
    }

    console.log('\n🎉 Test terminé avec succès !')

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testInvitationSend() 