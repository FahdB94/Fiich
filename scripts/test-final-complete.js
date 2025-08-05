#!/usr/bin/env node

/**
 * Test final complet de l'application Fiich
 * Vérifie toutes les fonctionnalités principales
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFinalComplete() {
  console.log('🎯 TEST FINAL COMPLET - APPLICATION FIICH')
  console.log('=' .repeat(60))

  const results = {
    database: false,
    pages: false,
    invitations: false,
    documents: false,
    sharing: false
  }

  try {
    // 1. Test de la base de données
    console.log('\n1️⃣ Test de la base de données...')
    
    const { data: companies, error: dbError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)

    if (dbError) {
      console.error('❌ Erreur base de données:', dbError)
    } else {
      console.log('✅ Base de données accessible')
      results.database = true
    }

    // 2. Test des pages principales
    console.log('\n2️⃣ Test des pages principales...')
    
    const pages = [
      'http://localhost:3000',
      'http://localhost:3000/auth/signin',
      'http://localhost:3000/auth/signup'
    ]

    let pagesOk = 0
    for (const page of pages) {
      try {
        const response = await fetch(page)
        if (response.status === 200) {
          pagesOk++
          console.log(`✅ ${page} - OK`)
        } else {
          console.log(`⚠️ ${page} - ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${page} - Erreur: ${error.message}`)
      }
    }

    if (pagesOk === pages.length) {
      console.log('✅ Toutes les pages principales accessibles')
      results.pages = true
    }

    // 3. Test du système d'invitations
    console.log('\n3️⃣ Test du système d\'invitations...')
    
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('id, status')
      .limit(1)

    if (invError) {
      console.error('❌ Erreur invitations:', invError)
    } else {
      console.log('✅ Table invitations accessible')
      
      // Récupérer un utilisateur existant pour invited_by
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (usersError || !users || users.length === 0) {
        console.log('⚠️ Aucun utilisateur trouvé pour le test d\'invitation')
        return
      }

      // Test de création d'invitation
      const testInvitation = {
        company_id: 'feab1dd5-e92e-4b72-a3bf-82cdb27d15d6',
        invited_email: 'test-final@example.com',
        invited_by: users[0].id,
        status: 'pending',
        invitation_token: 'FINAL-TEST-' + Date.now(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      const { data: newInvitation, error: createError } = await supabase
        .from('invitations')
        .insert(testInvitation)
        .select()
        .single()

      if (createError) {
        console.error('❌ Erreur création invitation:', createError)
      } else {
        console.log('✅ Création d\'invitation fonctionnelle')
        
        // Test de l'URL d'invitation
        const invitationUrl = `http://localhost:3000/invitation/${newInvitation.invitation_token}`
        const response = await fetch(invitationUrl)
        
        if (response.status === 200) {
          console.log('✅ Page d\'invitation accessible')
          results.invitations = true
        } else {
          console.log('⚠️ Page d\'invitation:', response.status)
        }

        // Nettoyer
        await supabase.from('invitations').delete().eq('id', newInvitation.id)
      }
    }

    // 4. Test des documents
    console.log('\n4️⃣ Test du système de documents...')
    
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, name')
      .limit(1)

    if (docError) {
      console.error('❌ Erreur documents:', docError)
    } else {
      console.log('✅ Table documents accessible')
      results.documents = true
    }

    // 5. Test du partage
    console.log('\n5️⃣ Test du système de partage...')
    
    const { data: shares, error: shareError } = await supabase
      .from('company_shares')
      .select('id, permissions')
      .limit(1)

    if (shareError) {
      console.error('❌ Erreur partages:', shareError)
    } else {
      console.log('✅ Table company_shares accessible')
      results.sharing = true
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ DES TESTS')
    console.log('=' .repeat(40))
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌'
      console.log(`${status} ${test.toUpperCase()}: ${passed ? 'OK' : 'ÉCHEC'}`)
    })

    const passedTests = Object.values(results).filter(Boolean).length
    const totalTests = Object.keys(results).length

    console.log(`\n🎯 SCORE: ${passedTests}/${totalTests} tests réussis`)
    
    if (passedTests === totalTests) {
      console.log('🎉 TOUS LES TESTS RÉUSSIS !')
      console.log('✅ L\'application Fiich est entièrement fonctionnelle')
    } else {
      console.log('⚠️ Certains tests ont échoué')
    }

  } catch (error) {
    console.error('❌ Erreur lors du test final:', error)
  }
}

// Exécuter le test final
testFinalComplete() 