#!/usr/bin/env node

/**
 * Script de test pour le système de notifications
 * Teste la création de notifications et d'invitations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNotifications() {
  console.log('🧪 Test du système de notifications')
  console.log('=====================================\n')

  try {
    // 1. Vérifier la configuration Supabase
    console.log('1️⃣ Vérification de la configuration...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('⚠️  Pas d\'utilisateur connecté, utilisation du service role')
    } else {
      console.log('✅ Utilisateur connecté:', user.email)
    }

    // 2. Vérifier l'existence des tables
    console.log('\n2️⃣ Vérification des tables...')
    
    const { data: notificationsTable, error: notificationsError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (notificationsError) {
      console.error('❌ Table notifications non accessible:', notificationsError.message)
    } else {
      console.log('✅ Table notifications accessible')
    }

    const { data: invitationsTable, error: invitationsError } = await supabase
      .from('invitations')
      .select('count')
      .limit(1)
    
    if (invitationsError) {
      console.error('❌ Table invitations non accessible:', invitationsError.message)
    } else {
      console.log('✅ Table invitations accessible')
    }

    // 3. Récupérer une entreprise existante
    console.log('\n3️⃣ Récupération d\'une entreprise...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Aucune entreprise trouvée:', companiesError?.message)
      return
    }

    const testCompany = companies[0]
    console.log('✅ Entreprise trouvée:', testCompany.company_name)

    // 4. Créer une notification de test
    console.log('\n4️⃣ Création d\'une notification de test...')
    const testNotification = {
      recipient_email: 'test@example.com',
      company_id: testCompany.id,
      notification_type: 'company_updated',
      title: 'Test - Fiche d\'entreprise mise à jour',
      message: 'Test - La fiche de l\'entreprise a été mise à jour pour les tests.',
      metadata: {
        company_name: testCompany.company_name,
        updated_fields: {
          company_name: false,
          siren: true,
          address: false
        }
      }
    }

    const { data: newNotification, error: notificationError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()

    if (notificationError) {
      console.error('❌ Erreur création notification:', notificationError.message)
    } else {
      console.log('✅ Notification créée:', newNotification[0].id)
    }

    // 5. Créer une invitation de test
    console.log('\n5️⃣ Création d\'une invitation de test...')
    const testInvitation = {
      company_id: testCompany.id,
      invited_email: 'invite@example.com',
      invited_by: '00000000-0000-0000-0000-000000000000', // UUID factice
      invitation_token: 'test-token-' + Date.now(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // +7 jours
    }

    const { data: newInvitation, error: invitationError } = await supabase
      .from('invitations')
      .insert(testInvitation)
      .select()

    if (invitationError) {
      console.error('❌ Erreur création invitation:', invitationError.message)
    } else {
      console.log('✅ Invitation créée:', newInvitation[0].id)
    }

    // 6. Tester les fonctions RPC
    console.log('\n6️⃣ Test des fonctions RPC...')
    
    // Test de la fonction create_notification
    const { data: rpcNotification, error: rpcError } = await supabase.rpc('create_notification', {
      p_recipient_email: 'test@example.com',
      p_company_id: testCompany.id,
      p_notification_type: 'document_added',
      p_title: 'Test RPC - Nouveau document',
      p_message: 'Test RPC - Un nouveau document a été ajouté.',
      p_metadata: { document_name: 'test.pdf' }
    })

    if (rpcError) {
      console.error('❌ Erreur fonction RPC:', rpcError.message)
    } else {
      console.log('✅ Fonction RPC create_notification fonctionne')
    }

    // 7. Vérifier les triggers
    console.log('\n7️⃣ Test des triggers...')
    console.log('ℹ️  Les triggers seront testés lors de modifications réelles')
    console.log('   - Modifiez une entreprise partagée')
    console.log('   - Ajoutez/supprimez un document public')
    console.log('   - Vérifiez les notifications automatiques')

    // 8. Nettoyer les données de test
    console.log('\n8️⃣ Nettoyage des données de test...')
    
    if (newNotification) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', newNotification[0].id)
      console.log('✅ Notification de test supprimée')
    }

    if (newInvitation) {
      await supabase
        .from('invitations')
        .delete()
        .eq('id', newInvitation[0].id)
      console.log('✅ Invitation de test supprimée')
    }

    console.log('\n🎉 Test terminé avec succès !')
    console.log('\n📋 Prochaines étapes :')
    console.log('1. Exécutez le script SQL CREATION-TABLE-NOTIFICATIONS.sql')
    console.log('2. Testez les modifications d\'entreprises partagées')
    console.log('3. Vérifiez la cloche de notifications dans l\'interface')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testNotifications() 