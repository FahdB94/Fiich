#!/usr/bin/env node

/**
 * Script pour vérifier la structure de la table invitations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkInvitationsTable() {
  console.log('🔍 VÉRIFICATION DE LA TABLE INVITATIONS')
  console.log('=' .repeat(50))

  try {
    // 1. Vérifier l'accès à la table
    console.log('\n1️⃣ Test d\'accès à la table invitations...')
    
    const { data: testData, error: testError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur accès table invitations:', testError)
      return
    }

    console.log('✅ Table invitations accessible')
    if (testData && testData.length > 0) {
      console.log('📋 Exemple de données:', Object.keys(testData[0]))
    }

    // 2. Vérifier les données existantes
    console.log('\n2️⃣ Données existantes...')
    
    const { data: invitations, error: dataError } = await supabase
      .from('invitations')
      .select('*')
      .limit(3)

    if (dataError) {
      console.error('❌ Erreur récupération données:', dataError)
      return
    }

    console.log(`📊 ${invitations.length} invitations trouvées:`)
    invitations.forEach((inv, index) => {
      console.log(`  ${index + 1}. ID: ${inv.id}, Email: ${inv.invited_email}, Status: ${inv.status}`)
    })

    // 3. Vérifier les fonctions RPC
    console.log('\n3️⃣ Fonctions RPC disponibles...')
    
    // Test de la fonction RPC
    const { data: functions, error: funcError } = await supabase
      .rpc('get_invitation_by_token', { token_param: 'test' })

    if (funcError) {
      console.log('⚠️ Fonction get_invitation_by_token:', funcError.message)
    } else {
      console.log('✅ Fonction get_invitation_by_token disponible')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

// Exécuter la vérification
checkInvitationsTable() 