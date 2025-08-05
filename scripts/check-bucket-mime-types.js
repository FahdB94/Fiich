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

async function checkBucketMimeTypes() {
  console.log('🔍 VÉRIFICATION CONFIGURATION BUCKET');
  console.log('====================================');

  try {
    // 1. Vérifier la configuration du bucket
    console.log('📋 1. Configuration du bucket...');
    
    // Utiliser une requête SQL directe pour vérifier la configuration
    const { data: bucketConfig, error: bucketError } = await supabase
      .rpc('get_bucket_config', { bucket_name: 'company-files' });

    if (bucketError) {
      console.log('⚠️  Impossible de récupérer la config via RPC, utilisation d\'une approche alternative');
      
      // Test d'upload avec différents types MIME
      const testFiles = [
        { name: 'test.txt', content: 'Test texte', type: 'text/plain' },
        { name: 'test.pdf', content: '%PDF-1.4\nTest PDF', type: 'application/pdf' },
        { name: 'test.docx', content: 'PK\x03\x04', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { name: 'test.jpg', content: '\xFF\xD8\xFF', type: 'image/jpeg' }
      ];

      console.log('📋 2. Test d\'upload avec différents types MIME...');
      
      for (const file of testFiles) {
        const blob = new Blob([file.content], { type: file.type });
        const fileName = `test-mime/${Date.now()}-${file.name}`;
        
        console.log(`📤 Test ${file.name} (${file.type})...`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-files')
          .upload(fileName, blob, {
            contentType: file.type
          });

        if (uploadError) {
          console.log(`❌ ${file.name}: ${uploadError.message}`);
        } else {
          console.log(`✅ ${file.name}: Upload réussi`);
          
          // Nettoyer
          await supabase.storage
            .from('company-files')
            .remove([fileName]);
        }
      }
    } else {
      console.log('✅ Configuration bucket récupérée:', bucketConfig);
    }

    // 3. Vérifier les politiques RLS
    console.log('📋 3. Vérification des politiques RLS...');
    
    // Test avec un utilisateur authentifié
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'TestPassword123!'
    });

    if (authError) {
      console.log('⚠️  Impossible de se connecter pour tester les politiques');
    } else {
      console.log('✅ Utilisateur connecté pour test des politiques');
      
      // Test d'upload authentifié
      const testBlob = new Blob(['Test authentifié'], { type: 'text/plain' });
      const testFileName = `auth-test/${Date.now()}-test.txt`;
      
      const { data: authUploadData, error: authUploadError } = await supabase.storage
        .from('company-files')
        .upload(testFileName, testBlob);

      if (authUploadError) {
        console.log('❌ Erreur upload authentifié:', authUploadError.message);
      } else {
        console.log('✅ Upload authentifié réussi');
        
        // Nettoyer
        await supabase.storage
          .from('company-files')
          .remove([testFileName]);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n📋 RÉCAPITULATIF:');
  console.log('1. ✅ Tests MIME effectués');
  console.log('2. 💡 Si PDF échoue, vérifiez les types MIME autorisés');
  console.log('3. 🔧 Solution: Configurez le bucket en public temporairement');
  
  console.log('\n🎯 SOLUTION RAPIDE:');
  console.log('1. Supabase Dashboard > Storage > company-files');
  console.log('2. Settings > Activez "Public bucket"');
  console.log('3. Ou ajoutez les politiques RLS appropriées');
}

checkBucketMimeTypes(); 