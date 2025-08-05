#!/usr/bin/env node

/**
 * Débogage de la page d'invitation
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

async function debugInvitationPage() {
  console.log('🔍 Débogage de la page d\'invitation')
  console.log('====================================\n')

  const invitationToken = 'gatyP89dwM03o6wki4Er6lxZjFgsqYIPdN2NI-ke2fg'

  try {
    // 1. Simuler la récupération du token
    console.log('1️⃣ Token d\'invitation:', invitationToken)

    // 2. Simuler checkAuth()
    console.log('\n2️⃣ Simulation de checkAuth()...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError.message)
      console.log('   → Condition: !user = true')
      console.log('   → Affichage attendu: "Se connecter/Créer un compte"')
      return
    }

    if (!user) {
      console.log('ℹ️  Aucun utilisateur connecté')
      console.log('   → Condition: !user = true')
      console.log('   → Affichage attendu: "Se connecter/Créer un compte"')
      return
    }

    console.log('✅ Utilisateur connecté:')
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)

    // 3. Simuler fetchInvitation()
    console.log('\n3️⃣ Simulation de fetchInvitation()...')
    
    const { data: invitation, error: invitationError } = await supabase.rpc('get_invitation_by_token', {
      token_param: invitationToken
    })

    if (invitationError) {
      console.error('❌ Erreur récupération invitation:', invitationError.message)
      console.log('   → Condition: error || !invitation = true')
      console.log('   → Affichage attendu: "Invitation non trouvée"')
      return
    }

    if (!invitation || invitation.length === 0) {
      console.log('❌ Invitation non trouvée')
      console.log('   → Condition: error || !invitation = true')
      console.log('   → Affichage attendu: "Invitation non trouvée"')
      return
    }

    const invitationData = invitation[0]
    console.log('✅ Invitation récupérée:')
    console.log(`   Email invité: ${invitationData.invited_email}`)
    console.log(`   Entreprise: ${invitationData.company_name}`)

    // 4. Simuler la logique d'affichage
    console.log('\n4️⃣ Simulation de la logique d\'affichage...')
    
    const userEmail = user.email
    const invitedEmail = invitationData.invited_email
    
    console.log(`   Email utilisateur: ${userEmail}`)
    console.log(`   Email invité: ${invitedEmail}`)
    console.log(`   Correspondance: ${userEmail === invitedEmail ? '✅ OK' : '❌ DIFFÉRENT'}`)

    // Vérifier les conditions dans l'ordre
    console.log('\n5️⃣ Vérification des conditions:')
    
    // Condition 1: !user
    console.log(`   Condition 1 (!user): ${!user ? '✅ VRAI' : '❌ FAUX'}`)
    if (!user) {
      console.log('   → Affichage: "Se connecter/Créer un compte"')
      return
    }

    // Condition 2: user && user.email !== invitation.invited_email
    const emailMismatch = user && user.email !== invitationData.invited_email
    console.log(`   Condition 2 (user && user.email !== invitation.invited_email): ${emailMismatch ? '✅ VRAI' : '❌ FAUX'}`)
    if (emailMismatch) {
      console.log('   → Affichage: "Accès non autorisé"')
      return
    }

    // Sinon, afficher "Accepter/Refuser"
    console.log('   → Aucune condition vraie')
    console.log('   → Affichage: "Accepter/Refuser"')

    // 6. Vérifier l'expiration
    console.log('\n6️⃣ Vérification de l\'expiration...')
    
    const isExpired = new Date(invitationData.expires_at) < new Date()
    console.log(`   Expirée: ${isExpired ? '❌ Oui' : '✅ Non'}`)
    
    if (isExpired) {
      console.log('   → L\'invitation a expiré, les boutons seront désactivés')
    } else {
      console.log('   → L\'invitation est valide, les boutons seront actifs')
    }

    console.log('\n✅ Débogage terminé !')
    console.log('💡 Si vous voyez encore "Se connecter/Créer un compte", vérifiez:')
    console.log('   1. Que vous êtes bien connecté avec le bon email')
    console.log('   2. Que le cache du navigateur est vidé')
    console.log('   3. Que le serveur Next.js a redémarré')

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error)
  }
}

// Exécuter le débogage
debugInvitationPage() 