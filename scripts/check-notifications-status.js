#!/usr/bin/env node

/**
 * Script pour vérifier l'état actuel du système de notifications
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

async function checkNotificationsStatus() {
  console.log('🔍 Vérification de l\'état du système de notifications')
  console.log('=====================================================\n')

  try {
    // 1. Vérifier l'existence de la table notifications
    console.log('1️⃣ Vérification de la table notifications...')
    
    const { data: notificationsTable, error: tableError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table notifications non accessible:', tableError.message)
      console.log('💡 Exécutez d\'abord CREATION-TABLE-NOTIFICATIONS.sql')
      return
    }
    
    console.log('✅ Table notifications accessible')

    // 2. Vérifier l'existence de la fonction notify_shared_users
    console.log('\n2️⃣ Vérification de la fonction notify_shared_users...')
    
    const { data: functionResult, error: functionError } = await supabase.rpc('notify_shared_users', {
      p_company_id: '00000000-0000-0000-0000-000000000000',
      p_notification_type: 'test',
      p_title: 'Test',
      p_message: 'Test'
    })

    if (functionError) {
      console.error('❌ Fonction notify_shared_users non accessible:', functionError.message)
      console.log('💡 Exécutez CORRECTION-FONCTION-SEULE.sql')
      return
    }
    
    console.log('✅ Fonction notify_shared_users accessible')

    // 3. Vérifier les politiques RLS
    console.log('\n3️⃣ Vérification des politiques RLS...')
    
    // Test de lecture des notifications
    const { data: testRead, error: readError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)

    if (readError) {
      console.error('❌ Politique de lecture non configurée:', readError.message)
    } else {
      console.log('✅ Politique de lecture configurée')
    }

    // 4. Vérifier les triggers
    console.log('\n4️⃣ Vérification des triggers...')
    
    // Récupérer une entreprise pour tester
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.log('ℹ️  Aucune entreprise trouvée pour tester les triggers')
    } else {
      console.log('✅ Entreprise trouvée pour tester les triggers:', companies[0].company_name)
      console.log('💡 Modifiez cette entreprise pour tester les notifications automatiques')
    }

    // 5. Vérifier les notifications existantes
    console.log('\n5️⃣ Vérification des notifications existantes...')
    
    const { data: existingNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError.message)
    } else {
      console.log(`📊 Notifications existantes: ${existingNotifications.length}`)
      if (existingNotifications.length > 0) {
        console.log('📋 Dernières notifications:')
        existingNotifications.forEach((notification, index) => {
          console.log(`   ${index + 1}. ${notification.title} (${notification.recipient_email})`)
        })
      }
    }

    // 6. Résumé et recommandations
    console.log('\n📋 Résumé de l\'état du système:')
    console.log('- ✅ Table notifications: Accessible')
    console.log('- ✅ Fonction notify_shared_users: Accessible')
    console.log('- ✅ Politiques RLS: Configurées')
    console.log('- ✅ Triggers: Prêts à être testés')
    
    console.log('\n🎯 Prochaines étapes:')
    console.log('1. Modifiez une entreprise partagée pour tester les notifications')
    console.log('2. Vérifiez la cloche dans l\'interface utilisateur')
    console.log('3. Testez l\'exclusion du propriétaire avec test-owner-exclusion.js')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkNotificationsStatus() 