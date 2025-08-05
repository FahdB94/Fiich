#!/usr/bin/env node

/**
 * Script pour vérifier le statut de la fonction notify_shared_users
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

async function checkFunctionStatus() {
  console.log('🔍 Vérification du statut de la fonction notify_shared_users')
  console.log('==========================================================\n')

  try {
    // 1. Récupérer une entreprise avec son propriétaire
    console.log('1️⃣ Récupération d\'une entreprise...')
    
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

    // 2. Récupérer les partages
    console.log('\n2️⃣ Récupération des partages...')
    
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
    shares.forEach((share, index) => {
      console.log(`   ${index + 1}. ${share.shared_with_email} (actif: ${share.is_active})`)
    })

    // 3. Tester la fonction avec des données de debug
    console.log('\n3️⃣ Test de la fonction avec debug...')
    
    // Créer une notification de test avec un titre unique
    const testTitle = `Debug Test ${Date.now()}`
    const testNotification = {
      p_company_id: testCompany.id,
      p_notification_type: 'company_updated',
      p_title: testTitle,
      p_message: 'Test de debug pour vérifier l\'exclusion du propriétaire.',
      p_metadata: { debug: true, timestamp: Date.now() }
    }

    console.log('📋 Paramètres de test:')
    console.log('   - Company ID:', testNotification.p_company_id)
    console.log('   - Title:', testNotification.p_title)
    console.log('   - Type:', testNotification.p_notification_type)

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
        console.log(`      - ID: ${notification.id}`)
        console.log(`      - Type: ${notification.notification_type}`)
        console.log(`      - Créée: ${notification.created_at}`)
        console.log(`      - Lue: ${notification.is_read}`)
      })
    }

    // 5. Analyser le problème
    console.log('\n5️⃣ Analyse du problème...')
    
    if (notifications.length > 0) {
      const recipientEmails = notifications.map(n => n.recipient_email)
      console.log('📧 Emails notifiés:', recipientEmails)
      
      // Vérifier si le propriétaire a été notifié
      // Pour cela, on va essayer de récupérer l'email du propriétaire
      console.log('\n🔍 Tentative de récupération de l\'email du propriétaire...')
      
      // On va utiliser une approche différente : regarder les partages
      // Si l'utilisateur partagé est le même que le propriétaire, c'est le problème
      const ownerEmail = shares.find(share => share.shared_with_email)?.shared_with_email
      
      if (ownerEmail && recipientEmails.includes(ownerEmail)) {
        console.error('❌ PROBLÈME IDENTIFIÉ: Le propriétaire reçoit encore des notifications!')
        console.error('   Email du propriétaire:', ownerEmail)
        console.error('   La fonction n\'a pas été mise à jour ou il y a un bug')
      } else {
        console.log('✅ Le propriétaire ne semble pas avoir été notifié')
        console.log('   Emails notifiés:', recipientEmails)
      }
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

    // 7. Recommandations
    console.log('\n📋 Recommandations:')
    console.log('1. Vérifiez que CORRECTION-FONCTION-SEULE.sql a été exécuté')
    console.log('2. Vérifiez que la fonction a bien été mise à jour')
    console.log('3. Testez avec une vraie modification d\'entreprise')
    console.log('4. Vérifiez les logs de la base de données')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkFunctionStatus() 