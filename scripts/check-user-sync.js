#!/usr/bin/env node

/**
 * Script pour vérifier la synchronisation utilisateur
 * Problème : L'utilisateur connecté n'est peut-être pas dans public.users
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔄 VÉRIFICATION SYNCHRONISATION UTILISATEURS\n')

async function main() {
  try {
    console.log('============================================================')
    console.log('🔧 1. CONNEXION AVEC SERVICE ROLE')
    console.log('============================================================')
    
    // Utiliser la clé service pour avoir tous les accès
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('✅ Connexion avec service role établie')

    console.log('\n============================================================')
    console.log('👥 2. COMPARAISON auth.users VS public.users')
    console.log('============================================================')
    
    // Lister les utilisateurs dans auth.users
    console.log('🔍 Lecture des utilisateurs dans auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log(`❌ Erreur lecture auth.users: ${authError.message}`)
      return
    }
    
    console.log(`📊 Nombre d'utilisateurs dans auth.users: ${authUsers.users.length}`)
    
    if (authUsers.users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans auth.users !')
      console.log('🔧 Vous devez d\'abord créer un compte sur l\'application')
      return
    }
    
    // Afficher les utilisateurs auth
    console.log('\n📋 UTILISATEURS DANS auth.users :')
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
      console.log(`      Créé: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`      Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`)
    })
    
    // Lister les utilisateurs dans public.users
    console.log('\n🔍 Lecture des utilisateurs dans public.users...')
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
    
    if (publicError) {
      console.log(`❌ Erreur lecture public.users: ${publicError.message}`)
      return
    }
    
    console.log(`📊 Nombre d'utilisateurs dans public.users: ${publicUsers.length}`)
    
    if (publicUsers.length === 0) {
      console.log('❌ PROBLÈME TROUVÉ: Aucun utilisateur dans public.users !')
      console.log('🎯 C\'est très probablement la cause du problème "No API key found"')
    } else {
      console.log('\n📋 UTILISATEURS DANS public.users :')
      publicUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
        console.log(`      Nom: ${user.first_name} ${user.last_name}`)
        console.log(`      Créé: ${new Date(user.created_at).toLocaleString()}`)
      })
    }

    console.log('\n============================================================')
    console.log('🔄 3. SYNCHRONISATION MANUELLE DES UTILISATEURS')
    console.log('============================================================')
    
    // Synchroniser les utilisateurs manquants
    let synced = 0
    
    for (const authUser of authUsers.users) {
      const existsInPublic = publicUsers.find(pu => pu.id === authUser.id)
      
      if (!existsInPublic) {
        console.log(`🔄 Synchronisation de ${authUser.email}...`)
        
        try {
          const { data, error } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              first_name: authUser.user_metadata?.first_name || '',
              last_name: authUser.user_metadata?.last_name || '',
              created_at: authUser.created_at,
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (error) {
            console.log(`   ❌ Erreur: ${error.message}`)
          } else {
            console.log(`   ✅ Synchronisé: ${data.email}`)
            synced++
          }
        } catch (err) {
          console.log(`   ❌ Erreur critique: ${err.message}`)
        }
      } else {
        console.log(`✅ ${authUser.email} déjà synchronisé`)
      }
    }

    console.log('\n============================================================')
    console.log('📊 4. RÉSULTATS ET RECOMMANDATIONS')
    console.log('============================================================')
    
    if (synced > 0) {
      console.log(`🎉 ${synced} utilisateur(s) synchronisé(s) avec succès !`)
      console.log('✅ Le problème "No API key found" devrait être résolu')
      console.log('')
      console.log('🚀 PROCHAINES ÉTAPES :')
      console.log('1. Redémarrez votre serveur : npm run dev')
      console.log('2. Reconnectez-vous sur l\'application')
      console.log('3. Essayez de créer une entreprise')
    } else if (publicUsers.length === authUsers.users.length) {
      console.log('✅ Tous les utilisateurs sont déjà synchronisés')
      console.log('🤔 Le problème vient d\'ailleurs...')
      console.log('')
      console.log('💡 AUTRES CAUSES POSSIBLES :')
      console.log('1. Session utilisateur expirée')
      console.log('2. Politiques RLS incorrectes')
      console.log('3. Problème de configuration du client Supabase')
    } else {
      console.log('⚠️  Synchronisation partielle ou problème détecté')
      console.log('📋 Vérifiez manuellement les données')
    }

    console.log('\n============================================================')
    console.log('🧪 5. TEST FINAL - CRÉATION D\'ENTREPRISE')
    console.log('============================================================')
    
    if (publicUsers.length > 0) {
      const testUser = publicUsers[0]
      console.log(`🧪 Test avec utilisateur: ${testUser.email}`)
      
      const testCompanyData = {
        company_name: 'Test Sync Company ' + Date.now(),
        siret: '12345678901234',
        address_line_1: '123 Test Street',
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
        email: 'test@example.com',
        user_id: testUser.id
      }
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .insert(testCompanyData)
          .select()
          .single()
        
        if (error) {
          console.log(`❌ Test échoué: ${error.message}`)
          console.log(`📊 Code: ${error.code}`)
        } else {
          console.log('✅ Test réussi ! Création d\'entreprise fonctionnelle')
          
          // Nettoyer
          await supabase.from('companies').delete().eq('id', data.id)
          console.log('🧹 Entreprise de test supprimée')
        }
      } catch (err) {
        console.log(`❌ Erreur test: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Erreur critique:', error.message)
    process.exit(1)
  }
}

main()