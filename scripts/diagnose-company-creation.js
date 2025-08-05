#!/usr/bin/env node

/**
 * Script de diagnostic pour le problème de création d'entreprise
 * Résout : "No API key found in request" lors de la création d'entreprise
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 DIAGNOSTIC - PROBLÈME CRÉATION ENTREPRISE\n')

async function main() {
  try {
    console.log('============================================================')
    console.log('📋 1. VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT')
    console.log('============================================================')
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    let allVarsPresent = true
    
    for (const varName of requiredVars) {
      const value = process.env[varName]
      if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
      } else {
        console.log(`❌ ${varName}: MANQUANTE`)
        allVarsPresent = false
      }
    }
    
    if (!allVarsPresent) {
      console.log('\n❌ Variables d\'environnement manquantes !')
      return
    }

    console.log('\n============================================================')
    console.log('🔗 2. TEST DE CONNEXION SUPABASE')
    console.log('============================================================')
    
    // Test avec clé anonyme (comme le ferait l'application)
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // Test avec clé service (pour comparaison)
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Test de connexion anonyme
    console.log('🧪 Test connexion avec clé anonyme...')
    try {
      const { data: anonData, error: anonError } = await supabaseAnon
        .from('users')
        .select('count(*)', { count: 'exact', head: true })
      
      if (anonError) {
        console.log(`⚠️  Erreur connexion anonyme: ${anonError.message}`)
      } else {
        console.log('✅ Connexion anonyme réussie')
      }
    } catch (err) {
      console.log(`❌ Erreur connexion anonyme: ${err.message}`)
    }

    // Test de connexion service
    console.log('🧪 Test connexion avec clé service...')
    try {
      const { data: serviceData, error: serviceError } = await supabaseService
        .from('users')
        .select('count(*)', { count: 'exact', head: true })
      
      if (serviceError) {
        console.log(`⚠️  Erreur connexion service: ${serviceError.message}`)
      } else {
        console.log('✅ Connexion service réussie')
      }
    } catch (err) {
      console.log(`❌ Erreur connexion service: ${err.message}`)
    }

    console.log('\n============================================================')
    console.log('👤 3. DIAGNOSTIC AUTHENTIFICATION')
    console.log('============================================================')
    
    // Vérifier l'état d'authentification
    console.log('🔍 Vérification session utilisateur...')
    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.getSession()
    
    if (sessionError) {
      console.log(`❌ Erreur session: ${sessionError.message}`)
    } else if (sessionData.session) {
      console.log(`✅ Session active pour: ${sessionData.session.user?.email || 'utilisateur inconnu'}`)
      console.log(`📍 ID utilisateur: ${sessionData.session.user?.id || 'N/A'}`)
    } else {
      console.log('⚠️  Aucune session active - L\'utilisateur n\'est pas connecté')
    }

    console.log('\n============================================================')
    console.log('🏢 4. TEST CRÉATION ENTREPRISE (SIMULATION)')
    console.log('============================================================')
    
    if (!sessionData.session) {
      console.log('❌ Impossible de tester la création - Aucun utilisateur connecté')
      console.log('🔧 SOLUTION : Connectez-vous d\'abord sur http://localhost:3000')
      return
    }

    // Test de création d'entreprise (simulation)
    console.log('🧪 Test création entreprise avec utilisateur connecté...')
    
    const testCompanyData = {
      company_name: 'Test Company ' + Date.now(),
      siret: '12345678901234',
      user_id: sessionData.session.user.id
    }

    try {
      const { data: companyData, error: companyError } = await supabaseAnon
        .from('companies')
        .insert(testCompanyData)
        .select()
        .single()

      if (companyError) {
        console.log(`❌ Erreur création entreprise: ${companyError.message}`)
        console.log(`📊 Code erreur: ${companyError.code}`)
        console.log(`💡 Détails: ${companyError.details || 'N/A'}`)
      } else {
        console.log('✅ Création entreprise réussie !')
        console.log(`📍 ID entreprise: ${companyData.id}`)
        
        // Nettoyer (supprimer l'entreprise de test)
        await supabaseAnon.from('companies').delete().eq('id', companyData.id)
        console.log('🧹 Entreprise de test supprimée')
      }
    } catch (err) {
      console.log(`❌ Erreur critique: ${err.message}`)
    }

    console.log('\n============================================================')
    console.log('💡 5. RECOMMANDATIONS')
    console.log('============================================================')
    
    if (!sessionData.session) {
      console.log('🎯 PROBLÈME PRINCIPAL : Aucun utilisateur connecté')
      console.log('')
      console.log('📋 ÉTAPES À SUIVRE :')
      console.log('1. Allez sur http://localhost:3000')
      console.log('2. Créez un nouveau compte ou connectez-vous')
      console.log('3. Vérifiez que vous êtes bien connecté')
      console.log('4. Essayez à nouveau de créer une entreprise')
    } else {
      console.log('🎯 L\'authentification semble fonctionner')
      console.log('📋 SI LE PROBLÈME PERSISTE :')
      console.log('1. Videz le cache de votre navigateur')
      console.log('2. Ouvrez les DevTools et vérifiez la Console')
      console.log('3. Essayez en navigation privée')
      console.log('4. Redémarrez le serveur de développement')
    }

  } catch (error) {
    console.error('❌ Erreur critique du diagnostic:', error.message)
    process.exit(1)
  }
}

main()