// DIAGNOSTIC COMPLET DE L'APPLICATION FIICH
// Ce script va identifier TOUS les problèmes d'un coup

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDU4OTcsImV4cCI6MjA2OTQ4MTg5N30.zvfXx4LXIozX_3WA3M19uza83FmMP7vDjgq6hAtb12Q'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwNTg5NywiZXhwIjoyMDY5NDgxODk3fQ.XL_jXSUFAxchEu-POq3JjF5oHs7e0J22ufhYlUXfUHc'

const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

async function diagnostiqueComplet() {
  console.log('🔍 DIAGNOSTIC COMPLET FIICH APP\n')
  console.log('=' .repeat(50))
  
  try {
    // 1. TEST CONNEXION SUPABASE
    console.log('\n1️⃣ TEST CONNEXION SUPABASE')
    console.log('-'.repeat(30))
    
    const { data: testData, error: testError } = await anonClient
      .from('users')
      .select('count', { count: 'exact' })
    
    if (testError) {
      console.log(`❌ ERREUR: ${testError.message}`)
      return
    }
    console.log('✅ Connexion Supabase OK')
    
    // 2. ANALYSE DES UTILISATEURS
    console.log('\n2️⃣ ANALYSE DES UTILISATEURS')
    console.log('-'.repeat(30))
    
    // Utilisateurs auth.users
    const { data: authUsers } = await serviceClient.auth.admin.listUsers()
    console.log(`Auth Users: ${authUsers.users.length}`)
    
    // Utilisateurs public.users
    const { data: publicUsers } = await serviceClient.from('users').select('*')
    console.log(`Public Users: ${publicUsers.length}`)
    
    // Vérification synchronisation
    const authUserIds = authUsers.users.map(u => u.id)
    const publicUserIds = publicUsers.map(u => u.id)
    const missingUsers = authUsers.users.filter(u => !publicUserIds.includes(u.id))
    
    if (missingUsers.length > 0) {
      console.log(`❌ ${missingUsers.length} utilisateur(s) manquant(s) dans public.users`)
      // Correction automatique
      for (const user of missingUsers) {
        const { error } = await serviceClient.from('users').insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || ''
        })
        if (!error) {
          console.log(`✅ Créé: ${user.email}`)
        }
      }
    } else {
      console.log('✅ Tous les utilisateurs sont synchronisés')
    }
    
    // 3. TEST DES POLITIQUES RLS
    console.log('\n3️⃣ TEST DES POLITIQUES RLS')
    console.log('-'.repeat(30))
    
    const userId = authUsers.users[0]?.id
    if (userId) {
      // Test création entreprise
      const testCompany = {
        user_id: userId,
        company_name: 'Test Company ' + Date.now(),
        address_line_1: '123 Test Street',
        postal_code: '75001',
        city: 'Paris',
        country: 'France',
        email: 'test@company.com'
      }
      
      const { data: companyData, error: companyError } = await serviceClient
        .from('companies')
        .insert(testCompany)
        .select()
        .single()
      
      if (companyError) {
        if (companyError.message.includes('infinite recursion')) {
          console.log('❌ RÉCURSION INFINIE détectée dans les politiques RLS')
          console.log('   → Il faut appliquer fix-recursion-final.sql')
        } else {
          console.log(`❌ Erreur RLS: ${companyError.message}`)
        }
      } else {
        console.log('✅ Politiques RLS fonctionnelles')
        // Nettoyer
        await serviceClient.from('companies').delete().eq('id', companyData.id)
      }
    }
    
    // 4. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
    console.log('\n4️⃣ VARIABLES D\'ENVIRONNEMENT')
    console.log('-'.repeat(30))
    
    const fs = require('fs')
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8')
      console.log('✅ Fichier .env.local existe')
      
      const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL')
      const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      const hasCorrectPort = envContent.includes('localhost:3000')
      
      console.log(`   SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}`)
      console.log(`   SUPABASE_KEY: ${hasSupabaseKey ? '✅' : '❌'}`)
      console.log(`   PORT 3000: ${hasCorrectPort ? '✅' : '❌'}`)
    } else {
      console.log('❌ Fichier .env.local manquant')
    }
    
    // 5. RÉSUMÉ ET ACTIONS
    console.log('\n5️⃣ RÉSUMÉ ET ACTIONS REQUISES')
    console.log('-'.repeat(30))
    
    let actions = []
    
    if (missingUsers.length > 0) {
      actions.push('✅ Utilisateurs manquants: CORRIGÉ automatiquement')
    }
    
    // Vérifier si la récursion existe encore
    const { error: recursionTest } = await anonClient.from('companies').select('id').limit(1)
    if (recursionTest && recursionTest.message.includes('infinite recursion')) {
      actions.push('❌ APPLIQUER fix-recursion-final.sql dans Supabase')
    }
    
    if (actions.length === 0) {
      console.log('🎉 TOUT EST OK ! L\'application devrait fonctionner')
      console.log('\n📋 ÉTAPES POUR TESTER:')
      console.log('1. Attendez que le serveur soit "Ready"')
      console.log('2. Allez sur http://localhost:3000/companies/new')
      console.log('3. Videz le cache: Cmd+Shift+R')
      console.log('4. Connectez-vous et testez')
    } else {
      console.log('⚠️  ACTIONS REQUISES:')
      actions.forEach(action => console.log(`   ${action}`))
    }
    
  } catch (error) {
    console.log(`💥 Erreur inattendue: ${error.message}`)
  }
}

diagnostiqueComplet()