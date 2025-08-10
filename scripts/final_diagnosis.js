const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://eiawccnqfmvdnvjlyftx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function finalDiagnosis() {
  console.log('🔍 Diagnostic final Supabase...\n')

  try {
    // 1. Récupérer une vraie company
    console.log('1️⃣ Récupération d\'une company...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, user_id')
      .limit(1)
    
    if (companiesError || companies.length === 0) {
      console.error('❌ Impossible de récupérer une company')
      return
    }
    
    const company = companies[0]
    console.log(`✅ Company trouvée: ${company.company_name} (ID: ${company.id})`)
    console.log(`   Propriétaire: ${company.user_id}\n`)

    // 2. Vérifier les company_members
    console.log('2️⃣ Vérification company_members...')
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select('*')
      .eq('company_id', company.id)
    
    if (membersError) {
      console.error('❌ Erreur company_members:', membersError)
    } else {
      console.log(`✅ ${members.length} membre(s) trouvé(s):`)
      members.forEach(member => {
        console.log(`   - User: ${member.user_id}, Role: ${member.role}, Status: ${member.status}`)
      })
    }
    console.log()

    // 3. Tester l'insertion d'invitation avec la clé de service
    console.log('3️⃣ Test insertion invitation (clé de service)...')
    const testInvitation = {
      company_id: company.id,
      invited_email: 'test@example.com',
      invited_by: company.user_id,
      invitation_token: 'test-token-' + Date.now(),
      role_requested: 'MEMBER',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const { data: insertResult, error: insertError } = await supabase
      .from('invitations')
      .insert(testInvitation)
      .select('id, company_id, invited_email, invited_by')
      .single()
    
    if (insertError) {
      console.error('❌ Erreur insertion avec clé de service:', insertError)
      console.error('   Code:', insertError.code)
      console.error('   Message:', insertError.message)
      console.error('   Details:', insertError.details)
    } else {
      console.log('✅ Insertion réussie avec clé de service!')
      console.log('   ID:', insertResult.id)
      console.log('   Company ID:', insertResult.company_id)
      console.log('   Email:', insertResult.invited_email)
      console.log('   Invité par:', insertResult.invited_by)
      
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

    // 4. Tester avec la clé anon (devrait échouer à cause de RLS)
    console.log('4️⃣ Test avec clé anon (devrait échouer avec RLS)...')
    const anonSupabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjc3MjEsImV4cCI6MjA2OTc0MzcyMX0.xuO2IPGcw5MoFSisEEQBOUd7qtR69eVZ8lSHfw-jWrQ')
    
    const { data: anonTest, error: anonError } = await anonSupabase
      .from('invitations')
      .select('*')
      .limit(1)
    
    if (anonError) {
      console.log('✅ Utilisateur anonyme bloqué par RLS (normal)')
      console.log('   Erreur:', anonError.message)
    } else {
      console.log('⚠️ PROBLÈME: Utilisateur anonyme peut accéder aux invitations!')
      console.log('   RLS ne fonctionne pas correctement')
    }
    console.log()

    // 5. Vérifier si la table invitations a des contraintes
    console.log('5️⃣ Vérification contraintes de la table invitations...')
    
    // Essayer d'insérer des données invalides pour voir les contraintes
    const invalidInvitation = {
      company_id: '00000000-0000-0000-0000-000000000000', // UUID invalide
      invited_email: 'test@example.com',
      invited_by: company.user_id,
      invitation_token: 'test-token',
      role_requested: 'MEMBER',
      expires_at: new Date().toISOString()
    }

    const { data: invalidResult, error: invalidError } = await supabase
      .from('invitations')
      .insert(invalidInvitation)
      .select('id')
      .single()
    
    if (invalidError) {
      console.log('✅ Contraintes actives (normal):')
      console.log('   Code:', invalidError.code)
      console.log('   Message:', invalidError.message)
      if (invalidError.details) {
        console.log('   Details:', invalidError.details)
      }
    } else {
      console.log('⚠️ Aucune contrainte détectée (problématique)')
    }

    console.log('\n🎯 CONCLUSION:')
    if (insertError) {
      console.log('❌ Le problème persiste même avec la clé de service')
      console.log('   Cela suggère un problème de structure de table ou de contraintes')
    } else {
      console.log('✅ L\'insertion fonctionne avec la clé de service')
      console.log('   Le problème RLS est probablement dans l\'API Next.js')
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

finalDiagnosis()
