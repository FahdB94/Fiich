#!/usr/bin/env node

/**
 * Script pour nettoyer l'authentification corrompue
 * Résout : "Invalid Refresh Token: Refresh Token Not Found"
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🧹 NETTOYAGE DE L\'AUTHENTIFICATION CORROMPUE\n')

async function main() {
  try {
    console.log('✅ Configuration Supabase détectée :')
    console.log(`📍 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    console.log(`🔑 Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Présente' : 'MANQUANTE'}`)
    console.log(`🔐 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Présente' : 'MANQUANTE'}\n`)

    // Test de connexion basique
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log('🧪 Test de connexion Supabase...')
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      console.log(`⚠️  Erreur de connexion : ${error.message}`)
    } else {
      console.log('✅ Connexion Supabase réussie\n')
    }

    // Informations pour nettoyer manuellement
    console.log('============================================================')
    console.log('🎯 ACTIONS À EFFECTUER POUR NETTOYER L\'AUTHENTIFICATION')
    console.log('============================================================')
    
    console.log('\n1️⃣  DANS VOTRE NAVIGATEUR :')
    console.log('   • Ouvrez les DevTools (F12)')
    console.log('   • Allez sur l\'onglet "Application" ou "Storage"')
    console.log('   • Supprimez TOUTES les données pour localhost:3000 :')
    console.log('     - Local Storage → localStorage.clear()')
    console.log('     - Session Storage → sessionStorage.clear()')
    console.log('     - Cookies → Supprimez tous les cookies de localhost')
    console.log('     - IndexedDB → Supprimez toutes les bases')
    
    console.log('\n2️⃣  ALTERNATIVE - NAVIGATION PRIVÉE :')
    console.log('   • Ouvrez un onglet de navigation privée/incognito')
    console.log('   • Allez sur http://localhost:3000')
    console.log('   • Créez un nouveau compte ou reconnectez-vous')
    
    console.log('\n3️⃣  REDÉMARRAGE COMPLET :')
    console.log('   • Fermez complètement votre navigateur')
    console.log('   • Redémarrez le serveur de développement')
    console.log('   • Rouvrez http://localhost:3000')

    console.log('\n============================================================')
    console.log('⚡ APRÈS LE NETTOYAGE, NOUS CORRIGERONS LES PERMISSIONS RLS')
    console.log('============================================================')

  } catch (error) {
    console.error('❌ Erreur critique:', error.message)
    process.exit(1)
  }
}

main()