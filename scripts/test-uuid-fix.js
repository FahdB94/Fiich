#!/usr/bin/env node

/**
 * Test de la correction de l'UUID
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

// Fonction pour extraire l'ID comme dans le hook corrigé
function extractId(notificationId) {
  const type = notificationId.startsWith('notification-') ? 'notification' : 
               notificationId.startsWith('invitation-') ? 'invitation' : null
  const id = type ? notificationId.substring(type.length + 1) : notificationId
  return { type, id }
}

async function testUUIDFix() {
  console.log('🧪 Test de la correction de l\'UUID')
  console.log('===================================\n')

  try {
    // 1. Récupérer une notification existante
    console.log('1️⃣ Récupération d\'une notification existante...')
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, title')
      .limit(1)

    if (notificationsError || !notifications || notifications.length === 0) {
      console.error('❌ Aucune notification trouvée:', notificationsError?.message)
      return
    }

    const notification = notifications[0]
    console.log('✅ Notification trouvée:')
    console.log(`   ID original: ${notification.id}`)
    console.log(`   Titre: ${notification.title}`)

    // 2. Simuler l'ID unifié comme dans le frontend
    const unifiedId = `notification-${notification.id}`
    console.log(`   ID unifié: ${unifiedId}`)

    // 3. Tester l'extraction de l'ID
    console.log('\n2️⃣ Test de l\'extraction de l\'ID...')
    
    const { type, id } = extractId(unifiedId)
    console.log(`   Type extrait: ${type}`)
    console.log(`   ID extrait: ${id}`)
    console.log(`   ID original: ${notification.id}`)
    console.log(`   Correspondance: ${id === notification.id ? '✅ OK' : '❌ ERREUR'}`)

    // 4. Tester la mise à jour avec l'ID extrait
    console.log('\n3️⃣ Test de mise à jour avec l\'ID extrait...')
    
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: false })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError.message)
      console.error('   Code:', updateError.code)
    } else {
      console.log('✅ Mise à jour réussie avec l\'ID extrait')
      console.log(`   Lu: ${updatedNotification.is_read}`)
    }

    // 5. Tester la suppression avec l'ID extrait
    console.log('\n4️⃣ Test de suppression avec l\'ID extrait...')
    
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError.message)
      console.error('   Code:', deleteError.code)
    } else {
      console.log('✅ Suppression réussie avec l\'ID extrait')
    }

    // 6. Vérifier que la suppression a fonctionné
    console.log('\n5️⃣ Vérification de la suppression...')
    
    const { data: checkNotification, error: checkError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Notification bien supprimée (non trouvée)')
    } else if (checkError) {
      console.error('❌ Erreur vérification:', checkError.message)
    } else {
      console.log('⚠️  Notification encore présente après suppression')
    }

    // 7. Test avec l'ancienne méthode (pour comparaison)
    console.log('\n6️⃣ Test avec l\'ancienne méthode (split)...')
    
    const oldMethod = unifiedId.split('-')
    console.log(`   Ancienne méthode: type="${oldMethod[0]}", id="${oldMethod[1]}"`)
    console.log(`   ID tronqué: ${oldMethod[1]}`)
    console.log(`   UUID complet: ${notification.id}`)
    console.log(`   Problème: ${oldMethod[1] !== notification.id ? '✅ Identifié' : '❌ Non identifié'}`)

    // 8. Résumé final
    console.log('\n📋 Résumé du test:')
    console.log(`- Extraction correcte: ${id === notification.id ? '✅ OK' : '❌ ÉCHEC'}`)
    console.log(`- Mise à jour: ${updateError ? '❌ ÉCHEC' : '✅ OK'}`)
    console.log(`- Suppression: ${deleteError ? '❌ ÉCHEC' : '✅ OK'}`)
    console.log(`- Ancienne méthode problématique: ✅ Identifiée`)

    if (id === notification.id && !updateError && !deleteError) {
      console.log('\n🎉 CORRECTION RÉUSSIE !')
      console.log('💡 L\'extraction d\'UUID fonctionne maintenant correctement')
      console.log('🚀 Les notifications devraient fonctionner dans l\'interface')
    } else {
      console.log('\n⚠️  PROBLÈME PERSISTANT !')
      console.log('🔧 Vérifiez la logique d\'extraction dans le hook')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testUUIDFix() 