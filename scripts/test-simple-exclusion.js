#!/usr/bin/env node

/**
 * Script pour tester la fonction simplifiée avec exclusion du propriétaire
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

async function testSimpleExclusion() {
  console.log('🧪 Test de la fonction simplifiée avec exclusion du propriétaire')
  console.log('================================================================\n')

  try {
    // 1. Récupérer une entreprise
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

    // 3. Identifier le propriétaire
    const ownerEmail = shares.find(share => share.shared_with_email)?.shared_with_email
    console.log('\n3️⃣ Email du propriétaire identifié:', ownerEmail)

    // 4. Tester la fonction simplifiée
    console.log('\n4️⃣ Test de la fonction simplifiée...')
    
    const testTitle = `Simple Test ${Date.now()}`
    const testNotification = {
      p_company_id: testCompany.id,
      p_notification_type: 'company_updated',
      p_title: testTitle,
      p_message: 'Test de la fonction simplifiée avec exclusion du propriétaire.',
      p_owner_email: ownerEmail,
      p_metadata: { test: 'simple', timestamp: Date.now() }
    }

    console.log('📋 Paramètres de test:')
    console.log('   - Company ID:', testNotification.p_company_id)
    console.log('   - Owner Email:', testNotification.p_owner_email)
    console.log('   - Title:', testNotification.p_title)

    const { data: rpcResult, error: rpcError } = await supabase.rpc('notify_shared_users_simple', testNotification)

    if (rpcError) {
      console.error('❌ Erreur fonction RPC:', rpcError.message)
      console.error('Code:', rpcError.code)
      console.error('Details:', rpcError.details)
      return
    }

    console.log('✅ Fonction RPC exécutée avec succès')

    // 5. Vérifier les notifications créées
    console.log('\n5️⃣ Vérification des notifications créées...')
    
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
      })
    }

    // 6. Analyser le résultat
    console.log('\n6️⃣ Analyse du résultat...')
    
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

    // 7. Nettoyer les notifications de test
    console.log('\n7️⃣ Nettoyage des notifications de test...')
    
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

    // 8. Résumé
    console.log('\n📋 Résumé du test:')
    console.log(`- Entreprise: ${testCompany.company_name}`)
    console.log(`- Propriétaire: ${ownerEmail}`)
    console.log(`- Notifications créées: ${notifications.length}`)
    console.log(`- Exclusion du propriétaire: ${notifications.length === 0 || !notifications.map(n => n.recipient_email).includes(ownerEmail) ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testSimpleExclusion() 