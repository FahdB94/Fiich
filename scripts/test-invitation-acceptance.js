const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testInvitationAcceptance() {
  console.log('🧪 Test d\'acceptation d\'invitation...\n')

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

    // 3. Créer une invitation de test
    console.log('\n3. Création d\'une invitation de test...')
    const testEmail = 'test-acceptance@example.com'
    const invitationToken = 'TEST-ACCEPT-' + Date.now()
    
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

    // 4. Simuler l'acceptation de l'invitation (créer un company_share)
    console.log('\n4. Test d\'acceptation de l\'invitation...')
    const { data: share, error: shareError } = await supabase
      .from('company_shares')
      .insert({
        company_id: invitation.company_id,
        shared_with_email: invitation.invited_email,
        share_token: invitation.invitation_token,
        is_active: true,
        permissions: ['view_company', 'view_documents']
      })
      .select()
      .single()

    if (shareError) {
      console.log('❌ Erreur lors de l\'acceptation:', shareError)
      console.log('   Code:', shareError.code)
      console.log('   Message:', shareError.message)
      console.log('   Details:', shareError.details)
      console.log('   Hint:', shareError.hint)
      return
    }

    console.log(`✅ Invitation acceptée avec succès !`)
    console.log(`   - Share ID: ${share.id}`)
    console.log(`   - Email: ${share.shared_with_email}`)
    console.log(`   - Permissions: ${share.permissions.join(', ')}`)

    // 5. Vérifier que le partage est accessible
    console.log('\n5. Vérification de l\'accès au partage...')
    const { data: shares, error: sharesError } = await supabase
      .from('company_shares')
      .select('*')
      .eq('company_id', company.id)

    if (sharesError) {
      console.log('❌ Erreur lors de la vérification des partages:', sharesError)
    } else {
      console.log(`✅ Partages trouvés: ${shares.length}`)
      shares.forEach(s => {
        console.log(`   - ${s.shared_with_email} (${s.is_active ? 'Actif' : 'Inactif'})`)
      })
    }

    // 6. Nettoyer
    console.log('\n6. Nettoyage...')
    const { error: deleteShareError } = await supabase
      .from('company_shares')
      .delete()
      .eq('id', share.id)

    const { error: deleteInvitationError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitation.id)

    if (deleteShareError) {
      console.log('⚠️ Erreur lors de la suppression du partage:', deleteShareError)
    } else {
      console.log('✅ Partage de test supprimé')
    }

    if (deleteInvitationError) {
      console.log('⚠️ Erreur lors de la suppression de l\'invitation:', deleteInvitationError)
    } else {
      console.log('✅ Invitation de test supprimée')
    }

    console.log('\n🎉 Test terminé avec succès !')

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testInvitationAcceptance() 