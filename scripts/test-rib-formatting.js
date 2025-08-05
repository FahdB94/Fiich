// Test du formatage RIB
console.log('🧪 TEST FORMATAGE RIB');
console.log('======================');

// Fonction de formatage (copiée du composant)
function formatRIB(input) {
  const cleaned = input.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return cleaned.replace(/(.{4})/g, '$1 ').trim()
}

function cleanRIB(input) {
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

// Tests
const testCases = [
  'FR7630001007941234567890185',
  'FR76 3000 1007 9412 3456 7890 185',
  'fr7630001007941234567890185',
  'FR76-3000-1007-9412-3456-7890-185',
  'FR76.3000.1007.9412.3456.7890.185',
  'FR763000100794123456789018', // 26 caractères (trop court)
  'FR76300010079412345678901856', // 28 caractères (trop long)
]

console.log('📋 Tests de formatage :\n');

testCases.forEach((test, index) => {
  const cleaned = cleanRIB(test)
  const formatted = formatRIB(test)
  const isValid = cleaned.length === 27
  
  console.log(`Test ${index + 1}:`);
  console.log(`  Input:     "${test}"`);
  console.log(`  Nettoyé:   "${cleaned}" (${cleaned.length} caractères)`);
  console.log(`  Formaté:   "${formatted}"`);
  console.log(`  Valide:    ${isValid ? '✅' : '❌'}`);
  console.log('');
});

console.log('🎯 RÉSULTAT ATTENDU :');
console.log('- ✅ Formatage avec espaces tous les 4 caractères');
console.log('- ✅ Nettoyage automatique des caractères spéciaux');
console.log('- ✅ Conversion en majuscules');
console.log('- ✅ Validation de la longueur (27 caractères)');
console.log('- ✅ Affichage en police monospace pour une meilleure lisibilité'); 