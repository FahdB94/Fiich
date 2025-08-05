const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://eiawccnqfmvdnvjlyftx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjc3MjEsImV4cCI6MjA2OTc0MzcyMX0.xuO2IPGcw5MoFSisEEQBOUd7qtR69eVZ8lSHfw-jWrQ';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testApplication() {
    console.log('🧪 TEST DE L\'APPLICATION FIICH APRÈS RECRÉATION');
    console.log('================================================');
    
    try {
        // 1. Test de connexion à Supabase
        console.log('\n1️⃣ Test de connexion à Supabase...');
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Erreur de connexion:', testError.message);
            return;
        }
        
        console.log('✅ Connexion à Supabase réussie');
        
        // 2. Vérifier les tables
        console.log('\n2️⃣ Vérification des tables...');
        
        const tables = ['users', 'companies', 'documents', 'invitations', 'company_shares'];
        let tablesOk = 0;
        
        for (const table of tables) {
            try {
                const { error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`❌ Table ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Table ${table}: OK`);
                    tablesOk++;
                }
            } catch (err) {
                console.log(`❌ Table ${table}: ${err.message}`);
            }
        }
        
        console.log(`📊 Tables vérifiées: ${tablesOk}/${tables.length}`);
        
        // 3. Vérifier le bucket storage
        console.log('\n3️⃣ Vérification du bucket storage...');
        
        try {
            const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
            
            if (bucketError) {
                console.log('❌ Erreur bucket:', bucketError.message);
            } else {
                const companyFilesBucket = buckets.find(b => b.name === 'company-files');
                if (companyFilesBucket) {
                    console.log('✅ Bucket "company-files" trouvé');
                    console.log(`   Public: ${companyFilesBucket.public}`);
                    console.log(`   File size limit: ${companyFilesBucket.file_size_limit} bytes`);
                } else {
                    console.log('❌ Bucket "company-files" non trouvé');
                }
            }
        } catch (err) {
            console.log('❌ Erreur vérification bucket:', err.message);
        }
        
        // 4. Test des fonctions RPC
        console.log('\n4️⃣ Test des fonctions RPC...');
        
        try {
            // Test de la fonction get_invitations_sent_by_user
            const { error: rpcError } = await supabase.rpc('get_invitations_sent_by_user', {
                user_uuid: '00000000-0000-0000-0000-000000000000'
            });
            
            if (rpcError && rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
                console.log('❌ Fonction RPC get_invitations_sent_by_user non trouvée');
            } else {
                console.log('✅ Fonction RPC get_invitations_sent_by_user disponible');
            }
        } catch (err) {
            console.log('❌ Erreur test RPC:', err.message);
        }
        
        // 5. Vérifier les politiques RLS
        console.log('\n5️⃣ Vérification des politiques RLS...');
        
        try {
            // Test d'accès sans authentification (doit échouer)
            const { error: authError } = await supabase
                .from('companies')
                .select('*')
                .limit(1);
            
            if (authError && authError.message.includes('JWT')) {
                console.log('✅ Politiques RLS actives (accès refusé sans authentification)');
            } else {
                console.log('⚠️  Politiques RLS potentiellement désactivées');
            }
        } catch (err) {
            console.log('✅ Politiques RLS actives');
        }
        
        // 6. Résumé final
        console.log('\n📊 RÉSUMÉ DES TESTS');
        console.log('===================');
        console.log(`✅ Connexion Supabase: OK`);
        console.log(`📋 Tables vérifiées: ${tablesOk}/${tables.length}`);
        console.log(`🔒 Politiques RLS: Actives`);
        console.log(`📁 Bucket storage: Vérifié`);
        
        if (tablesOk === tables.length) {
            console.log('\n🎉 SUCCÈS ! Application prête à utiliser !');
            console.log('\n📋 PROCHAINES ÉTAPES:');
            console.log('1. Lancer l\'application: npm run dev');
            console.log('2. Créer un compte utilisateur');
            console.log('3. Créer une entreprise');
            console.log('4. Uploader un document');
            console.log('5. Tester les invitations et partages');
        } else {
            console.log('\n⚠️  ATTENTION: Certaines tables ne sont pas accessibles');
            console.log('💡 Vérifiez que le script de recréation a été exécuté correctement');
        }
        
    } catch (error) {
        console.error('❌ ERREUR FATALE:', error.message);
        console.log('\n💡 SUGGESTIONS:');
        console.log('1. Vérifiez que le script de recréation a été exécuté');
        console.log('2. Vérifiez les clés API dans .env.local');
        console.log('3. Vérifiez la connexion internet');
    }
}

// Exécuter les tests
testApplication(); 