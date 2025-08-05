const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInvitationsComplete() {
  console.log('🧪 Test complet des fonctionnalités d\'invitations...\n')

  try {
    // 1. Récupérer un utilisateur existant
    console.log('1. Récupération d\'un utilisateur...')
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1)

    if (userError || !users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé')
      return
    }

    const user = users[0]
    console.log(`✅ Utilisateur trouvé: ${user.email}`)

    // 2. Récupérer une entreprise existante
    console.log('\n2. Récupération d\'une entreprise...')
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

    // 3. Tester la fonction get_invitations_by_email
    console.log('\n3. Test de get_invitations_by_email...')
    const { data: receivedInvitations, error: receivedError } = await supabase
      .rpc('get_invitations_by_email', { user_email: user.email })

    if (receivedError) {
      console.log(`❌ Erreur get_invitations_by_email: ${receivedError.message}`)
    } else {
      console.log(`✅ get_invitations_by_email: ${receivedInvitations?.length || 0} invitations reçues`)
    }

    // 4. Tester la fonction get_sent_invitations_by_user
    console.log('\n4. Test de get_sent_invitations_by_user...')
    const { data: sentInvitations, error: sentError } = await supabase
      .rpc('get_sent_invitations_by_user', { user_id_param: user.id })

    if (sentError) {
      console.log(`❌ Erreur get_sent_invitations_by_user: ${sentError.message}`)
    } else {
      console.log(`✅ get_sent_invitations_by_user: ${sentInvitations?.length || 0} invitations envoyées`)
    }

    // 5. Tester la récupération des entreprises partagées
    console.log('\n5. Test de récupération des entreprises partagées...')
    const { data: sharedCompanies, error: sharedError } = await supabase
      .from('company_shares')
      .select(`
        *,
        companies(company_name)
      `)
      .eq('shared_with_email', user.email)
      .eq('is_active', true)

    if (sharedError) {
      console.log(`❌ Erreur récupération entreprises partagées: ${sharedError.message}`)
    } else {
      console.log(`✅ Entreprises partagées: ${sharedCompanies?.length || 0} entreprises`)
    }

    // 6. Tester la création d'une invitation
    console.log('\n6. Test de création d\'invitation...')
    const testEmail = 'test@example.com'
    const { data: newInvitation, error: createError } = await supabase
      .from('invitations')
      .insert({
        company_id: company.id,
        invited_email: testEmail,
        invited_by: user.id,
        invitation_token: 'test-token-' + Date.now(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.log(`❌ Erreur création invitation: ${createError.message}`)
    } else {
      console.log(`✅ Invitation créée avec succès: ${newInvitation.id}`)
      
      // Nettoyer l'invitation de test
      await supabase
        .from('invitations')
        .delete()
        .eq('id', newInvitation.id)
      console.log('🧹 Invitation de test supprimée')
    }

    console.log('\n🎉 Tests terminés avec succès !')

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testInvitationsComplete()
