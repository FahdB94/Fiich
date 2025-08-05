#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration de l'application Fiich
 * 
 * Usage: node scripts/test-setup.js
 */

const { createClient } = require('@supabase/supabase-js')
const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

console.log('🧪 Test de configuration Fiich App\n')

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, colors.green)
}

function error(message) {
  log(`❌ ${message}`, colors.red)
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

// Test 1: Variables d'environnement
function testEnvironmentVariables() {
  info('Test 1: Variables d\'environnement')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL'
  ]

  let allPresent = true

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      success(`${varName} ✓`)
    } else {
      error(`${varName} manquant`)
      allPresent = false
    }
  })

  if (allPresent) {
    success('Toutes les variables d\'environnement sont présentes\n')
  } else {
    error('Certaines variables d\'environnement sont manquantes\n')
  }

  return allPresent
}

// Test 2: Connexion Supabase
async function testSupabaseConnection() {
  info('Test 2: Connexion Supabase')

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test de connexion basique
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      error(`Erreur de connexion Supabase: ${error.message}`)
      return false
    }

    success('Connexion Supabase réussie')

    // Test des fonctions RPC
    try {
      const { data: tokenTest } = await supabase.rpc('generate_share_token')
      if (tokenTest) {
        success('Fonction generate_share_token disponible')
      }
    } catch (e) {
      warning('Fonction generate_share_token non disponible (normal si pas encore exécutée)')
    }

    success('Tests Supabase terminés\n')
    return true

  } catch (err) {
    error(`Erreur lors du test Supabase: ${err.message}`)
    return false
  }
}

// Test 3: Configuration email
async function testEmailConfiguration() {
  info('Test 3: Configuration email')

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    // Vérifier la configuration sans envoyer d'email
    await transporter.verify()
    success('Configuration SMTP valide')
    success('Tests email terminés\n')
    return true

  } catch (err) {
    error(`Erreur de configuration email: ${err.message}`)
    warning('Vérifiez vos paramètres SMTP')
    return false
  }
}

// Test 4: Structure des tables
async function testDatabaseStructure() {
  info('Test 4: Structure de la base de données')

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const tables = ['users', 'companies', 'documents', 'invitations', 'company_shares']
    let allTablesExist = true

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
          error(`Table ${table} n'existe pas`)
          allTablesExist = false
        } else {
          success(`Table ${table} ✓`)
        }
      } catch (e) {
        warning(`Impossible de vérifier la table ${table}`)
      }
    }

    // Test du bucket storage
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const companyFilesBucket = buckets?.find(b => b.id === 'company-files')
      
      if (companyFilesBucket) {
        success('Bucket company-files ✓')
      } else {
        warning('Bucket company-files non trouvé')
      }
    } catch (e) {
      warning('Impossible de vérifier les buckets storage')
    }

    if (allTablesExist) {
      success('Structure de base de données OK\n')
    } else {
      error('Certaines tables sont manquantes. Exécutez le script SOLUTION-COMPLETE-DEFINITIVE.sql\n')
    }

    return allTablesExist

  } catch (err) {
    error(`Erreur lors du test de structure: ${err.message}`)
    return false
  }
}

// Fonction principale
async function runTests() {
  log('='.repeat(60), colors.blue)
  log('🚀 FIICH APP - TEST DE CONFIGURATION', colors.blue)
  log('='.repeat(60), colors.blue)
  console.log()

  const results = {
    env: false,
    supabase: false,
    email: false,
    database: false
  }

  try {
    results.env = testEnvironmentVariables()
    
    if (results.env) {
      results.supabase = await testSupabaseConnection()
      results.email = await testEmailConfiguration()
      results.database = await testDatabaseStructure()
    }

    // Résumé
    log('='.repeat(60), colors.blue)
    log('📊 RÉSUMÉ DES TESTS', colors.blue)
    log('='.repeat(60), colors.blue)

    const testResults = [
      ['Variables d\'environnement', results.env],
      ['Connexion Supabase', results.supabase],
      ['Configuration email', results.email],
      ['Structure base de données', results.database]
    ]

    testResults.forEach(([name, passed]) => {
      if (passed) {
        success(name)
      } else {
        error(name)
      }
    })

    const allPassed = Object.values(results).every(Boolean)

    console.log()
    if (allPassed) {
      success('🎉 Tous les tests sont passés ! Votre application est prête.')
      success('Vous pouvez maintenant lancer: npm run dev')
    } else {
      error('❌ Certains tests ont échoué. Corrigez les erreurs avant de continuer.')
      warning('Consultez le fichier CONFIGURATION-ENVIRONNEMENT.md pour plus d\'aide.')
    }

  } catch (err) {
    error(`Erreur fatale: ${err.message}`)
    process.exit(1)
  }
}

// Exécuter les tests
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests }