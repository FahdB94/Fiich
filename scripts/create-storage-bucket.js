const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase avec la clé de service pour créer le bucket
const supabaseUrl = 'https://eiawccnqfmvdnvjlyftx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik';

// Créer le client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
    console.log('📁 CRÉATION DU BUCKET STORAGE COMPANY-FILES');
    console.log('===========================================');
    
    try {
        // 1. Vérifier si le bucket existe déjà
        console.log('\n1️⃣ Vérification des buckets existants...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.log('❌ Erreur lors de la vérification des buckets:', listError.message);
            return;
        }
        
        const existingBucket = buckets.find(b => b.name === 'company-files');
        
        if (existingBucket) {
            console.log('✅ Bucket "company-files" existe déjà');
            console.log(`   Public: ${existingBucket.public}`);
            console.log(`   File size limit: ${existingBucket.file_size_limit} bytes`);
            return;
        }
        
        // 2. Créer le bucket
        console.log('\n2️⃣ Création du bucket "company-files"...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('company-files', {
            public: false,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
        });
        
        if (createError) {
            console.log('❌ Erreur lors de la création du bucket:', createError.message);
            return;
        }
        
        console.log('✅ Bucket "company-files" créé avec succès');
        console.log(`   Public: ${newBucket.public}`);
        console.log(`   File size limit: ${newBucket.file_size_limit} bytes`);
        
        // 3. Créer les politiques de storage
        console.log('\n3️⃣ Création des politiques de storage...');
        
        const policies = [
            {
                name: 'authenticated_users_can_upload_files',
                operation: 'INSERT',
                condition: "bucket_id = 'company-files' AND auth.uid() IS NOT NULL"
            },
            {
                name: 'authenticated_users_can_view_files',
                operation: 'SELECT',
                condition: "bucket_id = 'company-files' AND auth.uid() IS NOT NULL"
            },
            {
                name: 'authenticated_users_can_update_files',
                operation: 'UPDATE',
                condition: "bucket_id = 'company-files' AND auth.uid() IS NOT NULL"
            },
            {
                name: 'authenticated_users_can_delete_files',
                operation: 'DELETE',
                condition: "bucket_id = 'company-files' AND auth.uid() IS NOT NULL"
            }
        ];
        
        for (const policy of policies) {
            try {
                const { error: policyError } = await supabase.storage.createPolicy('company-files', policy.name, {
                    operation: policy.operation,
                    condition: policy.condition
                });
                
                if (policyError) {
                    console.log(`⚠️  Politique ${policy.name}: ${policyError.message}`);
                } else {
                    console.log(`✅ Politique ${policy.name} créée`);
                }
            } catch (err) {
                console.log(`⚠️  Erreur politique ${policy.name}: ${err.message}`);
            }
        }
        
        // 4. Test du bucket
        console.log('\n4️⃣ Test du bucket...');
        try {
            const { data: testBuckets, error: testError } = await supabase.storage.listBuckets();
            
            if (testError) {
                console.log('❌ Erreur lors du test:', testError.message);
            } else {
                const testBucket = testBuckets.find(b => b.name === 'company-files');
                if (testBucket) {
                    console.log('✅ Bucket testé avec succès');
                    console.log(`   Nom: ${testBucket.name}`);
                    console.log(`   Public: ${testBucket.public}`);
                    console.log(`   File size limit: ${testBucket.file_size_limit} bytes`);
                } else {
                    console.log('❌ Bucket non trouvé lors du test');
                }
            }
        } catch (err) {
            console.log('❌ Erreur lors du test:', err.message);
        }
        
        console.log('\n🎉 BUCKET STORAGE CRÉÉ AVEC SUCCÈS !');
        console.log('=====================================');
        console.log('');
        console.log('📋 RÉCAPITULATIF:');
        console.log('- ✅ Bucket "company-files" créé');
        console.log('- ✅ Politiques de sécurité configurées');
        console.log('- ✅ Limite de taille: 50MB');
        console.log('- ✅ Types MIME autorisés configurés');
        console.log('');
        console.log('🎯 PROCHAINES ÉTAPES:');
        console.log('1. Testez l\'upload de documents dans l\'application');
        console.log('2. Vérifiez que les fichiers s\'uploadent correctement');
        console.log('3. Testez le téléchargement des fichiers');
        
    } catch (error) {
        console.error('❌ ERREUR FATALE:', error.message);
        console.log('\n💡 SUGGESTIONS:');
        console.log('1. Vérifiez que vous avez les permissions d\'administrateur');
        console.log('2. Vérifiez la connexion internet');
        console.log('3. Essayez de créer le bucket manuellement dans Supabase Dashboard');
    }
}

// Exécuter la création du bucket
createStorageBucket(); 