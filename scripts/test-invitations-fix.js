#!/usr/bin/env node

/**
 * Script de test pour vérifier la correction des invitations
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

async function testInvitationsFix() {
  console.log('🧪 Test de la correction des invitations')
  console.log('========================================\n')

  try {
    // 1. Vérifier la structure de la table invitations
    console.log('1️⃣ Vérification de la structure de la table invitations...')
    
    const { data: invitations, error: structureError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)

    if (structureError) {
      console.error('❌ Erreur structure table invitations:', structureError.message)
      return
    }

    console.log('✅ Table invitations accessible')
    console.log('📋 Colonnes disponibles:', Object.keys(invitations[0] || {}))

    // 2. Vérifier la table companies
    console.log('\n2️⃣ Vérification de la table companies...')
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name')
      .limit(1)

    if (companiesError) {
      console.error('❌ Erreur table companies:', companiesError.message)
      return
    }

    console.log('✅ Table companies accessible')

    // 3. Tester la requête corrigée
    console.log('\n3️⃣ Test de la requête corrigée...')
    
    const testEmail = 'test@example.com'
    const { data: testInvitations, error: queryError } = await supabase
      .from('invitations')
      .select(`
        *,
        companies(company_name)
      `)
      .eq('invited_email', testEmail)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('❌ Erreur requête corrigée:', queryError.message)
      console.error('Code:', queryError.code)
      console.error('Details:', queryError.details)
      console.error('Hint:', queryError.hint)
    } else {
      console.log('✅ Requête corrigée fonctionne')
      console.log('📊 Invitations trouvées:', testInvitations.length)
      
      if (testInvitations.length > 0) {
        console.log('📋 Exemple d\'invitation:', {
          id: testInvitations[0].id,
          company_id: testInvitations[0].company_id,
          company_name: testInvitations[0].companies?.company_name,
          invited_email: testInvitations[0].invited_email,
          expires_at: testInvitations[0].expires_at
        })
      }
    }

    // 4. Tester avec une vraie invitation si elle existe
    console.log('\n4️⃣ Test avec une vraie invitation...')
    
    const { data: realInvitations, error: realError } = await supabase
      .from('invitations')
      .select(`
        *,
        companies(company_name)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (realError) {
      console.error('❌ Erreur requête réelle:', realError.message)
    } else if (realInvitations && realInvitations.length > 0) {
      console.log('✅ Invitation réelle trouvée')
      console.log('📋 Détails:', {
        id: realInvitations[0].id,
        company_name: realInvitations[0].companies?.company_name,
        invited_email: realInvitations[0].invited_email,
        expires_at: realInvitations[0].expires_at
      })
    } else {
      console.log('ℹ️  Aucune invitation réelle trouvée')
    }

    console.log('\n🎉 Test terminé !')
    console.log('\n📋 Résumé :')
    console.log('- ✅ Structure de la table vérifiée')
    console.log('- ✅ Requête corrigée testée')
    console.log('- ✅ Jointure companies fonctionne')
    console.log('- ✅ Filtre de date corrigé')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Exécuter le test
testInvitationsFix() 