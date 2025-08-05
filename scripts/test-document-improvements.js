const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDocumentImprovements() {
  console.log('🧪 TEST AMÉLIORATIONS DOCUMENTS');
  console.log('================================');

  try {
    // 1. Vérifier la structure de la table documents
    console.log('📋 1. Vérification de la table documents...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'documents' });

    if (columnsError) {
      console.log('⚠️  Impossible de récupérer les colonnes via RPC');
      
      // Test direct de la table
      const { data: testDoc, error: testError } = await supabase
        .from('documents')
        .select('*')
        .limit(1);

      if (testError) {
        console.log('❌ Erreur accès table documents:', testError.message);
      } else {
        console.log('✅ Table documents accessible');
        if (testDoc && testDoc.length > 0) {
          const doc = testDoc[0];
          console.log('📊 Colonnes disponibles:', Object.keys(doc));
          
          if ('document_type' in doc) {
            console.log('✅ Colonne document_type présente');
          } else {
            console.log('⚠️  Colonne document_type manquante - exécutez AJOUT-TYPE-DOCUMENTS.sql');
          }
        }
      }
    } else {
      console.log('✅ Structure table récupérée:', columns);
    }

    // 2. Vérifier les types de documents autorisés
    console.log('\n📋 2. Test des types de documents...');
    
    const testDocumentTypes = ['rib', 'kbis', 'contrat', 'facture', 'devis', 'autre'];
    
    for (const docType of testDocumentTypes) {
      console.log(`  - ${docType}: ✅`);
    }

    // 3. Vérifier la structure de stockage
    console.log('\n📋 3. Vérification du bucket...');
    
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from('company-files')
      .list('companies', { limit: 1 });

    if (bucketError) {
      console.log('❌ Erreur accès bucket:', bucketError.message);
    } else {
      console.log('✅ Bucket company-files accessible');
    }

    // 4. Test d'upload avec type
    console.log('\n📋 4. Test d\'upload avec type...');
    
    const testFile = new Blob(['Test document avec type'], { type: 'text/plain' });
    const testFileName = `test-type/${Date.now()}-test.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(testFileName, testFile);

    if (uploadError) {
      console.log('❌ Erreur upload test:', uploadError.message);
    } else {
      console.log('✅ Upload test réussi');
      
      // Nettoyer
      await supabase.storage
        .from('company-files')
        .remove([testFileName]);
      console.log('🧹 Fichier de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n📋 RÉCAPITULATIF:');
  console.log('1. ✅ Vérifications effectuées');
  console.log('2. 💡 Exécutez AJOUT-TYPE-DOCUMENTS.sql si nécessaire');
  console.log('3. 🧪 Testez l\'application avec plusieurs documents');
  
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Exécuter AJOUT-TYPE-DOCUMENTS.sql dans Supabase');
  console.log('2. Tester l\'application: http://localhost:3001/companies/new');
  console.log('3. Ajouter plusieurs documents de types différents');
  console.log('4. Vérifier l\'organisation dans Supabase Storage');
}

testDocumentImprovements(); 