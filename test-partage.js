// TEST FONCTIONNALITÉ DE PARTAGE
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDU4OTcsImV4cCI6MjA2OTQ4MTg5N30.zvfXx4LXIozX_3WA3M19uza83FmMP7vDjgq6hAtb12Q'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwNTg5NywiZXhwIjoyMDY5NDgxODk3fQ.XL_jXSUFAxchEu-POq3JjF5oHs7e0J22ufhYlUXfUHc'

const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function testPartage() {
  console.log('🔍 TEST FONCTIONNALITÉ DE PARTAGE\n')
  console.log('=' .repeat(50))
  
  try {
    // 1. VÉRIFIER LES FONCTIONS
    console.log('\n1️⃣ VÉRIFICATION DES FONCTIONS')
    console.log('-'.repeat(30))
    
    // Test de la fonction get_shared_company
    const { data: functions, error: functionsError } = await serviceClient
      .rpc('get_shared_company', { share_token_param: 'test' })
    
    if (functionsError) {
      console.log(`❌ Erreur fonction get_shared_company: ${functionsError.message}`)
    } else {
      console.log('✅ Fonction get_shared_company OK')
    }
    
    // 2. VÉRIFIER LES POLITIQUES
    console.log('\n2️⃣ VÉRIFICATION DES POLITIQUES')
    console.log('-'.repeat(30))
    
    const { data: policies, error: policiesError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'invitations')
    
    if (policiesError) {
      console.log(`❌ Erreur récupération politiques: ${policiesError.message}`)
    } else {
      console.log(`✅ Politiques invitations: ${policies.length}`)
    }
    
    // 3. TEST CRÉATION INVITATION
    console.log('\n3️⃣ TEST CRÉATION INVITATION')
    console.log('-'.repeat(30))
    
    // Récupérer un utilisateur et une entreprise
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
        company_name: 'Test Company Partage',
        address_line_1: '123 Test Street',
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
        email: 'test@partage.com'
      })
      .select()
      .single()
    
    if (companyError) {
      console.log(`❌ Erreur création entreprise: ${companyError.message}`)
      return
    }
    
    console.log(`✅ Entreprise créée: ${company.company_name}`)
    
    // Créer une invitation
    const { data: invitation, error: invitationError } = await serviceClient
      .from('invitations')
      .insert({
        company_id: company.id,
        invited_email: 'test@example.com',
        invited_by: userId,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    
    if (invitationError) {
      console.log(`❌ Erreur création invitation: ${invitationError.message}`)
    } else {
      console.log('✅ Invitation créée avec succès')
      console.log(`   Token: ${invitation.invitation_token}`)
      console.log(`   Email: ${invitation.invited_email}`)
    }
    
    // 4. TEST CRÉATION PARTAGE
    console.log('\n4️⃣ TEST CRÉATION PARTAGE')
    console.log('-'.repeat(30))
    
    const { data: share, error: shareError } = await serviceClient
      .from('company_shares')
      .insert({
        company_id: company.id,
        shared_with_email: 'public@example.com',
        permissions: ['view_company', 'view_documents'],
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    
    if (shareError) {
      console.log(`❌ Erreur création partage: ${shareError.message}`)
    } else {
      console.log('✅ Partage créé avec succès')
      console.log(`   Token: ${share.share_token}`)
      console.log(`   Permissions: ${share.permissions.join(', ')}`)
    }
    
    // 5. NETTOYER
    if (invitation) {
      await serviceClient.from('invitations').delete().eq('id', invitation.id)
    }
    if (share) {
      await serviceClient.from('company_shares').delete().eq('id', share.id)
    }
    await serviceClient.from('companies').delete().eq('id', company.id)
    
    // 6. RÉSUMÉ
    console.log('\n5️⃣ RÉSUMÉ')
    console.log('-'.repeat(30))
    
    if (!invitationError && !shareError) {
      console.log('🎉 FONCTIONNALITÉ DE PARTAGE OPÉRATIONNELLE !')
      console.log('')
      console.log('📋 Vous pouvez maintenant :')
      console.log('   ✅ Créer des invitations par email')
      console.log('   ✅ Générer des liens de partage')
      console.log('   ✅ Partager des entreprises')
      console.log('   ✅ Gérer les permissions')
    } else {
      console.log('⚠️  Problèmes détectés :')
      if (invitationError) {
        console.log(`   - Invitations: ${invitationError.message}`)
      }
      if (shareError) {
        console.log(`   - Partages: ${shareError.message}`)
      }
    }
    
  } catch (error) {
    console.log(`💥 Erreur inattendue: ${error.message}`)
  }
}

testPartage() 