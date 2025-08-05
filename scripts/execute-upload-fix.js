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

async function executeUploadFix() {
  console.log('🔧 CORRECTION UPLOAD SUPABASE');
  console.log('==============================');

  try {
    // 1. Vérifier que le bucket existe
    console.log('📋 1. Vérification du bucket...');
    const { data: bucketData, error: bucketError } = await supabase
      .from('storage.buckets')
      .select('*')
      .eq('name', 'company-files')
      .single();

    if (bucketError && bucketError.code !== 'PGRST116') {
      console.log('❌ Erreur lors de la vérification du bucket:', bucketError.message);
    } else if (bucketData) {
      console.log('✅ Bucket "company-files" existe déjà');
    } else {
      console.log('📦 Création du bucket "company-files"...');
      // Note: La création de bucket via API est limitée, on va utiliser SQL
    }

    // 2. Vérifier la table documents
    console.log('📋 2. Vérification de la table documents...');
    const { data: tableData, error: tableError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Erreur table documents:', tableError.message);
    } else {
      console.log('✅ Table documents accessible');
    }

    // 3. Exécuter le script SQL complet
    console.log('📋 3. Exécution du script SQL...');
    
    const sqlScript = `
      -- Créer le bucket s'il n'existe pas
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        gen_random_uuid(),
        'company-files',
        false,
        52428800,
        ARRAY[
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp'
        ]
      )
      ON CONFLICT (name) DO NOTHING;

      -- Désactiver RLS sur documents
      ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

      -- Donner les permissions
      GRANT ALL ON documents TO authenticated;
      GRANT ALL ON documents TO anon;

      -- Créer l'index
      CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
    `;

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (sqlError) {
      console.log('⚠️  Erreur SQL (normal si exec_sql n\'existe pas):', sqlError.message);
      console.log('📝 Le script doit être exécuté manuellement dans Supabase Dashboard');
    } else {
      console.log('✅ Script SQL exécuté avec succès');
    }

    // 4. Test d'upload simple
    console.log('📋 4. Test d\'upload...');
    const testFile = new Blob(['Test upload'], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(`test/${fileName}`, testFile);

    if (uploadError) {
      console.log('❌ Erreur upload:', uploadError.message);
      console.log('💡 Solution: Configurez le bucket en public ou ajoutez des politiques RLS');
    } else {
      console.log('✅ Upload réussi!');
      
      // Nettoyer le fichier de test
      await supabase.storage
        .from('company-files')
        .remove([`test/${fileName}`]);
      console.log('🧹 Fichier de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n📋 RÉCAPITULATIF:');
  console.log('1. ✅ Vérifications effectuées');
  console.log('2. ⚠️  Script SQL à exécuter manuellement');
  console.log('3. 💡 Configuration bucket nécessaire');
  
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Allez sur Supabase Dashboard > SQL Editor');
  console.log('2. Exécutez le contenu de CORRECTION-UPLOAD-SIMPLE.sql');
  console.log('3. Configurez le bucket en public temporairement');
  console.log('4. Testez l\'upload dans l\'application');
}

executeUploadFix(); 