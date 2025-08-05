const { spawn } = require('child_process')
const { watchFile } = require('./watch-errors.js')

console.log('🚀 Démarrage de la surveillance en temps réel...')
console.log('📁 Surveillance des erreurs de syntaxe courantes')
console.log('🔧 Correction automatique activée')
console.log('')

// Démarrer le serveur de développement
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe']
})

// Surveiller les erreurs de compilation
devProcess.stderr.on('data', (data) => {
  const output = data.toString()
  
  // Détecter les erreurs de syntaxe
  if (output.includes('Syntax Error') || output.includes('Expected')) {
    console.log('\n🔍 Erreur de syntaxe détectée!')
    
    // Extraire le nom du fichier de l'erreur
    const fileMatch = output.match(/\.\/src\/[^)]+\)/)
    if (fileMatch) {
      const filePath = fileMatch[0].replace(/^\.\//, '').replace(/\)$/, '')
      console.log(`📄 Fichier concerné: ${filePath}`)
      
      // Vérifier et corriger automatiquement
      watchFile(filePath)
    }
  }
  
  // Afficher les erreurs importantes
  if (output.includes('Error:') || output.includes('Failed to compile')) {
    console.log('\n❌ Erreur détectée:')
    console.log(output)
  }
})

// Surveiller les fichiers TypeScript/JavaScript pour les changements
const fs = require('fs')
const path = require('path')

function watchDirectory(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
    const fullPath = path.join(dir, file.name)
    
    if (file.isDirectory()) {
      watchDirectory(fullPath)
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      fs.watchFile(fullPath, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          console.log(`\n📝 Fichier modifié: ${fullPath}`)
          watchFile(fullPath)
        }
      })
    }
  })
}

// Démarrer la surveillance des fichiers
setTimeout(() => {
  console.log('👀 Surveillance des fichiers activée...')
  watchDirectory('src')
}, 2000)

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt de la surveillance...')
  devProcess.kill()
  process.exit(0)
})

console.log('✅ Surveillance active - Appuyez sur Ctrl+C pour arrêter')
