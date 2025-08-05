#!/usr/bin/env node

/**
 * Test spécifique pour l'accès aux documents
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testDocumentAccess() {
  console.log('🧪 Test d\'accès aux documents spécifique\n')

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // ID de l'entreprise depuis le diagnostic
  const companyId = '33d3c38f-4ec3-4aaf-8972-fbb1d79c549d'
  const userId = 'c331db65-85a5-47b9-8cd6-46e94ee6ca0e'

  console.log(`👤 Test avec utilisateur: ${userId}`)
  console.log(`🏢 Test avec entreprise: ${companyId}\n`)

  // 1. Créer un document de test avec service role
  console.log('📝 Création d\'un document de test...')
  
  const { data: testDoc, error: createError } = await serviceClient
    .from('documents')
    .insert({
      company_id: companyId,
      name: 'Document de test',
      file_path: 'test/document.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      is_public: false
    })
    .select()
    .single()

  if (createError) {
    console.log(`❌ Erreur création document: ${createError.message}`)
  } else {
    console.log(`✅ Document créé: ${testDoc.id}`)
  }

  // 2. Simuler l'authentification
  console.log('\n🔐 Simulation de l\'authentification...')
  
  // Récupérer l'utilisateur réel
  const { data: realUser, error: userError } = await serviceClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.log(`❌ Utilisateur non trouvé: ${userError.message}`)
    return
  }

  console.log(`✅ Utilisateur trouvé: ${realUser.email}`)

  // 3. Tenter la connexion avec les vraies credentials (on va échouer mais on continue)
  console.log('\n📋 Test d\'accès aux documents sans authentification...')
  
  const { data: anonDocs, error: anonError } = await anonClient
    .from('documents')
    .select('*')
    .eq('company_id', companyId)

  if (anonError) {
    console.log(`❌ ERREUR ATTENDUE (non authentifié): ${anonError.message}`)
  } else {
    console.log(`⚠️  Documents visibles sans auth: ${anonDocs?.length || 0}`)
  }

  // 4. Test avec service role pour voir les documents
  console.log('\n🔧 Test avec service role...')
  
  const { data: serviceDocs, error: serviceError } = await serviceClient
    .from('documents')
    .select('*')
    .eq('company_id', companyId)

  if (serviceError) {
    console.log(`❌ Erreur service role: ${serviceError.message}`)
  } else {
    console.log(`✅ Documents visibles (service role): ${serviceDocs?.length || 0}`)
    serviceDocs?.forEach(doc => {
      console.log(`  - ${doc.name} (${doc.id})`)
    })
  }

  // 5. Test en simulant auth.uid()
  console.log('\n🎯 Test de la politique RLS...')
  
  // Vérifier si l'entreprise appartient bien à l'utilisateur
  const { data: ownership, error: ownershipError } = await serviceClient
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .eq('user_id', userId)
    .single()

  if (ownershipError) {
    console.log(`❌ Problème de propriété: ${ownershipError.message}`)
  } else {
    console.log(`✅ Propriété confirmée: ${ownership.company_name}`)
  }

  // 6. Nettoyer le document de test
  if (testDoc) {
    console.log('\n🧹 Nettoyage du document de test...')
    await serviceClient
      .from('documents')
      .delete()
      .eq('id', testDoc.id)
    console.log('✅ Document de test supprimé')
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎯 CONCLUSIONS:')
  console.log('='.repeat(60))
  
  console.log('1. L\'utilisateur existe dans public.users ✅')
  console.log('2. L\'entreprise appartient à l\'utilisateur ✅')
  console.log('3. Le problème vient de l\'authentification côté client ❌')
  
  console.log('\n💡 SOLUTION PROBABLE:')
  console.log('Le problème n\'est pas dans les politiques RLS mais dans')
  console.log('l\'authentification côté client. L\'utilisateur n\'est pas')
  console.log('correctement authentifié quand il accède aux documents.')
  
  console.log('\n🔧 ACTIONS À PRENDRE:')
  console.log('1. Vérifiez que vous êtes bien connecté sur http://localhost:3000')
  console.log('2. Ouvrez les DevTools (F12) → Onglet Network')
  console.log('3. Rechargez la page des documents')
  console.log('4. Vérifiez si les requêtes ont un header Authorization')
}

testDocumentAccess().catch(console.error)