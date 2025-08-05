#!/usr/bin/env node

/**
 * Script de test LIVE pour la création d'entreprise
 * Simule exactement ce que fait l'application
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🧪 TEST LIVE - CRÉATION D\'ENTREPRISE\n')

async function main() {
  try {
    console.log('============================================================')
    console.log('🔧 1. CONFIGURATION DU CLIENT SUPABASE (COMME L\'APP)')
    console.log('============================================================')
    
    // Créer le client exactement comme dans l'application
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'fiich-auth',
        },
      }
    )
    
    console.log('✅ Client Supabase créé avec les mêmes paramètres que l\'app')

    console.log('\n============================================================')
    console.log('👤 2. VÉRIFICATION SESSION UTILISATEUR')
    console.log('============================================================')
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log(`❌ Erreur session: ${sessionError.message}`)
      return
    }
    
    if (!sessionData.session) {
      console.log('❌ Aucune session trouvée - L\'utilisateur n\'est pas connecté')
      console.log('📝 NOTE: Ce script ne peut pas accéder à la session du navigateur')
      console.log('🔧 SOLUTION: Testons avec une connexion directe...')
      
      // Test de connexion directe
      console.log('\n🔐 Test de connexion avec email/mot de passe...')
      console.log('⚠️  Vous devez entrer vos identifiants pour ce test')
      return
    }
    
    const user = sessionData.session.user
    console.log(`✅ Utilisateur connecté: ${user.email}`)
    console.log(`📍 ID utilisateur: ${user.id}`)

    console.log('\n============================================================')
    console.log('🏢 3. TEST CRÉATION ENTREPRISE (SIMULATION EXACTE)')
    console.log('============================================================')
    
    // Données de test (exactement comme dans l'app)
    const testCompanyData = {
      company_name: 'Test Company ' + Date.now(),
      siren: '123456789',
      siret: '12345678901234',
      address_line_1: '123 Rue de Test',
      postal_code: '75001',
      city: 'Paris',
      country: 'France',
      phone: '0123456789',
      email: 'test@company.com',
      website: 'https://test-company.com',
      description: 'Entreprise de test créée par le script de diagnostic',
      user_id: user.id // Ajout explicite de l'ID utilisateur
    }
    
    console.log('📊 Données à insérer:')
    console.log(`   - Nom: ${testCompanyData.company_name}`)
    console.log(`   - SIRET: ${testCompanyData.siret}`)
    console.log(`   - Utilisateur: ${testCompanyData.user_id}`)
    
    console.log('\n🚀 Tentative d\'insertion...')
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(testCompanyData)
        .select()
        .single()

      if (error) {
        console.log(`❌ ERREUR CRÉATION: ${error.message}`)
        console.log(`📊 Code erreur: ${error.code}`)
        console.log(`💡 Détails: ${error.details || 'N/A'}`)
        console.log(`🔍 Hint: ${error.hint || 'N/A'}`)
        
        // Analyse de l'erreur
        if (error.message.includes('No API key found')) {
          console.log('\n🎯 ANALYSE: Problème d\'authentification détecté')
          console.log('💡 CAUSES POSSIBLES:')
          console.log('   1. Session utilisateur expirée ou invalide')
          console.log('   2. Client Supabase mal configuré')
          console.log('   3. Permissions RLS incorrectes')
          console.log('   4. Headers d\'authentification manquants')
        }
        
      } else {
        console.log('✅ CRÉATION RÉUSSIE !')
        console.log(`📍 ID entreprise: ${data.id}`)
        console.log(`📝 Nom: ${data.company_name}`)
        
        // Nettoyer (supprimer l'entreprise de test)
        console.log('\n🧹 Suppression de l\'entreprise de test...')
        const { error: deleteError } = await supabase
          .from('companies')
          .delete()
          .eq('id', data.id)
          
        if (deleteError) {
          console.log(`⚠️  Erreur suppression: ${deleteError.message}`)
        } else {
          console.log('✅ Entreprise de test supprimée')
        }
      }
      
    } catch (err) {
      console.log(`❌ ERREUR CRITIQUE: ${err.message}`)
      console.log(`📊 Stack: ${err.stack}`)
    }

    console.log('\n============================================================')
    console.log('🔍 4. DIAGNOSTIC AVANCÉ')
    console.log('============================================================')
    
    // Test des permissions utilisateur
    console.log('🧪 Test permissions utilisateur...')
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (userError) {
        console.log(`⚠️  Erreur lecture utilisateur: ${userError.message}`)
      } else {
        console.log(`✅ Utilisateur trouvé: ${userData.email}`)
      }
    } catch (err) {
      console.log(`❌ Erreur test utilisateur: ${err.message}`)
    }
    
    // Test des permissions générales
    console.log('🧪 Test permissions table companies...')
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('count(*)', { count: 'exact', head: true })
        
      if (companiesError) {
        console.log(`⚠️  Erreur lecture companies: ${companiesError.message}`)
      } else {
        console.log('✅ Table companies accessible')
      }
    } catch (err) {
      console.log(`❌ Erreur test companies: ${err.message}`)
    }

  } catch (error) {
    console.error('❌ Erreur critique du test:', error.message)
    process.exit(1)
  }
}

main()