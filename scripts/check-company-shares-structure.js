const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkCompanySharesStructure() {
  console.log('🔍 VÉRIFICATION STRUCTURE TABLE company_shares')
  console.log('==============================================')

  try {
    // Test 1: Vérifier la structure de la table
    console.log('\n📥 Test 1: Structure de la table company_shares')
    const { data: structure, error: structureError } = await supabase
      .from('company_shares')
      .select('*')
      .limit(1)
    
    if (structureError) {
      console.log('❌ Erreur structure:', structureError.message)
    } else {
      console.log('✅ Structure OK, colonnes disponibles:')
      if (structure && structure.length > 0) {
        Object.keys(structure[0]).forEach(col => {
          console.log(`   - ${col}`)
        })
      }
    }

    // Test 2: Lister tous les partages
    console.log('\n📥 Test 2: Liste des partages')
    const { data: shares, error: sharesError } = await supabase
      .from('company_shares')
      .select('*')
    
    if (sharesError) {
      console.log('❌ Erreur partages:', sharesError.message)
    } else {
      console.log('✅ Partages trouvés:', shares.length)
      if (shares.length > 0) {
        console.log('   Premier partage:', shares[0])
      }
    }

    // Test 3: Test avec les colonnes correctes
    console.log('\n📥 Test 3: Test avec colonnes existantes')
    const { data: testShares, error: testError } = await supabase
      .from('company_shares')
      .select(`
        id,
        company_id,
        shared_with_email,
        is_active,
        created_at
      `)
    
    if (testError) {
      console.log('❌ Erreur test:', testError.message)
    } else {
      console.log('✅ Test OK, partages récupérés:', testShares.length)
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

checkCompanySharesStructure() 