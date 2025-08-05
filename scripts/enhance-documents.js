import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Fonction pour extraire des informations utiles du nom de fichier
function extractDocumentInfo(filename) {
  if (!filename) return { title: 'Document', type: 'PDF', version: '' }
  
  // Exemple: 1753998811751-077822dc-Document_de_Synthese_J00129376059_v1.pdf
  const parts = filename.split('-')
  
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1] // Document_de_Synthese_J00129376059_v1.pdf
    const nameParts = lastPart.split('_')
    
    let title = 'Document'
    let type = 'PDF'
    let version = ''
    let reference = ''
    
    // Extraire le titre
    if (nameParts.length >= 3) {
      title = nameParts.slice(0, -2).join(' ').replace(/_/g, ' ')
    }
    
    // Extraire la référence (J00129376059)
    const refMatch = lastPart.match(/J\d+/)
    if (refMatch) {
      reference = refMatch[0]
    }
    
    // Extraire la version
    const versionMatch = lastPart.match(/v(\d+)/)
    if (versionMatch) {
      version = `v${versionMatch[1]}`
    }
    
    // Déterminer le type
    if (lastPart.includes('Synthese')) {
      type = 'Synthèse'
    } else if (lastPart.includes('Bilan')) {
      type = 'Bilan'
    } else if (lastPart.includes('Compte')) {
      type = 'Comptes'
    } else if (lastPart.includes('Declaration')) {
      type = 'Déclaration'
    }
    
    return {
      title,
      type,
      version,
      reference,
      fullName: filename
    }
  }
  
  return {
    title: filename.replace(/\.pdf$/i, ''),
    type: 'PDF',
    version: '',
    reference: '',
    fullName: filename
  }
}

async function enhanceDocuments() {
  console.log('🔧 Amélioration de l\'affichage des documents...')
  
  try {
    // Récupérer tous les documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
    
    if (error) {
      console.log(`❌ Erreur récupération documents: ${error.message}`)
      return
    }
    
    console.log(`📄 ${documents.length} documents trouvés`)
    
    for (const doc of documents) {
      const filename = doc.file_path?.split('/').pop() || doc.file_name
      const info = extractDocumentInfo(filename)
      
      console.log(`\n📋 Document: ${doc.id}`)
      console.log(`   Titre: ${info.title}`)
      console.log(`   Type: ${info.type}`)
      console.log(`   Version: ${info.version}`)
      console.log(`   Référence: ${info.reference}`)
      console.log(`   Fichier: ${info.fullName}`)
      
      // Mettre à jour le document avec les nouvelles informations
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          document_name: info.title,
          document_type: info.type,
          document_version: info.version,
          document_reference: info.reference,
          document_name: info.title, document_type: info.type, document_version: info.version, document_reference: info.reference
        })
        .eq('id', doc.id)
      
      if (updateError) {
        console.log(`❌ Erreur mise à jour ${doc.id}: ${updateError.message}`)
      } else {
        console.log(`✅ Document ${doc.id} mis à jour`)
      }
    }
    
    console.log('\n🎉 Amélioration terminée !')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

enhanceDocuments()
