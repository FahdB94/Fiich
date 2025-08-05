#!/usr/bin/env node

/**
 * Vérification de l'email de l'invitation
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkInvitationEmail() {
  console.log('🔍 Vérification de l\'email de l\'invitation')
  console.log('==========================================\n')

  try {
    // 1. Récupérer l'invitation par token
    console.log('1️⃣ Récupération de l\'invitation par token...')
    
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
    console.log(`   ID: ${invitationData.id}`)
    console.log(`   Token: ${invitationData.invitation_token}`)
    console.log(`   Email invité: ${invitationData.invited_email}`)
    console.log(`   Entreprise: ${invitationData.company_name}`)
    console.log(`   Invité par: ${invitationData.invited_by_email}`)
    console.log(`   Expire le: ${invitationData.expires_at}`)

    // 2. Vérifier si l'invitation est expirée
    console.log('\n2️⃣ Vérification de l\'expiration...')
    
    const isExpired = new Date(invitationData.expires_at) < new Date()
    console.log(`   Expirée: ${isExpired ? '❌ Oui' : '✅ Non'}`)
    
    if (isExpired) {
      console.log('⚠️  L\'invitation a expiré !')
      return
    }

    // 3. Vérifier les utilisateurs avec cet email
    console.log('\n3️⃣ Vérification des utilisateurs avec cet email...')
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError.message)
      return
    }

    const matchingUsers = users.users.filter(user => user.email === invitationData.invited_email)
    
    console.log(`   Utilisateurs trouvés avec l'email ${invitationData.invited_email}: ${matchingUsers.length}`)
    
    if (matchingUsers.length > 0) {
      matchingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`)
        console.log(`      Email: ${user.email}`)
        console.log(`      Créé le: ${user.created_at}`)
        console.log(`      Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`)
      })
    } else {
      console.log('   ℹ️  Aucun utilisateur trouvé avec cet email')
    }

    // 4. Recommandations
    console.log('\n📋 Recommandations:')
    console.log(`   Email de l'invitation: ${invitationData.invited_email}`)
    
    if (matchingUsers.length > 0) {
      console.log('   ✅ Un compte existe avec cet email')
      console.log('   💡 Connectez-vous avec cet email pour accéder à l\'invitation')
    } else {
      console.log('   ❌ Aucun compte avec cet email')
      console.log('   💡 Créez un compte avec cet email ou demandez une nouvelle invitation')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkInvitationEmail() 