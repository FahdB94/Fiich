const { randomBytes } = require('crypto')

/**
 * Génère un token sécurisé pour les partages d'entreprise
 */
function generateShareToken() {
  return randomBytes(32)
    .toString('base64')
    .replace(/[+\/]/g, '-')
    .replace(/=/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '')
}

/**
 * Génère un token sécurisé pour les invitations
 */
function generateInvitationToken() {
  return randomBytes(32)
    .toString('base64')
    .replace(/[+\/]/g, '-')
    .replace(/=/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '')
}

console.log('🧪 Test des fonctions de génération de tokens...\n')

try {
  console.log('1. Test generateShareToken:')
  const shareToken = generateShareToken()
  console.log(`   Token: ${shareToken}`)
  console.log(`   Longueur: ${shareToken.length}`)
  console.log(`   Caractères valides: ${/^[a-zA-Z0-9\-_]+$/.test(shareToken)}`)
  
  console.log('\n2. Test generateInvitationToken:')
  const invitationToken = generateInvitationToken()
  console.log(`   Token: ${invitationToken}`)
  console.log(`   Longueur: ${invitationToken.length}`)
  console.log(`   Caractères valides: ${/^[a-zA-Z0-9\-_]+$/.test(invitationToken)}`)
  
  console.log('\n3. Test de plusieurs tokens:')
  for (let i = 0; i < 3; i++) {
    const token = generateShareToken()
    console.log(`   Token ${i + 1}: ${token}`)
  }
  
  console.log('\n✅ Tous les tests réussis !')
  
} catch (error) {
  console.error('❌ Erreur:', error)
} 