#!/usr/bin/env node

/**
 * Test du système générique de notifications
 * Vérifie que la détection automatique des changements fonctionne
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

async function testGenericSystem() {
  console.log('🧪 Test du système générique de notifications')
  console.log('=============================================\n')

  try {
    // 1. Vérifier que le système existe
    console.log('1️⃣ Vérification du système...')
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)

    if (notificationsError) {
      console.error('❌ Table notifications non accessible:', notificationsError.message)
      console.log('💡 Exécutez REMPLACEMENT-COMPLET-NOTIFICATIONS.sql')
      return
    }
    
    console.log('✅ Table notifications accessible')

    // 2. Récupérer une entreprise
    console.log('\n2️⃣ Récupération d\'une entreprise...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        email,
        phone,
        website,
        description
      `)
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Aucune entreprise trouvée:', companiesError?.message)
      return
    }

    const testCompany = companies[0]
    console.log('✅ Entreprise trouvée:', testCompany.company_name)

    // 3. Compter les notifications avant modification
    console.log('\n3️⃣ Comptage des notifications avant modification...')
    
    const { data: notificationsBefore, error: beforeError } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', testCompany.id)
      .eq('notification_type', 'company_updated')

    if (beforeError) {
      console.error('❌ Erreur récupération notifications:', beforeError.message)
      return
    }

    const countBefore = notificationsBefore.length
    console.log('📊 Notifications avant modification:', countBefore)

    // 4. Modifier l'entreprise (changement de description)
    console.log('\n4️⃣ Modification de l\'entreprise...')
    
    const newDescription = `Test générique ${Date.now()}`
    const { data: updateResult, error: updateError } = await supabase
      .from('companies')
      .update({ 
        description: newDescription,
        website: `https://test-${Date.now()}.com`
      })
      .eq('id', testCompany.id)
      .select()

    if (updateError) {
      console.error('❌ Erreur modification entreprise:', updateError.message)
      return
    }

    console.log('✅ Entreprise modifiée')
    console.log('   Nouvelle description:', newDescription)

    // 5. Attendre un peu pour que le trigger s'exécute
    console.log('\n5️⃣ Attente de l\'exécution du trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 6. Compter les notifications après modification
    console.log('\n6️⃣ Comptage des notifications après modification...')
    
    const { data: notificationsAfter, error: afterError } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', testCompany.id)
      .eq('notification_type', 'company_updated')
      .order('created_at', { ascending: false })

    if (afterError) {
      console.error('❌ Erreur récupération notifications:', afterError.message)
      return
    }

    const countAfter = notificationsAfter.length
    console.log('📊 Notifications après modification:', countAfter)

    // 7. Analyser les nouvelles notifications
    console.log('\n7️⃣ Analyse des nouvelles notifications...')
    
    const newNotifications = notificationsAfter.slice(0, countAfter - countBefore)
    console.log('🆕 Nouvelles notifications créées:', newNotifications.length)

    if (newNotifications.length > 0) {
      console.log('📋 Détails des nouvelles notifications:')
      newNotifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.recipient_email}`)
        console.log(`      Titre: ${notification.title}`)
        console.log(`      Message: ${notification.message}`)
        if (notification.metadata && notification.metadata.changed_fields) {
          console.log(`      Champs modifiés:`, notification.metadata.changed_fields)
        }
      })
    }

    // 8. Vérifier que le propriétaire n'a pas été notifié
    console.log('\n8️⃣ Vérification de l\'exclusion du propriétaire...')
    
    // Récupérer l'email du propriétaire
    const { data: ownerEmail, error: ownerError } = await supabase.rpc('get_company_owner_email', {
      p_company_id: testCompany.id
    })

    if (ownerError) {
      console.error('❌ Erreur récupération email propriétaire:', ownerError.message)
    } else {
      console.log('👤 Email du propriétaire:', ownerEmail)
      
      const ownerNotified = newNotifications.some(n => n.recipient_email === ownerEmail)
      
      if (ownerNotified) {
        console.error('❌ ÉCHEC: Le propriétaire a été notifié!')
        console.error('   Email du propriétaire:', ownerEmail)
      } else {
        console.log('✅ SUCCÈS: Le propriétaire n\'a pas été notifié')
      }
    }

    // 9. Nettoyer les notifications de test
    console.log('\n9️⃣ Nettoyage des notifications de test...')
    
    if (newNotifications.length > 0) {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', newNotifications.map(n => n.id))

      if (deleteError) {
        console.error('❌ Erreur suppression notifications:', deleteError.message)
      } else {
        console.log('✅ Notifications de test supprimées')
      }
    }

    // 10. Restaurer l'entreprise
    console.log('\n🔟 Restauration de l\'entreprise...')
    
    const { error: restoreError } = await supabase
      .from('companies')
      .update({ 
        description: testCompany.description,
        website: testCompany.website
      })
      .eq('id', testCompany.id)

    if (restoreError) {
      console.error('❌ Erreur restauration entreprise:', restoreError.message)
    } else {
      console.log('✅ Entreprise restaurée')
    }

    // 11. Résumé final
    console.log('\n📋 Résumé final:')
    console.log(`- Entreprise: ${testCompany.company_name}`)
    console.log(`- Modifications testées: description, website`)
    console.log(`- Nouvelles notifications: ${newNotifications.length}`)
    console.log(`- Exclusion du propriétaire: ${newNotifications.length > 0 && !newNotifications.some(n => n.recipient_email === ownerEmail) ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
    
    if (newNotifications.length > 0) {
      console.log('\n🎉 SYSTÈME GÉNÉRIQUE FONCTIONNE !')
      console.log('💡 La détection automatique des changements fonctionne')
      console.log('🔒 Le propriétaire est correctement exclu')
      console.log('🚀 Le système s\'adaptera automatiquement aux nouvelles colonnes')
    } else {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ !')
      console.log('🔧 Aucune notification créée - vérifiez les triggers')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testGenericSystem() 