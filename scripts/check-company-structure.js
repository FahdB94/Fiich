#!/usr/bin/env node

/**
 * Script pour vérifier la structure de la table companies
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCompanyStructure() {
  console.log('🔍 Vérification de la structure de la table companies')
  console.log('===================================================\n')

  try {
    // 1. Vérifier la structure de la table companies
    console.log('1️⃣ Structure de la table companies...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1)

    if (companiesError) {
      console.error('❌ Erreur accès table companies:', companiesError.message)
      return
    }

    if (companies && companies.length > 0) {
      console.log('✅ Table companies accessible')
      console.log('📋 Colonnes disponibles:')
      Object.keys(companies[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof companies[0][column]}`)
      })
    } else {
      console.log('ℹ️  Table companies vide')
    }

    // 2. Vérifier s'il y a une colonne pour identifier le propriétaire
    console.log('\n2️⃣ Recherche de la colonne propriétaire...')
    
    const possibleOwnerColumns = ['owner_id', 'user_id', 'created_by', 'owner', 'user']
    const foundColumns = []
    
    if (companies && companies.length > 0) {
      const sampleCompany = companies[0]
      possibleOwnerColumns.forEach(col => {
        if (sampleCompany.hasOwnProperty(col)) {
          foundColumns.push(col)
        }
      })
    }

    if (foundColumns.length > 0) {
      console.log('✅ Colonnes propriétaire trouvées:', foundColumns)
    } else {
      console.log('❌ Aucune colonne propriétaire trouvée')
      console.log('💡 Colonnes recherchées:', possibleOwnerColumns)
    }

    // 3. Vérifier la table auth.users
    console.log('\n3️⃣ Vérification de la table auth.users...')
    
    // On ne peut pas directement accéder à auth.users avec le client normal
    // Mais on peut vérifier via une requête RPC ou en regardant les données existantes
    console.log('ℹ️  Table auth.users accessible via RPC uniquement')

    // 4. Proposer une solution
    console.log('\n4️⃣ Solution proposée...')
    
    if (foundColumns.length > 0) {
      console.log('✅ Utilisez une de ces colonnes:', foundColumns[0])
      console.log('💡 Modifiez la fonction pour utiliser:', foundColumns[0])
    } else {
      console.log('❌ Aucune colonne propriétaire trouvée')
      console.log('💡 Solutions possibles:')
      console.log('   1. Ajouter une colonne owner_id à la table companies')
      console.log('   2. Utiliser created_by si elle existe')
      console.log('   3. Utiliser user_id si elle existe')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécuter la vérification
checkCompanyStructure() 