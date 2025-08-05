#!/usr/bin/env node

/**
 * Test de l'email de l'utilisateur connecté
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

async function testUserEmail() {
  console.log('🧪 Test de l\'email de l\'utilisateur connecté')
  console.log('=============================================\n')

  try {
    // 1. Vérifier l'utilisateur connecté
    console.log('1️⃣ Vérification de l\'utilisateur connecté...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError.message)
      return
    }

    if (!user) {
      console.log('ℹ️  Aucun utilisateur connecté')
      console.log('💡 Connectez-vous d\'abord pour tester l\'invitation')
      return
    }

    console.log('✅ Utilisateur connecté:')
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Prénom: ${user.user_metadata?.first_name || 'Non défini'}`)
    console.log(`   Nom: ${user.user_metadata?.last_name || 'Non défini'}`)

    // 2. Récupérer l'invitation
    console.log('\n2️⃣ Récupération de l\'invitation...')
    
    const invitationToken = 'gatyP89dwM03o6wki4Er6lxZjFgsqYIPdN2NI-ke2fg'
    
    const { data: invitation, error: invitationError } = await supabase.rpc('get_invitation_by_token', {
      token_param: invitationToken
    })

    if (invitationError) {
      console.error('❌ Erreur récupération invitation:', invitationError.message)
      return
    }

    if (!invitation || invitation.length === 0) {
      console.log('❌ Invitation non trouvée')
      return
    }

    const invitationData = invitation[0]
    console.log('✅ Invitation trouvée:')
    console.log(`   Email invité: ${invitationData.invited_email}`)
    console.log(`   Entreprise: ${invitationData.company_name}`)
    console.log(`   Invité par: ${invitationData.invited_by_email}`)

    // 3. Comparer les emails
    console.log('\n3️⃣ Comparaison des emails...')
    
    const userEmail = user.email
    const invitedEmail = invitationData.invited_email
    
    console.log(`   Email utilisateur: ${userEmail}`)
    console.log(`   Email invité: ${invitedEmail}`)
    console.log(`   Correspondance: ${userEmail === invitedEmail ? '✅ OK' : '❌ DIFFÉRENT'}`)

    if (userEmail !== invitedEmail) {
      console.log('\n⚠️  PROBLÈME IDENTIFIÉ !')
      console.log('🔧 L\'email de l\'utilisateur connecté ne correspond pas à l\'email de l\'invitation')
      console.log('💡 Solutions possibles:')
      console.log('   1. Connectez-vous avec l\'email de l\'invitation')
      console.log('   2. Demandez une nouvelle invitation avec votre email actuel')
      console.log('   3. Modifiez l\'email de votre compte')
    } else {
      console.log('\n✅ Les emails correspondent !')
      console.log('💡 L\'invitation devrait fonctionner correctement')
    }

    // 4. Test de la logique de la page d'invitation
    console.log('\n4️⃣ Test de la logique de la page d\'invitation...')
    
    const isUserConnected = !!user
    const emailsMatch = userEmail === invitedEmail
    
    console.log(`   Utilisateur connecté: ${isUserConnected ? '✅ Oui' : '❌ Non'}`)
    console.log(`   Emails correspondent: ${emailsMatch ? '✅ Oui' : '❌ Non'}`)
    
    if (isUserConnected && emailsMatch) {
      console.log('   → Devrait afficher: "Accepter/Refuser"')
    } else if (isUserConnected && !emailsMatch) {
      console.log('   → Devrait afficher: "Accès non autorisé"')
    } else if (!isUserConnected) {
      console.log('   → Devrait afficher: "Se connecter/Créer un compte"')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testUserEmail() 