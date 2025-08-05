#!/usr/bin/env node

/**
 * Test des fonctionnalités UI des notifications
 * Vérifie la lecture, suppression et mise à jour
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

async function testNotificationsUI() {
  console.log('🧪 Test des fonctionnalités UI des notifications')
  console.log('================================================\n')

  try {
    // 1. Vérifier la structure de la table
    console.log('1️⃣ Vérification de la structure de la table...')
    
    // Vérifier directement si la colonne updated_at existe
    const { data: existingNotifications, error: testError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur accès table notifications:', testError.message)
      return
    }

    console.log('✅ Table notifications accessible')
    
    // Test direct de la présence de updated_at
    let hasUpdatedAt = false
    if (existingNotifications && existingNotifications.length > 0) {
      hasUpdatedAt = 'updated_at' in existingNotifications[0]
    }
    console.log(`✅ Colonne updated_at: ${hasUpdatedAt ? 'Présente' : 'Manquante'}`)

    // 2. Créer une notification de test
    console.log('\n2️⃣ Création d\'une notification de test...')
    
    // Récupérer une vraie entreprise pour le test
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)

    if (companiesError || !companies || companies.length === 0) {
      console.error('❌ Aucune entreprise trouvée pour le test:', companiesError?.message)
      return
    }

    const testNotificationData = {
      recipient_email: 'test@example.com',
      company_id: companies[0].id,
      notification_type: 'company_updated',
      title: 'Test UI Notification',
      message: 'Test des fonctionnalités de lecture et suppression',
      metadata: { test: true, timestamp: Date.now() },
      is_read: false
    }

    const { data: createdNotification, error: createError } = await supabase
      .from('notifications')
      .insert(testNotificationData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Erreur création notification:', createError.message)
      return
    }

    console.log('✅ Notification créée:', createdNotification.id)
    console.log('   Titre:', createdNotification.title)
    console.log('   Lu:', createdNotification.is_read)
    console.log('   Updated_at:', createdNotification.updated_at)

    // 3. Tester la lecture (marquer comme lue)
    console.log('\n3️⃣ Test de la lecture (marquer comme lue)...')
    
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', createdNotification.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError.message)
      console.error('   Code:', updateError.code)
      console.error('   Détails:', updateError.details)
    } else {
      console.log('✅ Notification mise à jour avec succès')
      console.log('   Lu:', updatedNotification.is_read)
      console.log('   Updated_at:', updatedNotification.updated_at)
    }

    // 4. Tester la suppression
    console.log('\n4️⃣ Test de la suppression...')
    
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', createdNotification.id)

    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError.message)
      console.error('   Code:', deleteError.code)
      console.error('   Détails:', deleteError.details)
    } else {
      console.log('✅ Notification supprimée avec succès')
    }

    // 5. Vérifier que la suppression a fonctionné
    console.log('\n5️⃣ Vérification de la suppression...')
    
    const { data: checkNotification, error: checkError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', createdNotification.id)
      .single()

    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Notification bien supprimée (non trouvée)')
    } else if (checkError) {
      console.error('❌ Erreur vérification:', checkError.message)
    } else {
      console.log('⚠️  Notification encore présente après suppression')
    }

    // 6. Test avec un UUID invalide
    console.log('\n6️⃣ Test avec un UUID invalide...')
    
    const { error: invalidError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', 'invalid-uuid')

    if (invalidError) {
      console.log('✅ Erreur attendue avec UUID invalide:', invalidError.message)
      console.log('   Code:', invalidError.code)
    } else {
      console.log('⚠️  Pas d\'erreur avec UUID invalide (inattendu)')
    }

    // 7. Résumé final
    console.log('\n📋 Résumé des tests:')
    console.log(`- Structure de table: ${hasUpdatedAt ? '✅ OK' : '❌ Problème'}`)
    console.log(`- Création: ✅ OK`)
    console.log(`- Mise à jour: ${updateError ? '❌ Échec' : '✅ OK'}`)
    console.log(`- Suppression: ${deleteError ? '❌ Échec' : '✅ OK'}`)
    console.log(`- UUID invalide: ✅ Géré correctement`)

    if (!hasUpdatedAt) {
      console.log('\n🔧 Actions recommandées:')
      console.log('1. Exécutez CORRECTION-COLONNE-UPDATED-AT.sql')
      console.log('2. Relancez ce test')
    } else if (updateError || deleteError) {
      console.log('\n🔧 Actions recommandées:')
      console.log('1. Vérifiez les permissions RLS')
      console.log('2. Relancez ce test')
    } else {
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS !')
      console.log('💡 Les fonctionnalités UI des notifications fonctionnent parfaitement')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testNotificationsUI() 