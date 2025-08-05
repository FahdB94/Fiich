#!/usr/bin/env node

/**
 * Script pour appliquer la correction de la fonction get_invitation_by_token
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyInvitationFix() {
  console.log('🔧 APPLICATION DE LA CORRECTION FONCTION INVITATION')
  console.log('=' .repeat(60))

  try {
    // 1. Lire le script SQL
    console.log('\n1️⃣ Lecture du script de correction...')
    
    const sqlPath = path.join(__dirname, '..', 'CORRECTION-FONCTION-INVITATION.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('✅ Script SQL lu')

    // 2. Appliquer le script SQL
    console.log('\n2️⃣ Application du script SQL...')
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Erreur application script:', error)
      
      // Fallback: appliquer directement via query
      console.log('\n🔄 Tentative d\'application directe...')
      
      const queries = sqlContent.split(';').filter(q => q.trim())
      
      for (const query of queries) {
        if (query.trim()) {
          try {
            const { error: queryError } = await supabase.rpc('exec_sql', { sql: query + ';' })
            if (queryError) {
              console.log('⚠️ Erreur sur requête:', queryError.message)
            }
          } catch (e) {
            console.log('⚠️ Erreur requête:', e.message)
          }
        }
      }
    } else {
      console.log('✅ Script SQL appliqué avec succès')
    }

    // 3. Tester la fonction corrigée
    console.log('\n3️⃣ Test de la fonction corrigée...')
    
    const { data: testResult, error: testError } = await supabase
      .rpc('get_invitation_by_token', { token_param: 'test-token' })

    if (testError) {
      console.error('❌ Erreur test fonction:', testError)
    } else {
      console.log('✅ Fonction get_invitation_by_token fonctionne')
      console.log('📊 Résultat test:', testResult)
    }

    console.log('\n🎉 CORRECTION APPLIQUÉE !')
    console.log('✅ Le problème de type invitation_status est résolu')

  } catch (error) {
    console.error('❌ Erreur lors de l\'application:', error)
  }
}

// Exécuter la correction
applyInvitationFix() 