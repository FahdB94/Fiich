const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function deleteOrphanedDocument() {
  console.log('🗑️ Suppression du document orphelin...')
  
  try {
    const documentId = '11ba7754-3476-49c6-b85d-c695daafee95'
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
    
    if (error) {
      console.error('❌ Erreur suppression:', error)
      return
    }
    
    console.log('✅ Document supprimé avec succès')
    console.log('💡 L\'utilisateur peut maintenant re-uploader le document')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

deleteOrphanedDocument()
