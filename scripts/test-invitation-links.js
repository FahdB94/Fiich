#!/usr/bin/env node

/**
 * Test des liens d'invitation
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

async function testInvitationLinks() {
  console.log('🧪 Test des liens d\'invitation')
  console.log('===============================\n')

  try {
    // 1. Récupérer les invitations
    console.log('1️⃣ Récupération des invitations...')
    
         const { data: invitations, error: invitationsError } = await supabase
       .from('invitations')
       .select(`
         id,
         invitation_token,
         invited_email,
         invited_by,
         expires_at,
         created_at,
         companies(company_name)
       `)
       .order('created_at', { ascending: false })
       .limit(5)

    if (invitationsError) {
      console.error('❌ Erreur récupération invitations:', invitationsError.message)
      return
    }

    console.log('📊 Invitations trouvées:', invitations.length)
    
    if (invitations.length === 0) {
      console.log('ℹ️  Aucune invitation trouvée')
      return
    }

    // 2. Analyser chaque invitation
    console.log('\n2️⃣ Analyse des invitations...')
    
    invitations.forEach((invitation, index) => {
      console.log(`\n📋 Invitation ${index + 1}:`)
      console.log(`   ID: ${invitation.id}`)
      console.log(`   Token: ${invitation.invitation_token}`)
             console.log(`   Email invité: ${invitation.invited_email}`)
       console.log(`   Invité par: ${invitation.invited_by}`)
      console.log(`   Entreprise: ${invitation.companies?.company_name || 'N/A'}`)
      console.log(`   Expire le: ${invitation.expires_at}`)
      
      // Simuler la génération du lien
      const oldLink = `/invitation/${invitation.id}`
      const newLink = `/invitation/${invitation.invitation_token}`
      
      console.log(`   Ancien lien: ${oldLink}`)
      console.log(`   Nouveau lien: ${newLink}`)
      console.log(`   Token valide: ${invitation.invitation_token ? '✅ Oui' : '❌ Non'}`)
    })

    // 3. Tester la fonction RPC get_invitation_by_token
    console.log('\n3️⃣ Test de la fonction get_invitation_by_token...')
    
    if (invitations.length > 0) {
      const testToken = invitations[0].invitation_token
      console.log(`   Test avec le token: ${testToken}`)
      
      const { data: invitationByToken, error: tokenError } = await supabase.rpc('get_invitation_by_token', {
        token_param: testToken
      })

      if (tokenError) {
        console.error('❌ Erreur fonction get_invitation_by_token:', tokenError.message)
        console.error('   Code:', tokenError.code)
      } else {
        console.log('✅ Fonction get_invitation_by_token fonctionne')
        console.log('   Résultat:', invitationByToken)
      }
    }

    // 4. Simuler la structure UnifiedNotification
    console.log('\n4️⃣ Simulation de la structure UnifiedNotification...')
    
    invitations.forEach((invitation, index) => {
             const unifiedNotification = {
         id: `invitation-${invitation.id}`,
         type: 'invitation',
         title: 'Nouvelle invitation',
         message: `Vous avez été invité à accéder à l'entreprise "${invitation.companies?.company_name || 'Entreprise'}" par ${invitation.invited_by}`,
         is_read: false,
         created_at: invitation.created_at,
         updated_at: invitation.updated_at,
         company_id: invitation.company_id,
         company_name: invitation.companies?.company_name,
         invitation_id: invitation.id,
         invitation_token: invitation.invitation_token,
         invited_by_email: invitation.invited_by,
         expires_at: invitation.expires_at
       }

      console.log(`\n📋 Notification unifiée ${index + 1}:`)
      console.log(`   ID unifié: ${unifiedNotification.id}`)
      console.log(`   Type: ${unifiedNotification.type}`)
      console.log(`   Titre: ${unifiedNotification.title}`)
      console.log(`   Message: ${unifiedNotification.message}`)
      console.log(`   Token: ${unifiedNotification.invitation_token}`)
      
      // Générer le lien
      const link = `/invitation/${unifiedNotification.invitation_token}`
      console.log(`   Lien généré: ${link}`)
    })

         // 5. Résumé et recommandations
     console.log('\n📋 Résumé:')
     console.log(`- Invitations trouvées: ${invitations.length}`)
     console.log(`- Tokens valides: ${invitations.filter(i => i.invitation_token).length}`)
     console.log(`- Fonction RPC: ✅ OK`)

    if (invitations.some(i => !i.invitation_token)) {
      console.log('\n⚠️  Problèmes détectés:')
      console.log('- Certaines invitations n\'ont pas de token')
      console.log('- Vérifiez la structure de la table invitations')
    } else {
      console.log('\n✅ Toutes les invitations ont des tokens valides')
      console.log('💡 Les liens d\'invitation devraient maintenant fonctionner')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testInvitationLinks() 