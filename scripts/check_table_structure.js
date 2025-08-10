const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://eiawccnqfmvdnvjlyftx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkStructure() {
  console.log('🔍 Vérification structure des tables...\n')

  try {
    // Vérifier la table companies
    console.log('1️⃣ Structure de la table companies...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1)
    
    if (companiesError) {
      console.error('❌ Erreur companies:', companiesError)
    } else if (companies.length > 0) {
      console.log('✅ Companies accessible')
      console.log('📋 Colonnes disponibles:', Object.keys(companies[0]))
      console.log('📋 Premier enregistrement:', companies[0])
    } else {
      console.log('📋 Table companies vide')
    }
    console.log()

    // Vérifier la table invitations
    console.log('2️⃣ Structure de la table invitations...')
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .limit(1)
    
    if (invitationsError) {
      console.error('❌ Erreur invitations:', invitationsError)
    } else if (invitations.length > 0) {
      console.log('✅ Invitations accessible')
      console.log('📋 Colonnes disponibles:', Object.keys(invitations[0]))
      console.log('📋 Premier enregistrement:', invitations[0])
    } else {
      console.log('📋 Table invitations vide')
    }
    console.log()

    // Vérifier la table company_members
    console.log('3️⃣ Structure de la table company_members...')
    const { data: members, error: membersError } = await supabase
      .from('company_members')
      .select('*')
      .limit(1)
    
    if (membersError) {
      console.error('❌ Erreur company_members:', membersError)
    } else if (members.length > 0) {
      console.log('✅ Company_members accessible')
      console.log('📋 Colonnes disponibles:', Object.keys(members[0]))
      console.log('📋 Premier enregistrement:', members[0])
    } else {
      console.log('📋 Table company_members vide')
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

checkStructure()
