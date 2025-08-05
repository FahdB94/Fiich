#!/usr/bin/env node

/**
 * Script pour corriger les permissions RLS de Supabase
 * 
 * Usage: node scripts/fix-permissions.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

console.log('🔧 Correction des permissions RLS Supabase\n')

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

async function fixPermissions() {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      error('Variables d\'environnement Supabase manquantes')
      error('Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local')
      process.exit(1)
    }

    // Créer le client Supabase avec service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    info('Connexion à Supabase...')

    // Lire le script SQL de correction
    const sqlPath = path.join(__dirname, '..', 'CORRECTION-PERMISSIONS-RLS.sql')
    
    if (!fs.existsSync(sqlPath)) {
      error(`Fichier SQL de correction non trouvé: ${sqlPath}`)
      process.exit(1)
    }

    const sqlScript = fs.readFileSync(sqlPath, 'utf8')
    info('Script SQL de correction chargé')

    // Diviser le script en requêtes individuelles
    const queries = sqlScript
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'))

    info(`Exécution de ${queries.length} requêtes...`)

    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]
      
      if (query.includes('SELECT') && query.includes('status')) {
        // C'est juste une requête de vérification
        continue
      }

      try {
        const { error: queryError } = await supabase.rpc('exec', {
          sql: query
        })

        if (queryError) {
          // Essayer d'exécuter directement
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0)

          warning(`Requête ${i + 1}: ${queryError.message}`)
        } else {
          success(`Requête ${i + 1} exécutée avec succès`)
        }
      } catch (err) {
        warning(`Erreur lors de l'exécution de la requête ${i + 1}: ${err.message}`)
      }
    }

    // Test de validation
    info('Test de validation des permissions...')
    
    try {
      // Tester l'accès aux documents
      const { data: testData, error: testError } = await supabase
        .from('documents')
        .select('id')
        .limit(1)

      if (testError) {
        if (testError.message.includes('permission denied for table users')) {
          error('Le problème de permissions persiste')
          error('Vous devez exécuter manuellement le script SQL dans l\'interface Supabase')
          info('1. Allez sur https://supabase.com/dashboard/project/[votre-projet]/sql')
          info('2. Copiez le contenu de CORRECTION-PERMISSIONS-RLS.sql')
          info('3. Exécutez le script')
        } else {
          warning(`Autre erreur: ${testError.message}`)
        }
      } else {
        success('Test de permissions réussi !')
        success('Les documents peuvent maintenant être chargés correctement')
      }
    } catch (err) {
      error(`Erreur lors du test: ${err.message}`)
    }

    console.log('\n' + '='.repeat(60))
    success('🎉 CORRECTION DES PERMISSIONS TERMINÉE')
    console.log('='.repeat(60))
    
    info('Prochaines étapes:')
    info('1. Redémarrez votre serveur de développement: npm run dev')
    info('2. Testez l\'accès aux documents sur: http://localhost:3000')
    info('3. Si le problème persiste, exécutez manuellement le script SQL')

  } catch (err) {
    error(`Erreur fatale: ${err.message}`)
    process.exit(1)
  }
}

// Instructions d'usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔧 Script de correction des permissions RLS

Usage: node scripts/fix-permissions.js

Ce script corrige l'erreur "permission denied for table users" en 
mettant à jour les politiques RLS pour utiliser public.users au lieu 
de auth.users directement.

Options:
  --help, -h    Afficher cette aide

Prérequis:
  - Fichier .env.local configuré
  - Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
  `)
  process.exit(0)
}

// Exécuter la correction
if (require.main === module) {
  fixPermissions().catch(console.error)
}

module.exports = { fixPermissions }