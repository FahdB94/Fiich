const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanDuplicates() {
  console.log('🧹 Nettoyage des doublons d\'entreprises partagées...\n')

  try {
    // 1. Récupérer toutes les entreprises partagées
    console.log('1. Récupération des entreprises partagées...')
    const { data: shares, error: sharesError } = await supabase
      .from('company_shares')
      .select('*')
      .eq('shared_with_email', 'coroalamelo@gmail.com')
      .eq('is_active', true)

    if (sharesError) {
      console.log(`❌ Erreur: ${sharesError.message}`)
      return
    }

    console.log(`✅ ${shares.length} entreprises partagées trouvées`)

    // 2. Récupérer les SIRET des entreprises
    const companyIds = [...new Set(shares.map(share => share.company_id))]
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, siret')
      .in('id', companyIds)

    if (companiesError) {
      console.log(`❌ Erreur: ${companiesError.message}`)
      return
    }

    // 3. Grouper par SIRET
    const siretGroups = new Map()
    shares.forEach(share => {
      const company = companies.find(c => c.id === share.company_id)
      const siret = company?.siret || 'no-siret'
      
      if (!siretGroups.has(siret)) {
        siretGroups.set(siret, [])
      }
      siretGroups.get(siret).push(share)
    })

    // 4. Identifier les doublons
    let duplicatesToRemove = []
    siretGroups.forEach((groupShares, siret) => {
      if (groupShares.length > 1) {
        console.log(`📋 SIRET ${siret}: ${groupShares.length} partages`)
        
        // Garder le plus récent, supprimer les autres
        const sortedShares = groupShares.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )
        
        const toKeep = sortedShares[0]
        const toRemove = sortedShares.slice(1)
        
        console.log(`   ✅ Garder: ${toKeep.id} (${toKeep.created_at})`)
        toRemove.forEach(share => {
          console.log(`   ❌ Supprimer: ${share.id} (${share.created_at})`)
        })
        
        duplicatesToRemove.push(...toRemove.map(s => s.id))
      }
    })

    if (duplicatesToRemove.length === 0) {
      console.log('✅ Aucun doublon trouvé')
      return
    }

    // 5. Supprimer les doublons
    console.log(`\n🗑️ Suppression de ${duplicatesToRemove.length} doublons...`)
    const { error: deleteError } = await supabase
      .from('company_shares')
      .delete()
      .in('id', duplicatesToRemove)

    if (deleteError) {
      console.log(`❌ Erreur lors de la suppression: ${deleteError.message}`)
    } else {
      console.log('✅ Doublons supprimés avec succès')
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

cleanDuplicates()
