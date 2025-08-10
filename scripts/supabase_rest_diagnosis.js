const https = require('https')

// Configuration Supabase
const SUPABASE_URL = 'https://eiawccnqfmvdnvjlyftx.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjc3MjEsImV4cCI6MjA2OTc0MzcyMX0.xuO2IPGcw5MoFSisEEQBOUd7qtR69eVZ8lSHfw-jWrQ'

// Fonction pour faire des requêtes HTTPS vers Supabase
function makeSupabaseRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL)
    
    const requestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': options.useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${options.useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY}`,
        ...options.headers
      }
    }
    
    const req = https.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          })
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    
    req.end()
  })
}

async function diagnoseSupabase() {
  console.log('🔍 Diagnostic direct Supabase via API REST...\n')
  
  try {
    // 1. Test de connexion avec la clé de service
    console.log('1️⃣ Test de connexion avec la clé de service...')
    const connectionTest = await makeSupabaseRequest('/rest/v1/companies?select=id&limit=1', {
      useServiceRole: true
    })
    
    if (connectionTest.statusCode === 200) {
      console.log('✅ Connexion réussie avec la clé de service')
      console.log(`   Status: ${connectionTest.statusCode}`)
      if (connectionTest.data && Array.isArray(connectionTest.data)) {
        console.log(`   Companies trouvées: ${connectionTest.data.length}`)
      }
    } else {
      console.error('❌ Erreur de connexion avec la clé de service')
      console.error('   Status:', connectionTest.statusCode)
      console.error('   Réponse:', connectionTest.data)
      return
    }
    console.log()

    // 2. Récupérer une company pour les tests
    console.log('2️⃣ Récupération d\'une company pour les tests...')
    const companiesResponse = await makeSupabaseRequest('/rest/v1/companies?select=id,company_name,user_id&limit=1', {
      useServiceRole: true
    })
    
    if (companiesResponse.statusCode !== 200 || !companiesResponse.data || companiesResponse.data.length === 0) {
      console.error('❌ Impossible de récupérer une company')
      return
    }
    
    const company = companiesResponse.data[0]
    console.log(`✅ Company trouvée: ${company.company_name}`)
    console.log(`   ID: ${company.id}`)
    console.log(`   Propriétaire: ${company.user_id}`)
    console.log()

    // 3. Tester l'insertion d'invitation avec la clé de service
    console.log('3️⃣ Test insertion invitation avec la clé de service...')
    const testInvitation = {
      company_id: company.id,
      invited_email: 'test@example.com',
      invited_by: company.user_id,
      invitation_token: 'test-token-' + Date.now(),
      role_requested: 'MEMBER',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const insertResponse = await makeSupabaseRequest('/rest/v1/invitations', {
      method: 'POST',
      useServiceRole: true,
      body: testInvitation
    })
    
    if (insertResponse.statusCode === 201) {
      console.log('✅ Insertion réussie avec la clé de service!')
      console.log('   Réponse:', insertResponse.data)
      
      // Nettoyer le test
      const deleteResponse = await makeSupabaseRequest(`/rest/v1/invitations?id=eq.${insertResponse.data[0].id}`, {
        method: 'DELETE',
        useServiceRole: true
      })
      
      if (deleteResponse.statusCode === 204) {
        console.log('🧹 Test nettoyé')
      } else {
        console.log('⚠️ Erreur lors du nettoyage:', deleteResponse.statusCode)
      }
    } else {
      console.error('❌ Erreur insertion avec la clé de service')
      console.error('   Status:', insertResponse.statusCode)
      console.error('   Réponse:', insertResponse.data)
    }
    console.log()

    // 4. Tester avec la clé anon (devrait échouer à cause de RLS)
    console.log('4️⃣ Test avec la clé anon (devrait échouer avec RLS)...')
    const anonResponse = await makeSupabaseRequest('/rest/v1/invitations?select=id&limit=1', {
      useServiceRole: false
    })
    
    if (anonResponse.statusCode === 401 || anonResponse.statusCode === 403) {
      console.log('✅ Utilisateur anonyme bloqué par RLS (normal)')
      console.log(`   Status: ${anonResponse.statusCode}`)
      console.log('   Réponse:', anonResponse.data)
    } else if (anonResponse.statusCode === 200) {
      console.log('⚠️ PROBLÈME: Utilisateur anonyme peut accéder aux invitations!')
      console.log('   RLS ne fonctionne pas correctement')
      console.log('   Réponse:', anonResponse.data)
    } else {
      console.log('⚠️ Statut inattendu avec la clé anon:', anonResponse.statusCode)
      console.log('   Réponse:', anonResponse.data)
    }
    console.log()

    // 5. Vérifier la structure de la table invitations
    console.log('5️⃣ Vérification structure de la table invitations...')
    const structureResponse = await makeSupabaseRequest('/rest/v1/invitations?select=*&limit=1', {
      useServiceRole: true
    })
    
    if (structureResponse.statusCode === 200) {
      console.log('✅ Structure de la table invitations accessible')
      if (structureResponse.data && structureResponse.data.length > 0) {
        console.log('📋 Colonnes disponibles:', Object.keys(structureResponse.data[0]))
        console.log('📋 Exemple d\'enregistrement:', structureResponse.data[0])
      } else {
        console.log('📋 Table invitations vide')
      }
    } else {
      console.error('❌ Erreur accès structure:', structureResponse.statusCode)
      console.error('   Réponse:', structureResponse.data)
    }
    console.log()

    // 6. Vérifier les company_members
    console.log('6️⃣ Vérification company_members...')
    const membersResponse = await makeSupabaseRequest(`/rest/v1/company_members?company_id=eq.${company.id}&select=*`, {
      useServiceRole: true
    })
    
    if (membersResponse.statusCode === 200) {
      console.log('✅ Table company_members accessible')
      console.log(`👥 ${membersResponse.data.length} membre(s) trouvé(s):`)
      membersResponse.data.forEach(member => {
        console.log(`   - User: ${member.user_id}, Role: ${member.role}, Status: ${member.status}`)
      })
    } else {
      console.error('❌ Erreur company_members:', membersResponse.statusCode)
      console.error('   Réponse:', membersResponse.data)
    }

    console.log('\n🎯 CONCLUSION:')
    if (insertResponse.statusCode === 201) {
      console.log('✅ L\'insertion fonctionne avec la clé de service')
      console.log('   Le problème RLS est probablement dans l\'API Next.js')
      console.log('   Vérifiez la configuration du client Supabase dans votre API')
    } else {
      console.log('❌ Le problème persiste même avec la clé de service')
      console.log('   Cela suggère un problème de structure de table ou de contraintes')
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
  }
}

// Exécuter le diagnostic
diagnoseSupabase()
