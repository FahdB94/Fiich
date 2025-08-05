#!/usr/bin/env node

/**
 * Script pour vérifier la vraie structure de la table invitations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkInvitationsStructure() {
  console.log('🔍 VÉRIFICATION STRUCTURE TABLE INVITATIONS')
  console.log('=' .repeat(50))

  try {
    // 1. Vérifier la structure réelle
    console.log('\n1️⃣ Structure réelle de la table invitations...')
    
    const { data: invitations, error: structureError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)

    if (structureError) {
      console.error('❌ Erreur accès table:', structureError)
      return
    }

    if (invitations && invitations.length > 0) {
      console.log('📋 Colonnes disponibles:')
      Object.keys(invitations[0]).forEach((col, index) => {
        console.log(`  ${index + 1}. ${col}: ${typeof invitations[0][col]}`)
      })
    } else {
      console.log('⚠️ Aucune invitation trouvée pour analyser la structure')
    }

    // 2. Vérifier les données existantes
    console.log('\n2️⃣ Données existantes...')
    
    const { data: allInvitations, error: dataError } = await supabase
      .from('invitations')
      .select('*')
      .limit(5)

    if (dataError) {
      console.error('❌ Erreur récupération données:', dataError)
    } else {
      console.log(`📊 ${allInvitations.length} invitations trouvées:`)
      allInvitations.forEach((inv, index) => {
        console.log(`  ${index + 1}. ID: ${inv.id}`)
        console.log(`     Email: ${inv.invited_email}`)
        console.log(`     Token: ${inv.invitation_token}`)
        // Afficher toutes les colonnes disponibles
        Object.entries(inv).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`)
        })
        console.log('')
      })
    }

    // 3. Tester une requête simple
    console.log('\n3️⃣ Test requête simple...')
    
    const { data: testQuery, error: testError } = await supabase
      .from('invitations')
      .select('id, invited_email, invitation_token')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur requête simple:', testError)
    } else {
      console.log('✅ Requête simple fonctionne')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

// Exécuter la vérification
checkInvitationsStructure() 