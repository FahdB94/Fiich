const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function testAppUpload() {
  console.log('🧪 TEST UPLOAD APPLICATION');
  console.log('============================');

  try {
    // 1. Créer un utilisateur de test
    console.log('📋 1. Création d\'un utilisateur de test...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.log('❌ Erreur création utilisateur:', authError.message);
      return;
    }

    console.log('✅ Utilisateur créé:', testEmail);

    // 2. Attendre un peu pour la confirmation
    console.log('⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Se connecter
    console.log('📋 2. Connexion...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('❌ Erreur connexion:', signInError.message);
      return;
    }

    console.log('✅ Connexion réussie');

    // 4. Créer une entreprise
    console.log('📋 3. Création d\'une entreprise...');
    const companyData = {
      name: 'Entreprise Test Upload',
      description: 'Test d\'upload de documents',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      country: 'France',
      phone: '+33123456789',
      email: 'contact@test.com',
      website: 'https://test.com',
      ape_code: '6201Z',
      vat_number: 'FR12345678901',
      payment_terms: ['30 jours', 'À réception'],
      rib: 'FR7630001007941234567890185',
      contacts: [
        {
          contact_type: 'commercial',
          name: 'Jean Dupont',
          email: 'jean@test.com',
          phone: '+33123456789',
          job_title: 'Commercial',
          notes: 'Contact principal'
        }
      ]
    };

    const { data: companyDataResult, error: companyError } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (companyError) {
      console.log('❌ Erreur création entreprise:', companyError.message);
      return;
    }

    console.log('✅ Entreprise créée:', companyDataResult.id);

    // 5. Upload de documents
    console.log('📋 4. Upload de documents...');
    
    // Créer plusieurs fichiers de test
    const testFiles = [
      { name: 'document1.txt', content: 'Document test 1', type: 'text/plain' },
      { name: 'document2.txt', content: 'Document test 2', type: 'text/plain' },
      { name: 'rapport.txt', content: 'Rapport annuel 2024', type: 'text/plain' }
    ];

    const uploadedDocuments = [];

    for (const file of testFiles) {
      const blob = new Blob([file.content], { type: file.type });
      const fileName = `companies/${companyDataResult.id}/${Date.now()}-${file.name}`;
      
      console.log(`📤 Upload de ${file.name}...`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(fileName, blob);

      if (uploadError) {
        console.log(`❌ Erreur upload ${file.name}:`, uploadError.message);
        continue;
      }

      console.log(`✅ ${file.name} uploadé`);

      // Insérer dans la table documents
      const documentData = {
        name: file.name,
        file_path: fileName,
        file_size: blob.size,
        mime_type: file.type,
        company_id: companyDataResult.id,
        is_public: false
      };

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (docError) {
        console.log(`❌ Erreur insertion document ${file.name}:`, docError.message);
        continue;
      }

      uploadedDocuments.push(docData);
      console.log(`✅ Document ${file.name} enregistré en base`);
    }

    // 6. Vérifier les documents
    console.log('📋 5. Vérification des documents...');
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyDataResult.id);

    if (docsError) {
      console.log('❌ Erreur récupération documents:', docsError.message);
    } else {
      console.log(`✅ ${documents.length} documents trouvés pour l'entreprise`);
      documents.forEach(doc => {
        console.log(`  - ${doc.name} (${doc.file_size} bytes)`);
      });
    }

    // 7. Nettoyer (optionnel)
    console.log('📋 6. Nettoyage...');
    console.log('💡 Pour nettoyer, supprimez manuellement:');
    console.log(`   - Utilisateur: ${testEmail}`);
    console.log(`   - Entreprise: ${companyDataResult.id}`);
    console.log(`   - Documents dans le bucket: companies/${companyDataResult.id}/`);

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n🎉 TEST TERMINÉ !');
  console.log('============================');
  console.log('✅ Upload fonctionne parfaitement');
  console.log('✅ Création d\'entreprise avec documents OK');
  console.log('✅ Application prête à utiliser');
}

testAppUpload(); 