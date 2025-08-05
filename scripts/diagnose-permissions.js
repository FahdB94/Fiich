#!/usr/bin/env node

/**
 * Script de diagnostic avancé pour les permissions RLS
 * 
 * Usage: node scripts/diagnose-permissions.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Diagnostic avancé des permissions RLS\n')

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

async function diagnosePolicyIssues() {
  try {
    // Client service role
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Client normal (anon)
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    info('=== ÉTAPE 1: Vérification des tables ===')
    
    // Test d'accès aux tables avec service role
    const { data: users, error: usersError } = await serviceClient
      .from('users')
      .select('id, email')
      .limit(5)

    if (usersError) {
      error(`Erreur table users: ${usersError.message}`)
    } else {
      success(`Table users accessible: ${users?.length || 0} utilisateurs`)
      if (users && users.length > 0) {
        info(`Premier utilisateur: ${JSON.stringify(users[0], null, 2)}`)
      }
    }

    const { data: companies, error: companiesError } = await serviceClient
      .from('companies')
      .select('id, user_id, company_name')
      .limit(5)

    if (companiesError) {
      error(`Erreur table companies: ${companiesError.message}`)
    } else {
      success(`Table companies accessible: ${companies?.length || 0} entreprises`)
      if (companies && companies.length > 0) {
        info(`Première entreprise: ${JSON.stringify(companies[0], null, 2)}`)
      }
    }

    const { data: documents, error: documentsError } = await serviceClient
      .from('documents')
      .select('id, company_id, name')
      .limit(5)

    if (documentsError) {
      error(`Erreur table documents: ${documentsError.message}`)
    } else {
      success(`Table documents accessible: ${documents?.length || 0} documents`)
      if (documents && documents.length > 0) {
        info(`Premier document: ${JSON.stringify(documents[0], null, 2)}`)
      }
    }

    info('\n=== ÉTAPE 2: Test des politiques RLS ===')

    // Lister toutes les politiques RLS
    const { data: policies, error: policiesError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .in('tablename', ['users', 'companies', 'documents', 'invitations', 'company_shares'])

    if (policiesError) {
      error(`Erreur récupération politiques: ${policiesError.message}`)
    } else {
      success(`${policies?.length || 0} politiques RLS trouvées`)
      
      const documentPolicies = policies?.filter(p => p.tablename === 'documents') || []
      info(`Politiques pour documents: ${documentPolicies.length}`)
      
      documentPolicies.forEach(policy => {
        info(`- ${policy.policyname}: ${policy.cmd}`)
        if (policy.qual) {
          warning(`  Condition: ${policy.qual}`)
        }
      })
    }

    info('\n=== ÉTAPE 3: Test authentification ===')

    // Simuler une connexion utilisateur pour tester
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'

    info(`Tentative de connexion avec: ${testEmail}`)

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (authError) {
      warning(`Connexion échouée (normal): ${authError.message}`)
      info('Tentative de récupération de session existante...')
      
      const { data: sessionData } = await anonClient.auth.getSession()
      if (sessionData.session) {
        success(`Session trouvée pour: ${sessionData.session.user.email}`)
        
        // Test d'accès aux documents avec cette session
        info('\n=== ÉTAPE 4: Test accès documents avec utilisateur connecté ===')
        
        const { data: userDocs, error: userDocsError } = await anonClient
          .from('documents')
          .select('*')
          .limit(1)

        if (userDocsError) {
          error(`❌ ERREUR CRITIQUE: ${userDocsError.message}`)
          error('Cette erreur confirme le problème de permissions RLS')
          
          // Diagnostiquer plus en détail
          info('\n=== DIAGNOSTIC APPROFONDI ===')
          
          // Vérifier si l'utilisateur existe dans public.users
          const { data: publicUser, error: publicUserError } = await serviceClient
            .from('users')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single()

          if (publicUserError) {
            error(`❌ PROBLÈME TROUVÉ: L'utilisateur n'existe pas dans public.users`)
            error(`User ID: ${sessionData.session.user.id}`)
            error(`Erreur: ${publicUserError.message}`)
            
            info('🔧 SOLUTION: Synchroniser les utilisateurs')
            info('Exécutez cette requête dans Supabase SQL Editor:')
            console.log(`
INSERT INTO public.users (id, email, first_name, last_name)
SELECT 
    id,
    email,
    raw_user_meta_data->>'first_name',
    raw_user_meta_data->>'last_name'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
            `)
            
          } else {
            success(`Utilisateur trouvé dans public.users: ${publicUser.email}`)
            warning('Le problème vient d\'ailleurs...')
          }
          
        } else {
          success(`Documents accessibles: ${userDocs?.length || 0}`)
        }
        
      } else {
        warning('Aucune session active trouvée')
      }
    } else {
      success(`Connexion réussie: ${authData.user.email}`)
    }

    info('\n=== ÉTAPE 5: Recommandations ===')
    
    return {
      tablesAccessible: !usersError && !companiesError && !documentsError,
      policiesFound: policies?.length > 0,
      documentsAccessible: false // À déterminer selon les tests
    }

  } catch (err) {
    error(`Erreur fatale: ${err.message}`)
    return null
  }
}

async function main() {
  console.log('='.repeat(80))
  log('🔍 DIAGNOSTIC AVANCÉ DES PERMISSIONS RLS', colors.blue)
  console.log('='.repeat(80))

  const results = await diagnosePolicyIssues()

  console.log('\n' + '='.repeat(80))
  log('📋 RÉSUMÉ DU DIAGNOSTIC', colors.blue)
  console.log('='.repeat(80))

  if (results) {
    if (results.tablesAccessible) {
      success('Tables de base accessibles')
    } else {
      error('Problème d\'accès aux tables de base')
    }

    if (results.policiesFound) {
      success('Politiques RLS détectées')
    } else {
      warning('Aucune politique RLS trouvée')
    }
  }

  info('\n🚀 Prochaines étapes recommandées:')
  info('1. Vérifiez les résultats ci-dessus')
  info('2. Exécutez les requêtes SQL suggérées si nécessaire')
  info('3. Redémarrez votre application: npm run dev')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { diagnosePolicyIssues }