#!/usr/bin/env node

/**
 * Test de la page d'invitation
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInvitationPage() {
  console.log('🧪 Test de la page d\'invitation')
  console.log('================================\n')

  const invitationToken = 'gatyP89dwM03o6wki4Er6lxZjFgsqYIPdN2NI-ke2fg'

  try {
    // 1. Vérifier que l'invitation existe
    console.log('1️⃣ Vérification de l\'existence de l\'invitation...')
    
    const { data: invitation, error: invitationError } = await supabase.rpc('get_invitation_by_token', {
      token_param: invitationToken
    })

    if (invitationError) {
      console.error('❌ Erreur récupération invitation:', invitationError.message)
      console.error('   Code:', invitationError.code)
      console.error('   Détails:', invitationError.details)
      return
    }

    if (!invitation || invitation.length === 0) {
      console.log('❌ Invitation non trouvée')
      console.log('💡 Vérifiez que le token est correct')
      return
    }

    const invitationData = invitation[0]
    console.log('✅ Invitation trouvée:')
    console.log(`   ID: ${invitationData.id}`)
    console.log(`   Email invité: ${invitationData.invited_email}`)
    console.log(`   Entreprise: ${invitationData.company_name}`)
    console.log(`   Invité par: ${invitationData.invited_by_email}`)
    console.log(`   Token: ${invitationData.invitation_token}`)
    console.log(`   Expire le: ${new Date(invitationData.expires_at).toLocaleString('fr-FR')}`)
    console.log(`   Créée le: ${new Date(invitationData.created_at).toLocaleString('fr-FR')}`)

    // 2. Vérifier si l'invitation a expiré
    console.log('\n2️⃣ Vérification de l\'expiration...')
    
    const isExpired = new Date(invitationData.expires_at) < new Date()
    console.log(`   Expirée: ${isExpired ? '❌ Oui' : '✅ Non'}`)
    
    if (isExpired) {
      console.log('⚠️  L\'invitation a expiré')
      console.log('💡 Demandez une nouvelle invitation')
      return
    }

    // 3. Vérifier l'entreprise
    console.log('\n3️⃣ Vérification de l\'entreprise...')
    
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('id', invitationData.company_id)
      .single()

    if (companyError) {
      console.error('❌ Erreur récupération entreprise:', companyError.message)
      return
    }

    if (!company) {
      console.log('❌ Entreprise non trouvée')
      return
    }

    console.log('✅ Entreprise trouvée:')
    console.log(`   ID: ${company.id}`)
    console.log(`   Nom: ${company.company_name}`)

    // 4. Vérifier si un partage existe déjà
    console.log('\n4️⃣ Vérification des partages existants...')
    
    const { data: existingShares, error: sharesError } = await supabase
      .from('company_shares')
      .select('id, shared_with_email, is_active')
      .eq('company_id', invitationData.company_id)
      .eq('shared_with_email', invitationData.invited_email)

    if (sharesError) {
      console.error('❌ Erreur récupération partages:', sharesError.message)
      return
    }

    if (existingShares && existingShares.length > 0) {
      console.log('⚠️  Partage(s) existant(s):')
      existingShares.forEach((share, index) => {
        console.log(`   ${index + 1}. ID: ${share.id}, Actif: ${share.is_active ? '✅ Oui' : '❌ Non'}`)
      })
    } else {
      console.log('✅ Aucun partage existant')
    }

    // 5. Résumé de la logique de la page
    console.log('\n5️⃣ Logique de la page d\'invitation...')
    console.log('   URL: http://localhost:3000/invitation/' + invitationToken)
    console.log('   État attendu:')
    console.log('   - Si non connecté → "Se connecter/Créer un compte"')
    console.log('   - Si connecté avec mauvais email → "Accès non autorisé"')
    console.log('   - Si connecté avec bon email → "Accepter/Refuser"')

    console.log('\n✅ Test terminé avec succès !')
    console.log('💡 Vous pouvez maintenant tester la page dans votre navigateur')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testInvitationPage() 