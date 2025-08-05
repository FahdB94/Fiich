#!/usr/bin/env node

/**
 * Diagnostic du problème d'UUID dans les notifications
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

async function debugUUIDIssue() {
  console.log('🔍 Diagnostic du problème d\'UUID')
  console.log('==================================\n')

  try {
    // 1. Vérifier les notifications existantes
    console.log('1️⃣ Vérification des notifications existantes...')
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError.message)
      return
    }

    console.log('📊 Notifications trouvées:', notifications.length)
    
    if (notifications.length > 0) {
      console.log('📋 Détails des IDs:')
      notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ID: ${notification.id}`)
        console.log(`      Longueur: ${notification.id.length} caractères`)
        console.log(`      Titre: ${notification.title}`)
        console.log(`      Format UUID valide: ${isValidUUID(notification.id)}`)
        console.log('')
      })
    }

    // 2. Créer une notification de test pour voir l'UUID généré
    console.log('2️⃣ Création d\'une notification de test...')
    
    // Récupérer une vraie entreprise
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Aucune entreprise trouvée:', companiesError?.message)
      return
    }

    const testNotification = {
      recipient_email: 'debug@example.com',
      company_id: companies[0].id,
      notification_type: 'company_updated',
      title: 'Test UUID Debug',
      message: 'Test pour diagnostiquer le problème d\'UUID',
      metadata: { debug: true, timestamp: Date.now() },
      is_read: false
    }

    const { data: createdNotification, error: createError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single()

    if (createError) {
      console.error('❌ Erreur création notification:', createError.message)
      return
    }

    console.log('✅ Notification de test créée:')
    console.log(`   ID: ${createdNotification.id}`)
    console.log(`   Longueur: ${createdNotification.id.length} caractères`)
    console.log(`   Format UUID valide: ${isValidUUID(createdNotification.id)}`)
    console.log(`   Titre: ${createdNotification.title}`)

    // 3. Tester la mise à jour avec l'ID complet
    console.log('\n3️⃣ Test de mise à jour avec l\'ID complet...')
    
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', createdNotification.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour avec ID complet:', updateError.message)
      console.error('   Code:', updateError.code)
    } else {
      console.log('✅ Mise à jour réussie avec ID complet')
      console.log(`   Lu: ${updatedNotification.is_read}`)
    }

    // 4. Tester avec un ID tronqué (simuler le problème)
    console.log('\n4️⃣ Test avec un ID tronqué (simulation du problème)...')
    
    const truncatedId = createdNotification.id.substring(0, 8)
    console.log(`   ID tronqué: ${truncatedId}`)
    
    const { error: truncatedError } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', truncatedId)

    if (truncatedError) {
      console.log('✅ Erreur attendue avec ID tronqué:', truncatedError.message)
      console.log('   Code:', truncatedError.code)
    } else {
      console.log('⚠️  Pas d\'erreur avec ID tronqué (inattendu)')
    }

    // 5. Nettoyer la notification de test
    console.log('\n5️⃣ Nettoyage de la notification de test...')
    
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', createdNotification.id)

    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError.message)
    } else {
      console.log('✅ Notification de test supprimée')
    }

    // 6. Analyser le problème
    console.log('\n📋 Analyse du problème:')
    
    if (notifications.length > 0) {
      const invalidUUIDs = notifications.filter(n => !isValidUUID(n.id))
      console.log(`- UUIDs invalides trouvés: ${invalidUUIDs.length}`)
      
      if (invalidUUIDs.length > 0) {
        console.log('🔧 Problème identifié: UUIDs invalides dans la base')
        console.log('💡 Solution: Recréer la table notifications avec REMPLACEMENT-COMPLET-NOTIFICATIONS.sql')
      } else {
        console.log('✅ Tous les UUIDs sont valides')
        console.log('🔧 Le problème vient probablement du frontend')
        console.log('💡 Vérifiez comment les IDs sont traités dans le hook use-notifications')
      }
    }

    console.log('\n🎯 Recommandations:')
    console.log('1. Si des UUIDs invalides: Exécutez REMPLACEMENT-COMPLET-NOTIFICATIONS.sql')
    console.log('2. Si tous les UUIDs sont valides: Vérifiez le hook use-notifications')
    console.log('3. Vérifiez que les IDs ne sont pas tronqués dans le frontend')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Fonction pour valider un UUID
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Exécuter le diagnostic
debugUUIDIssue() 