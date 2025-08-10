const https = require('https')
const http = require('http')

// Configuration
const API_BASE = 'http://localhost:3000'

// Fonction pour faire des requêtes HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }
    
    const req = client.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        })
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

async function testAPI() {
  console.log('🔍 Test direct de l\'API de votre application...\n')
  
  try {
    // 1. Test de l'endpoint principal
    console.log('1️⃣ Test de l\'endpoint principal /')
    const mainResponse = await makeRequest(`${API_BASE}/`)
    console.log(`   Status: ${mainResponse.statusCode}`)
    console.log(`   Content-Type: ${mainResponse.headers['content-type']}`)
    console.log(`   Taille: ${mainResponse.data.length} caractères`)
    console.log()
    
    // 2. Test de l'endpoint de debug (sans authentification)
    console.log('2️⃣ Test de l\'endpoint de debug /api/share-company/debug')
    const debugResponse = await makeRequest(`${API_BASE}/api/share-company/debug`)
    console.log(`   Status: ${debugResponse.statusCode}`)
    console.log(`   Réponse: ${debugResponse.data.substring(0, 100)}...`)
    console.log()
    
    // 3. Test de l'endpoint share-company (sans authentification)
    console.log('3️⃣ Test de l\'endpoint share-company /api/share-company')
    const shareResponse = await makeRequest(`${API_BASE}/api/share-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyId: 'test',
        email: 'test@example.com',
        role: 'MEMBER'
      })
    })
    console.log(`   Status: ${shareResponse.statusCode}`)
    console.log(`   Réponse: ${shareResponse.data}`)
    console.log()
    
    // 4. Test avec un token d'authentification factice
    console.log('4️⃣ Test avec un token d\'authentification factice')
    const fakeAuthResponse = await makeRequest(`${API_BASE}/api/share-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-123'
      },
      body: JSON.stringify({
        companyId: 'test',
        email: 'test@example.com',
        role: 'MEMBER'
      })
    })
    console.log(`   Status: ${fakeAuthResponse.statusCode}`)
    console.log(`   Réponse: ${fakeAuthResponse.data}`)
    console.log()
    
    // 5. Vérifier les logs du serveur
    console.log('5️⃣ Vérification des logs du serveur...')
    console.log('   Ouvrez votre terminal Cursor et regardez les logs de npm run dev')
    console.log('   Vous devriez voir des erreurs détaillées lors des tests ci-dessus')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
  }
}

testAPI()
