// ========================================
// DIAGNOSTIC PERMISSIONS - Vérification complète
// ========================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnosticComplet() {
  console.log('🔍 DIAGNOSTIC COMPLET DES PERMISSIONS')
  console.log('=====================================\n')

  try {
    // 1. Vérifier la connexion
    console.log('1. 🔌 Test de connexion...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('   ⚠️  Non authentifié (normal pour ce test)')
    } else {
      console.log('   ✅ Utilisateur authentifié:', user.email)
    }

    // 2. Vérifier l'existence des tables
    console.log('\n2. 📋 Vérification des tables...')
    
    const tables = ['users', 'companies', 'documents', 'invitations', 'company_shares']
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ Table ${table}: accessible`)
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: erreur - ${err.message}`)
      }
    }

    // 3. Vérifier l'existence de la fonction get_shared_company
    console.log('\n3. 🔧 Vérification de la fonction get_shared_company...')
    try {
      const { data, error } = await supabase
        .rpc('get_shared_company', { share_token_param: 'test' })
      
      if (error) {
        console.log(`   ❌ Fonction get_shared_company: ${error.message}`)
      } else {
        console.log('   ✅ Fonction get_shared_company: existe et accessible')
      }
    } catch (err) {
      console.log(`   ❌ Fonction get_shared_company: erreur - ${err.message}`)
    }

    // 4. Vérifier les politiques RLS
    console.log('\n4. 🛡️  Vérification des politiques RLS...')
    try {
      const { data: policies, error } = await supabase
        .from('information_schema.policies')
        .select('*')
        .eq('table_schema', 'public')
      
      if (error) {
        console.log(`   ❌ Impossible de récupérer les politiques: ${error.message}`)
      } else {
        console.log(`   ✅ ${policies.length} politiques RLS trouvées`)
        policies.forEach(policy => {
          console.log(`      - ${policy.table_name}: ${policy.policy_name}`)
        })
      }
    } catch (err) {
      console.log(`   ❌ Erreur lors de la vérification des politiques: ${err.message}`)
    }

    // 5. Vérifier le bucket de storage
    console.log('\n5. 📦 Vérification du bucket storage...')
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.log(`   ❌ Erreur bucket storage: ${error.message}`)
      } else {
        const companyFilesBucket = buckets.find(b => b.name === 'company-files')
        if (companyFilesBucket) {
          console.log('   ✅ Bucket company-files: existe')
        } else {
          console.log('   ❌ Bucket company-files: manquant')
        }
      }
    } catch (err) {
      console.log(`   ❌ Erreur lors de la vérification du storage: ${err.message}`)
    }

    // 6. Test avec un token d'invitation
    console.log('\n6. 🎫 Test avec un token d\'invitation...')
    try {
      // Récupérer une invitation existante
      const { data: invitations, error: invError } = await supabase
        .from('invitations')
        .select('invitation_token, company_id')
        .limit(1)
      
      if (invError) {
        console.log(`   ❌ Impossible de récupérer les invitations: ${invError.message}`)
      } else if (invitations && invitations.length > 0) {
        const invitation = invitations[0]
        console.log(`   ✅ Invitation trouvée avec token: ${invitation.invitation_token.substring(0, 10)}...`)
        
        // Tester l'accès à l'entreprise
        const { data: company, error: compError } = await supabase
          .from('companies')
          .select('company_name')
          .eq('id', invitation.company_id)
          .single()
        
        if (compError) {
          console.log(`   ❌ Impossible d'accéder à l'entreprise: ${compError.message}`)
        } else {
          console.log(`   ✅ Accès à l'entreprise: ${company.company_name}`)
        }
      } else {
        console.log('   ⚠️  Aucune invitation trouvée pour le test')
      }
    } catch (err) {
      console.log(`   ❌ Erreur lors du test d'invitation: ${err.message}`)
    }

    console.log('\n=====================================')
    console.log('🎯 RECOMMANDATION:')
    console.log('Appliquez le script SQL final pour résoudre tous les problèmes:')
    console.log('SCRIPT-FINAL-ANTICIPATION-TOTALE.sql')
    console.log('=====================================')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécuter le diagnostic
diagnosticComplet() 