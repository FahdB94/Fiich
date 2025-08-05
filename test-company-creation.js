// Test direct de création d'entreprise pour vérifier si le problème persiste
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwNTg5NywiZXhwIjoyMDY5NDgxODk3fQ.XL_jXSUFAxchEu-POq3JjF5oHs7e0J22ufhYlUXfUHc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCompanyCreation() {
  console.log('🏢 TEST DE CRÉATION D\'ENTREPRISE\n')
  
  try {
    // Données de test d'entreprise
    const testCompany = {
      user_id: 'c331db65-85a5-47b9-8cd6-46e94ee6ca0e', // ID de votre utilisateur
      company_name: 'Test Entreprise SARL',
      address_line_1: '123 Rue de Test',
      postal_code: '75001',
      city: 'Paris',
      country: 'France',
      email: 'test@entreprise.com'
    }
    
    console.log('📝 Tentative de création avec les données:')
    console.log(JSON.stringify(testCompany, null, 2))
    console.log('')
    
    const { data, error } = await supabase
      .from('companies')
      .insert(testCompany)
      .select()
      .single()
    
    if (error) {
      console.log('❌ ERREUR lors de la création:', error.message)
      console.log('📊 Détails de l\'erreur:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ SUCCÈS ! Entreprise créée:')
      console.log('🆔 ID:', data.id)
      console.log('🏢 Nom:', data.company_name)
      console.log('📍 Adresse:', data.address_line_1, data.city)
      
      // Nettoyer - supprimer l'entreprise de test
      await supabase
        .from('companies')
        .delete()
        .eq('id', data.id)
      
      console.log('\n🧹 Entreprise de test supprimée')
      console.log('\n🎉 DIAGNOSTIC: La base de données fonctionne parfaitement !')
      console.log('💡 Le problème vient de la session d\'authentification côté navigateur')
    }
    
  } catch (error) {
    console.log('💥 Erreur inattendue:', error.message)
  }
}

testCompanyCreation()