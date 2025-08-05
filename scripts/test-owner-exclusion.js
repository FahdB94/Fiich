#!/usr/bin/env node

/**
 * Script de test pour vérifier l'exclusion du propriétaire des notifications
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

async function testOwnerExclusion() {
  console.log('🧪 Test de l\'exclusion du propriétaire des notifications')
  console.log('========================================================\n')

  try {
    // 1. Récupérer une entreprise avec son propriétaire
    console.log('1️⃣ Récupération d\'une entreprise avec son propriétaire...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        owner_id,
        auth.users!inner(email)
      `)
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Aucune entreprise trouvée:', companiesError?.message)
      return
    }

    const testCompany = companies[0]
    const ownerEmail = testCompany.users.email
    console.log('✅ Entreprise trouvée:', testCompany.company_name)
    console.log('👤 Propriétaire:', ownerEmail)

    // 2. Vérifier les partages existants
    console.log('\n2️⃣ Vérification des partages existants...')
    
    const { data: shares, error: sharesError } = await supabase
      .from('company_shares')
      .select('*')
      .eq('company_id', testCompany.id)
      .eq('is_active', true)

    if (sharesError) {
      console.error('❌ Erreur récupération partages:', sharesError.message)
      return
    }

    console.log('📊 Partages trouvés:', shares.length)
    shares.forEach(share => {
      console.log(`   - ${share.shared_with_email} (${share.is_active ? 'actif' : 'inactif'})`)
    })

    // 3. Tester la fonction RPC manuellement
    console.log('\n3️⃣ Test de la fonction notify_shared_users...')
    
    const testNotification = {
      p_company_id: testCompany.id,
      p_notification_type: 'company_updated',
      p_title: 'Test - Exclusion propriétaire',
      p_message: 'Test - Cette notification ne devrait pas être envoyée au propriétaire.',
      p_metadata: { test: true }
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('notify_shared_users', testNotification)

    if (rpcError) {
      console.error('❌ Erreur fonction RPC:', rpcError.message)
      return
    }

    console.log('✅ Fonction RPC exécutée avec succès')

    // 4. Vérifier les notifications créées
    console.log('\n4️⃣ Vérification des notifications créées...')
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', testCompany.id)
      .eq('title', 'Test - Exclusion propriétaire')
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError.message)
      return
    }

    console.log('📊 Notifications créées:', notifications.length)
    
    let ownerReceivedNotification = false
    notifications.forEach(notification => {
      console.log(`   - ${notification.recipient_email} (${notification.is_read ? 'lue' : 'non lue'})`)
      if (notification.recipient_email === ownerEmail) {
        ownerReceivedNotification = true
      }
    })

    // 5. Vérifier l'exclusion du propriétaire
    console.log('\n5️⃣ Vérification de l\'exclusion du propriétaire...')
    
    if (ownerReceivedNotification) {
      console.error('❌ ERREUR: Le propriétaire a reçu une notification !')
      console.error('   Le propriétaire ne devrait pas être notifié de ses propres modifications')
    } else {
      console.log('✅ SUCCÈS: Le propriétaire n\'a pas reçu de notification')
      console.log('   L\'exclusion fonctionne correctement')
    }

    // 6. Nettoyer les notifications de test
    console.log('\n6️⃣ Nettoyage des notifications de test...')
    
    if (notifications.length > 0) {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', notifications.map(n => n.id))

      if (deleteError) {
        console.error('❌ Erreur suppression notifications:', deleteError.message)
      } else {
        console.log('✅ Notifications de test supprimées')
      }
    }

    // 7. Résumé du test
    console.log('\n📋 Résumé du test :')
    console.log(`- Entreprise testée: ${testCompany.company_name}`)
    console.log(`- Propriétaire: ${ownerEmail}`)
    console.log(`- Partages actifs: ${shares.length}`)
    console.log(`- Notifications créées: ${notifications.length}`)
    console.log(`- Propriétaire notifié: ${ownerReceivedNotification ? '❌ ERREUR' : '✅ CORRECT'}`)
    
    if (!ownerReceivedNotification) {
      console.log('\n🎉 Test réussi ! L\'exclusion du propriétaire fonctionne correctement.')
    } else {
      console.log('\n⚠️  Test échoué ! Le propriétaire reçoit encore des notifications.')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testOwnerExclusion() 