const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const SUPABASE_URL = 'https://eiawccnqfmvdnvjlyftx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik'

// Créer le client Supabase avec la clé de service (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function diagnoseSupabase() {
  console.log('🔍 Diagnostic Supabase v2 en cours...\n')

  try {
    // 1. Vérifier la connexion et récupérer une vraie company_id
    console.log('1️⃣ Test de connexion et récupération company_id...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, user_id')
      .limit(3)
    
    if (companiesError) {
      console.error('❌ Erreur récupération companies:', companiesError)
      return
    }
    
    if (companies.length === 0) {
      console.error('❌ Aucune company trouvée dans la base')
      return
    }
    
    console.log('✅ Connexion réussie')
    console.log('🏢 Companies trouvées:')
    companies.forEach(company => {
      console.log(`   - ID: ${company.id}, Nom: ${company.name}, User: ${company.user_id}`)
    })
    
    const testCompanyId = companies[0].id
    const testUserId = companies[0].user_id
    console.log(`📝 Utilisation de company_id: ${testCompanyId} pour les tests\n`)

    // 2. Vérifier la structure de la table invitations
    console.log('2️⃣ Test de la table invitations...')
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)
    
    if (invitationsError) {
      console.error('❌ Erreur accès table invitations:', invitationsError)
    } else {
      console.log('✅ Table invitations accessible')
      if (invitations.length > 0) {
        console.log('📋 Exemple d\'invitation:', invitations[0])
      } else {
        console.log('📋 Table invitations vide')
      }
    }
    console.log()

    // 3. Tester l'insertion avec une vraie company_id
    console.log('3️⃣ Test d\'insertion avec vraie company_id...')
    const testInvitation = {
      company_id: testCompanyId,
      invited_email: 'test@example.com',
      invited_by: testUserId,
      invitation_token: 'test-token-' + Date.now(),
      role_requested: 'MEMBER',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const { data: insertResult, error: insertError } = await supabase
      .from('invitations')
      .insert(testInvitation)
      .select('id, company_id, invited_email')
      .single()
    
    if (insertError) {
      console.error('❌ Erreur insertion:', insertError)
      console.error('   Code:', insertError.code)
      console.error('   Message:', insertError.message)
      console.error('   Details:', insertError.details)
    } else {
      console.log('✅ Insertion réussie!')
      console.log('   ID:', insertResult.id)
      console.log('   Company ID:', insertResult.company_id)
      console.log('   Email:', insertResult.invited_email)
      
      // Nettoyer le test
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', insertResult.id)
      
      if (deleteError) {
        console.log('⚠️ Erreur lors du nettoyage:', deleteError.message)
      } else {
        console.log('🧹 Test nettoyé')
      }
    }
    console.log()

    // 4. Vérifier les company_members
    console.log('4️⃣ Vérification company_members...')
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', testCompanyId)
      .limit(5)
    
    if (membersError) {
      console.error('❌ Erreur récupération company_members:', membersError)
    } else {
      console.log('✅ Table company_members accessible')
      console.log('👥 Membres trouvés:', members.length)
      members.forEach(member => {
        console.log(`   - User: ${member.user_id}, Role: ${member.role}, Status: ${member.status}`)
      })
    }
    console.log()

    // 5. Tester avec un utilisateur authentifié (simulation)
    console.log('5️⃣ Test avec utilisateur authentifié (simulation)...')
    
    // Créer un client avec la clé anon pour simuler un utilisateur normal
    const anonSupabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjc3MjEsImV4cCI6MjA2OTc0MzcyMX0.xuO2IPGcw5MoFSisEEQBOUd7qtR69eVZ8lSHfw-jWrQ')
    
    const { data: anonTest, error: anonError } = await anonSupabase
      .from('invitations')
      .select('*')
      .limit(1)
    
    if (anonError) {
      console.log('⚠️ Utilisateur anonyme ne peut pas accéder aux invitations (normal avec RLS)')
      console.log('   Erreur:', anonError.message)
    } else {
      console.log('⚠️ Utilisateur anonyme peut accéder aux invitations (problème RLS!)')
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le diagnostic
diagnoseSupabase()
