#!/usr/bin/env node

/**
 * Vérification de l'utilisateur connecté
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

async function checkCurrentUser() {
  console.log('👤 Vérification de l\'utilisateur connecté')
  console.log('=========================================\n')

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('❌ Erreur:', error.message)
      console.log('\n💡 Vous n\'êtes pas connecté ou la session a expiré')
      console.log('   Connectez-vous avec fahdbari94@gmail.com pour accéder à l\'invitation')
      return
    }

    if (!user) {
      console.log('ℹ️  Aucun utilisateur connecté')
      console.log('\n💡 Connectez-vous avec fahdbari94@gmail.com pour accéder à l\'invitation')
      return
    }

    console.log('✅ Utilisateur connecté:')
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Prénom: ${user.user_metadata?.first_name || 'Non défini'}`)
    console.log(`   Nom: ${user.user_metadata?.last_name || 'Non défini'}`)

    const expectedEmail = 'fahdbari94@gmail.com'
    const emailMatches = user.email === expectedEmail

    console.log('\n📧 Vérification de l\'email:')
    console.log(`   Email attendu: ${expectedEmail}`)
    console.log(`   Email actuel: ${user.email}`)
    console.log(`   Correspondance: ${emailMatches ? '✅ OK' : '❌ DIFFÉRENT'}`)

    if (emailMatches) {
      console.log('\n✅ Parfait ! Vous êtes connecté avec le bon email')
      console.log('💡 Vous devriez voir "Accepter/Refuser" sur la page d\'invitation')
    } else {
      console.log('\n⚠️  PROBLÈME ! Vous êtes connecté avec un mauvais email')
      console.log('💡 Solutions:')
      console.log('   1. Déconnectez-vous et reconnectez-vous avec fahdbari94@gmail.com')
      console.log('   2. Ou demandez une nouvelle invitation avec votre email actuel')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkCurrentUser() 