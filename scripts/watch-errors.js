const fs = require('fs')
const path = require('path')

// Fonction pour surveiller les erreurs de syntaxe courantes
function checkForCommonErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const errors = []
    
    // Vérifier les apostrophes non échappées
    const apostropheRegex = /console\.log\(['"][^'"]*'[^'"]*['"][^)]*\)/g
    let match
    while ((match = apostropheRegex.exec(content)) !== null) {
      if (match[0].includes("d'ouverture") || match[0].includes("d'erreur")) {
        errors.push({
          line: content.substring(0, match.index).split('\n').length,
          type: 'Apostrophe non échappée',
          message: 'Apostrophe dans une chaîne de caractères non échappée',
          fix: 'Remplacer par d\\\'ouverture ou d\\\'erreur'
        })
      }
    }
    
    // Vérifier les conflits de noms document
    const documentConflictRegex = /const.*=.*async.*\(document:.*Document\)/g
    while ((match = documentConflictRegex.exec(content)) !== null) {
      errors.push({
        line: content.substring(0, match.index).split('\n').length,
        type: 'Conflit de noms',
        message: 'Paramètre "document" en conflit avec l\'objet global',
        fix: 'Renommer le paramètre en "doc"'
      })
    }
    
    return errors
  } catch (error) {
    return [{
      line: 0,
      type: 'Erreur de lecture',
      message: error.message,
      fix: 'Vérifier que le fichier existe'
    }]
  }
}

// Fonction pour corriger automatiquement les erreurs courantes
function autoFixErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let fixed = false
    
    // Corriger les apostrophes non échappées
    if (content.includes("d'ouverture")) {
      content = content.replace(/d'ouverture/g, "d\\'ouverture")
      fixed = true
    }
    
    if (content.includes("d'erreur")) {
      content = content.replace(/d'erreur/g, "d\\'erreur")
      fixed = true
    }
    
    // Corriger les conflits de noms document
    if (content.includes('const handleView = async (document: Document)')) {
      content = content.replace(/const handleView = async \(document: Document\)/g, 'const handleView = async (doc: Document)')
      content = content.replace(/document\.file_path/g, 'doc.file_path')
      fixed = true
    }
    
    if (content.includes('const handleDownload = async (document: Document)')) {
      content = content.replace(/const handleDownload = async \(document: Document\)/g, 'const handleDownload = async (doc: Document)')
      content = content.replace(/document\.file_path/g, 'doc.file_path')
      fixed = true
    }
    
    if (fixed) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Erreurs corrigées automatiquement dans ${filePath}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Erreur lors de la correction: ${error.message}`)
    return false
  }
}

// Fonction principale
function watchFile(filePath) {
  console.log(`🔍 Surveillance de ${filePath}`)
  
  const errors = checkForCommonErrors(filePath)
  
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} erreur(s) détectée(s):`)
    errors.forEach((error, index) => {
      console.log(`\n${index + 1}. Ligne ${error.line}: ${error.type}`)
      console.log(`   Message: ${error.message}`)
      console.log(`   Correction: ${error.fix}`)
    })
    
    console.log('\n🔧 Tentative de correction automatique...')
    const fixed = autoFixErrors(filePath)
    
    if (fixed) {
      console.log('✅ Corrections appliquées avec succès')
    } else {
      console.log('❌ Impossible de corriger automatiquement')
    }
  } else {
    console.log('✅ Aucune erreur détectée')
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const targetFile = process.argv[2] || 'src/components/documents/enhanced-document-manager.tsx'
  watchFile(targetFile)
}

module.exports = { checkForCommonErrors, autoFixErrors, watchFile }
