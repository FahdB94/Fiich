const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const SUPABASE_URL = 'https://eiawccnqfmvdnvjlyftx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik'

// Créer le client Supabase avec la clé de service (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function diagnoseSupabase() {
  console.log('🔍 Diagnostic Supabase en cours...\n')

  try {
    // 1. Vérifier la connexion
    console.log('1️⃣ Test de connexion...')
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError)
      return
    }
    console.log('✅ Connexion réussie\n')

    // 2. Vérifier la structure de la table invitations
    console.log('2️⃣ Structure de la table invitations...')
    const { data: invitationsStructure, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'invitations' })
      .single()
    
    if (structureError) {
      console.log('⚠️ Impossible de récupérer la structure, vérifions autrement...')
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'invitations')
        .eq('table_schema', 'public')
      
      if (colError) {
        console.error('❌ Erreur récupération colonnes:', colError)
      } else {
        console.log('📋 Colonnes de la table invitations:')
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
        })
      }
    } else {
      console.log('📋 Structure:', invitationsStructure)
    }
    console.log()

    // 3. Vérifier les politiques RLS
    console.log('3️⃣ Politiques RLS sur la table invitations...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual, with_check')
      .eq('tablename', 'invitations')
      .eq('schemaname', 'public')
    
    if (policiesError) {
      console.error('❌ Erreur récupération politiques:', policiesError)
    } else {
      console.log('🔒 Politiques RLS trouvées:')
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`)
        console.log(`     Roles: ${policy.roles?.join(', ') || 'all'}`)
        console.log(`     Permissive: ${policy.permissive}`)
        console.log(`     Using: ${policy.qual}`)
        console.log(`     With check: ${policy.with_check}`)
        console.log()
      })
    }

    // 4. Vérifier si RLS est activé
    console.log('4️⃣ Vérification activation RLS...')
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'invitations')
      .eq('schemaname', 'public')
      .single()
    
    if (rlsError) {
      console.error('❌ Erreur vérification RLS:', rlsError)
    } else {
      console.log(`🔐 RLS activé: ${rlsStatus.rowsecurity}`)
    }
    console.log()

    // 5. Tester l'insertion avec la clé de service (devrait fonctionner)
    console.log('5️⃣ Test d\'insertion avec la clé de service...')
    const testInvitation = {
      company_id: '00000000-0000-0000-0000-000000000000', // UUID factice
      invited_email: 'test@example.com',
      invited_by: '00000000-0000-0000-0000-000000000000', // UUID factice
      invitation_token: 'test-token-' + Date.now(),
      role_requested: 'MEMBER',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const { data: insertResult, error: insertError } = await supabase
      .from('invitations')
      .insert(testInvitation)
      .select('id')
      .single()
    
    if (insertError) {
      console.error('❌ Erreur insertion avec clé de service:', insertError)
    } else {
      console.log('✅ Insertion réussie avec clé de service, ID:', insertResult.id)
      
      // Nettoyer le test
      await supabase
        .from('invitations')
        .delete()
        .eq('id', insertResult.id)
      console.log('🧹 Test nettoyé')
    }

    // 6. Vérifier les permissions de l'utilisateur authenticated
    console.log('\n6️⃣ Permissions du rôle authenticated...')
    const { data: grants, error: grantsError } = await supabase
      .rpc('get_role_permissions', { role_name: 'authenticated' })
      .single()
    
    if (grantsError) {
      console.log('⚠️ Impossible de récupérer les permissions, vérifions autrement...')
      const { data: roleGrants, error: roleError } = await supabase
        .from('information_schema.role_table_grants')
        .select('table_name, privilege_type, grantable')
        .eq('grantee', 'authenticated')
        .eq('table_schema', 'public')
        .eq('table_name', 'invitations')
      
      if (roleError) {
        console.error('❌ Erreur récupération permissions:', roleError)
      } else {
        console.log('🔑 Permissions du rôle authenticated sur invitations:')
        roleGrants.forEach(grant => {
          console.log(`   - ${grant.privilege_type} (grantable: ${grant.grantable})`)
        })
      }
    } else {
      console.log('🔑 Permissions:', grants)
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le diagnostic
diagnoseSupabase()
