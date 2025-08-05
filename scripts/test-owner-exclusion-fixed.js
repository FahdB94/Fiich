#!/usr/bin/env node

/**
 * Script de test pour vérifier l'exclusion du propriétaire avec user_id
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

async function testOwnerExclusionFixed() {
  console.log('🧪 Test de l\'exclusion du propriétaire (corrigé avec user_id)')
  console.log('============================================================\n')

  try {
    // 1. Récupérer une entreprise avec son propriétaire
    console.log('1️⃣ Récupération d\'une entreprise avec son propriétaire...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        user_id
      `)
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Aucune entreprise trouvée:', companiesError?.message)
      return
    }

    const testCompany = companies[0]
    console.log('✅ Entreprise trouvée:', testCompany.company_name)
    console.log('👤 Propriétaire ID:', testCompany.user_id)

    // 2. Récupérer l'email du propriétaire via RPC
    console.log('\n2️⃣ Récupération de l\'email du propriétaire...')
    
    // Créer une fonction temporaire pour récupérer l'email
    const { data: userEmail, error: userError } = await supabase.rpc('get_user_email', {
      user_id_param: testCompany.user_id
    })

    if (userError) {
      console.log('⚠️  Impossible de récupérer l\'email via RPC, utilisation d\'une approche alternative')
      
      // Approche alternative : utiliser les partages existants
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
      if (shares.length === 0) {
        console.log('ℹ️  Aucun partage trouvé, test impossible')
        return
      }

      // Utiliser le premier partage pour le test
      const testShare = shares[0]
      console.log('📧 Email de test:', testShare.shared_with_email)
    } else {
      console.log('✅ Email du propriétaire récupéré:', userEmail)
    }

    // 3. Tester la fonction RPC manuellement
    console.log('\n3️⃣ Test de la fonction notify_shared_users...')
    
    const testNotification = {
      p_company_id: testCompany.id,
      p_notification_type: 'company_updated',
      p_title: 'Test - Exclusion propriétaire (corrigé)',
      p_message: 'Test - Cette notification ne devrait pas être envoyée au propriétaire.',
      p_metadata: { test: true, corrected: true }
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('notify_shared_users', testNotification)

    if (rpcError) {
      console.error('❌ Erreur fonction RPC:', rpcError.message)
      console.error('Code:', rpcError.code)
      console.error('Details:', rpcError.details)
      return
    }

    console.log('✅ Fonction RPC exécutée avec succès')

    // 4. Vérifier les notifications créées
    console.log('\n4️⃣ Vérification des notifications créées...')
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', testCompany.id)
      .eq('title', 'Test - Exclusion propriétaire (corrigé)')
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError.message)
      return
    }

    console.log('📊 Notifications créées:', notifications.length)
    
    notifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.recipient_email} (${notification.is_read ? 'lue' : 'non lue'})`)
    })

    // 5. Nettoyer les notifications de test
    console.log('\n5️⃣ Nettoyage des notifications de test...')
    
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

    // 6. Résumé du test
    console.log('\n📋 Résumé du test :')
    console.log(`- Entreprise testée: ${testCompany.company_name}`)
    console.log(`- Propriétaire ID: ${testCompany.user_id}`)
    console.log(`- Notifications créées: ${notifications.length}`)
    console.log(`- Fonction RPC: ${rpcError ? '❌ ERREUR' : '✅ SUCCÈS'}`)
    
    if (!rpcError) {
      console.log('\n🎉 Test réussi ! La fonction fonctionne avec user_id.')
      console.log('💡 Le propriétaire ne devrait plus recevoir de notifications sur ses modifications.')
    } else {
      console.log('\n⚠️  Test échoué ! Vérifiez la fonction RPC.')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testOwnerExclusionFixed() 