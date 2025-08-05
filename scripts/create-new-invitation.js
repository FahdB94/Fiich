#!/usr/bin/env node

/**
 * Création d'une nouvelle invitation
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

async function createNewInvitation() {
  console.log('📧 Création d\'une nouvelle invitation')
  console.log('=====================================\n')

  try {
    // 1. Récupérer l'utilisateur connecté
    console.log('1️⃣ Vérification de l\'utilisateur connecté...')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ Vous devez être connecté pour créer une invitation')
      console.log('💡 Connectez-vous d\'abord')
      return
    }

    console.log('✅ Utilisateur connecté:', user.email)

    // 2. Récupérer les entreprises de l'utilisateur
    console.log('\n2️⃣ Récupération des entreprises...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .eq('owner_email', user.email)

    if (companiesError) {
      console.error('❌ Erreur récupération entreprises:', companiesError.message)
      return
    }

    if (!companies || companies.length === 0) {
      console.log('❌ Aucune entreprise trouvée pour cet utilisateur')
      return
    }

    console.log('✅ Entreprises trouvées:')
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.company_name} (${company.id})`)
    })

    // 3. Demander quelle entreprise partager
    console.log('\n3️⃣ Sélection de l\'entreprise à partager...')
    
    // Pour simplifier, prenons la première entreprise
    const selectedCompany = companies[0]
    console.log(`   Entreprise sélectionnée: ${selectedCompany.company_name}`)

    // 4. Demander l'email à inviter
    console.log('\n4️⃣ Email à inviter...')
    
    // Pour simplifier, utilisons l'email actuel
    const invitedEmail = user.email
    console.log(`   Email invité: ${invitedEmail}`)

    // 5. Créer l'invitation
    console.log('\n5️⃣ Création de l\'invitation...')
    
    const invitationToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expire dans 7 jours

    const { data: newInvitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        company_id: selectedCompany.id,
        invited_email: invitedEmail,
        invited_by: user.id,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (invitationError) {
      console.error('❌ Erreur création invitation:', invitationError.message)
      return
    }

    console.log('✅ Invitation créée avec succès !')
    console.log(`   ID: ${newInvitation.id}`)
    console.log(`   Token: ${invitationToken}`)
    console.log(`   Expire le: ${expiresAt.toLocaleString('fr-FR')}`)

    // 6. Afficher le lien
    console.log('\n6️⃣ Lien de l\'invitation:')
    console.log(`   http://localhost:3001/invitation/${invitationToken}`)
    
    console.log('\n✅ Nouvelle invitation créée !')
    console.log('💡 Testez ce lien dans votre navigateur')

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
  }
}

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Exécuter la création
createNewInvitation() 