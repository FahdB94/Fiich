const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://eiawccnqfmvdnvjlyftx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjc3MjEsImV4cCI6MjA2OTc0MzcyMX0.xuO2IPGcw5MoFSisEEQBOUd7qtR69eVZ8lSHfw-jWrQ';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAuthTokens() {
    console.log('🧹 NETTOYAGE DES TOKENS D\'AUTHENTIFICATION');
    console.log('==========================================');
    
    try {
        // 1. Se déconnecter de Supabase
        console.log('\n1️⃣ Déconnexion de Supabase...');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.log('⚠️  Erreur lors de la déconnexion:', error.message);
        } else {
            console.log('✅ Déconnexion réussie');
        }
        
        // 2. Nettoyer le localStorage (si accessible)
        console.log('\n2️⃣ Nettoyage du localStorage...');
        try {
            // Cette partie ne fonctionnera que dans un navigateur
            if (typeof window !== 'undefined' && window.localStorage) {
                const keysToRemove = [
                    'sb-eiawccnqfmvdnvjlyftx-auth-token',
                    'supabase.auth.token',
                    'supabase.auth.refreshToken',
                    'supabase.auth.expiresAt',
                    'supabase.auth.expiresIn',
                    'supabase.auth.accessToken',
                    'supabase.auth.refreshToken',
                    'supabase.auth.user',
                    'supabase.auth.session'
                ];
                
                keysToRemove.forEach(key => {
                    if (localStorage.getItem(key)) {
                        localStorage.removeItem(key);
                        console.log(`   ✅ Supprimé: ${key}`);
                    }
                });
                
                console.log('✅ localStorage nettoyé');
            } else {
                console.log('ℹ️  localStorage non accessible (exécution côté serveur)');
            }
        } catch (err) {
            console.log('⚠️  Erreur lors du nettoyage localStorage:', err.message);
        }
        
        // 3. Instructions pour l'utilisateur
        console.log('\n3️⃣ Instructions pour nettoyer manuellement...');
        console.log('📋 Étapes à suivre dans votre navigateur:');
        console.log('');
        console.log('1. Ouvrez les outils de développement (F12)');
        console.log('2. Allez dans l\'onglet "Application" (Chrome) ou "Stockage" (Firefox)');
        console.log('3. Dans "Local Storage" > "http://localhost:3000"');
        console.log('4. Supprimez toutes les clés commençant par:');
        console.log('   - sb-eiawccnqfmvdnvjlyftx-auth-token');
        console.log('   - supabase.auth.*');
        console.log('');
        console.log('5. Ou plus simplement, ouvrez la console et tapez:');
        console.log('   localStorage.clear()');
        console.log('');
        console.log('6. Rechargez la page (F5)');
        
        // 4. Test de connexion après nettoyage
        console.log('\n4️⃣ Test de connexion après nettoyage...');
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Erreur de connexion:', testError.message);
        } else {
            console.log('✅ Connexion à Supabase réussie');
        }
        
        console.log('\n🎉 NETTOYAGE TERMINÉ !');
        console.log('======================');
        console.log('');
        console.log('📋 PROCHAINES ÉTAPES:');
        console.log('1. Nettoyez manuellement le localStorage (voir instructions ci-dessus)');
        console.log('2. Rechargez la page http://localhost:3000');
        console.log('3. Créez un nouveau compte ou connectez-vous');
        console.log('4. Testez les fonctionnalités de l\'application');
        
    } catch (error) {
        console.error('❌ ERREUR FATALE:', error.message);
        console.log('\n💡 SOLUTION MANUELLE:');
        console.log('1. Ouvrez les outils de développement (F12)');
        console.log('2. Console > localStorage.clear()');
        console.log('3. Rechargez la page');
    }
}

// Exécuter le nettoyage
clearAuthTokens(); 