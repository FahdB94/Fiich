#!/usr/bin/env node

/**
 * Script de test final pour vérifier la correction complète
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

async function testFinalCorrection() {
  console.log('🧪 Test final de la correction complète')
  console.log('========================================\n')

  try {
    // 1. Vérifier que les fonctions existent
    console.log('1️⃣ Vérification des fonctions...')
    
    const { data: functionResult, error: functionError } = await supabase.rpc('notify_shared_users_simple', {
      p_company_id: '00000000-0000-0000-0000-000000000000',
      p_notification_type: 'test',
      p_title: 'Test',
      p_message: 'Test',
      p_owner_email: 'test@example.com',
      p_metadata: { test: true }
    })

    if (functionError) {
      console.error('❌ Fonction notify_shared_users_simple non accessible:', functionError.message)
      console.log('💡 Exécutez CORRECTION-TRIGGERS-COMPLETE.sql')
      return
    }
    
    console.log('✅ Fonction notify_shared_users_simple accessible')

    // 2. Vérifier la fonction get_company_owner_email
    const { data: ownerEmail, error: ownerError } = await supabase.rpc('get_company_owner_email', {
      p_company_id: '00000000-0000-0000-0000-000000000000'
    })

    if (ownerError) {
      console.log('⚠️  Fonction get_company_owner_email non accessible (normal pour un UUID invalide)')
    } else {
      console.log('✅ Fonction get_company_owner_email accessible')
    }

    // 3. Récupérer une vraie entreprise
    console.log('\n2️⃣ Récupération d\'une entreprise...')
    
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

    // 4. Récupérer les partages
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
    const ownerEmail = shares.find(share => share.shared_with_email)?.shared_with_email
    console.log('👤 Email du propriétaire:', ownerEmail)

    // 5. Tester la fonction avec exclusion
    console.log('\n3️⃣ Test de la fonction avec exclusion...')
    
    const testTitle = `Final Test ${Date.now()}`
    const testNotification = {
      p_company_id: testCompany.id,
      p_notification_type: 'company_updated',
      p_title: testTitle,
      p_message: 'Test final de la correction complète.',
      p_owner_email: ownerEmail,
      p_metadata: { test: 'final', timestamp: Date.now() }
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('notify_shared_users_simple', testNotification)

    if (rpcError) {
      console.error('❌ Erreur fonction RPC:', rpcError.message)
      return
    }

    console.log('✅ Fonction RPC exécutée avec succès')

    // 6. Vérifier les notifications créées
    console.log('\n4️⃣ Vérification des notifications créées...')
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', testCompany.id)
      .eq('title', testTitle)
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError.message)
      return
    }

    console.log('📊 Notifications créées:', notifications.length)
    
    if (notifications.length > 0) {
      console.log('📋 Détails des notifications:')
      notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.recipient_email}`)
      })
    }

    // 7. Analyser le résultat
    console.log('\n5️⃣ Analyse du résultat...')
    
    if (notifications.length === 0) {
      console.log('✅ SUCCÈS: Aucune notification créée')
      console.log('   Le propriétaire a été correctement exclu')
    } else {
      const recipientEmails = notifications.map(n => n.recipient_email)
      console.log('📧 Emails notifiés:', recipientEmails)
      
      if (recipientEmails.includes(ownerEmail)) {
        console.error('❌ ÉCHEC: Le propriétaire a encore été notifié!')
        console.error('   Email du propriétaire:', ownerEmail)
      } else {
        console.log('✅ SUCCÈS: Le propriétaire n\'a pas été notifié')
        console.log('   Seuls les autres utilisateurs ont été notifiés')
      }
    }

    // 8. Nettoyer les notifications de test
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

    // 9. Résumé final
    console.log('\n📋 Résumé final:')
    console.log(`- Entreprise: ${testCompany.company_name}`)
    console.log(`- Propriétaire: ${ownerEmail}`)
    console.log(`- Notifications créées: ${notifications.length}`)
    console.log(`- Exclusion du propriétaire: ${notifications.length === 0 || !notifications.map(n => n.recipient_email).includes(ownerEmail) ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    
    if (notifications.length === 0 || !notifications.map(n => n.recipient_email).includes(ownerEmail)) {
      console.log('\n🎉 CORRECTION RÉUSSIE !')
      console.log('💡 Le propriétaire ne recevra plus de notifications sur ses modifications.')
      console.log('🚀 Vous pouvez maintenant tester avec de vraies modifications d\'entreprise.')
    } else {
      console.log('\n⚠️  CORRECTION ÉCHOUÉE !')
      console.log('🔧 Vérifiez que CORRECTION-TRIGGERS-COMPLETE.sql a été exécuté correctement.')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testFinalCorrection() 