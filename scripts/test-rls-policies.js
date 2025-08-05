const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRLSPolicies() {
  console.log('🧪 Test des politiques RLS...\n')

  try {
    // 1. Vérifier les politiques existantes
    console.log('1. Vérification des politiques RLS...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'company_shares'
          AND schemaname = 'public'
          ORDER BY policyname;
        `
      })

    if (policiesError) {
      console.log('⚠️ Impossible de récupérer les politiques (fonction exec_sql non disponible)')
      console.log('   Appliquez manuellement le script SQL dans Supabase')
    } else {
      console.log(`✅ Politiques trouvées: ${policies.length}`)
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    }

    // 2. Tester l'accès à company_shares
    console.log('\n2. Test d\'accès à company_shares...')
    const { data: shares, error: sharesError } = await supabase
      .from('company_shares')
      .select('*')
      .limit(5)

    if (sharesError) {
      console.log('❌ Erreur d\'accès à company_shares:', sharesError)
      console.log('   Code:', sharesError.code)
      console.log('   Message:', sharesError.message)
      return
    }

    console.log(`✅ Accès à company_shares réussi: ${shares.length} partages trouvés`)

    // 3. Tester l'insertion (avec service role)
    console.log('\n3. Test d\'insertion dans company_shares...')
    const testShare = {
      company_id: '00000000-0000-0000-0000-000000000000', // UUID fictif
      shared_with_email: 'test-rls@example.com',
      share_token: 'TEST-RLS-' + Date.now(),
      is_active: true,
      permissions: ['view_company']
    }

    const { data: insertedShare, error: insertError } = await supabase
      .from('company_shares')
      .insert(testShare)
      .select()
      .single()

    if (insertError) {
      console.log('❌ Erreur d\'insertion:', insertError)
      console.log('   Code:', insertError.code)
      console.log('   Message:', insertError.message)
    } else {
      console.log('✅ Insertion réussie:', insertedShare.id)
      
      // Nettoyer
      const { error: deleteError } = await supabase
        .from('company_shares')
        .delete()
        .eq('id', insertedShare.id)
      
      if (deleteError) {
        console.log('⚠️ Erreur lors du nettoyage:', deleteError)
      } else {
        console.log('✅ Nettoyage réussi')
      }
    }

    // 4. Vérifier la structure de la table
    console.log('\n4. Vérification de la structure de company_shares...')
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'company_shares' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    if (columnsError) {
      console.log('⚠️ Impossible de récupérer la structure (fonction exec_sql non disponible)')
    } else {
      console.log('✅ Structure de la table:')
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    }

    console.log('\n🎉 Test des politiques RLS terminé !')

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

testRLSPolicies() 