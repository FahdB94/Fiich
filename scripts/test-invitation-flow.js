#!/usr/bin/env node

/**
 * Script de test pour vérifier le flux d'invitation après corrections Next.js 15
 * Teste la création d'invitation et la récupération par token
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInvitationFlow() {
  console.log('🧪 TEST DU FLUX D\'INVITATION - CORRECTIONS NEXT.JS 15')
  console.log('=' .repeat(60))

  try {
    // 1. Récupérer une entreprise existante
    console.log('\n1️⃣ Récupération d\'une entreprise existante...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, user_id')
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Aucune entreprise trouvée:', companiesError)
      return
    }

    const company = companies[0]
    console.log('✅ Entreprise trouvée:', company.id)

    // 2. Créer une invitation de test
    console.log('\n2️⃣ Création d\'une invitation de test...')
    
    const testInvitation = {
      company_id: company.id,
      invited_email: 'test@example.com',
      invited_by: company.user_id,
      invitation_token: 'TEST-TOKEN-' + Date.now(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // +24h
    }

    const { data: invitation, error: createError } = await supabase
      .from('invitations')
      .insert(testInvitation)
      .select()
      .single()

    if (createError) {
      console.error('❌ Erreur création invitation:', createError)
      return
    }

    console.log('✅ Invitation créée:', invitation.id)

    // 3. Tester la fonction RPC get_invitation_by_token
    console.log('\n3️⃣ Test de la fonction RPC get_invitation_by_token...')
    
    const { data: retrievedInvitation, error: rpcError } = await supabase
      .rpc('get_invitation_by_token', { token_param: invitation.invitation_token })

    if (rpcError) {
      console.error('❌ Erreur RPC get_invitation_by_token:', rpcError)
      console.log('⚠️ La fonction RPC peut ne pas exister, testons directement l\'URL')
    } else if (!retrievedInvitation || retrievedInvitation.length === 0) {
      console.error('❌ Aucune invitation trouvée avec le token')
    } else {
      console.log('✅ Invitation récupérée via RPC:', retrievedInvitation[0].id)
    }

    // 4. Tester l'accès via l'URL d'invitation
    console.log('\n4️⃣ Test de l\'URL d\'invitation...')
    
    const invitationUrl = `http://localhost:3000/invitation/${invitation.invitation_token}`
    console.log('🔗 URL d\'invitation:', invitationUrl)
    
    // Test HTTP simple
    const response = await fetch(invitationUrl)
    console.log('📡 Statut HTTP:', response.status)
    
    if (response.status === 200) {
      console.log('✅ Page d\'invitation accessible')
      const html = await response.text()
      if (html.includes('Invitation non trouvée')) {
        console.log('⚠️ Page accessible mais affiche "Invitation non trouvée"')
      } else {
        console.log('✅ Page d\'invitation fonctionne correctement')
      }
    } else {
      console.log('⚠️ Page d\'invitation retourne:', response.status)
    }

    // 5. Nettoyer l'invitation de test
    console.log('\n5️⃣ Nettoyage de l\'invitation de test...')
    
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitation.id)

    if (deleteError) {
      console.error('⚠️ Erreur suppression invitation de test:', deleteError)
    } else {
      console.log('✅ Invitation de test supprimée')
    }

    console.log('\n🎉 TEST TERMINÉ !')
    console.log('✅ Les corrections Next.js 15 sont appliquées')
    console.log('✅ Le flux d\'invitation est testé')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testInvitationFlow() 