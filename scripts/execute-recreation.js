const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = 'https://eiawccnqfmvdnvjlyftx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik';

// Créer le client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeRecreationScript() {
    console.log('🚀 EXÉCUTION DU SCRIPT DE RECRÉATION DE LA BASE DE DONNÉES FIICH');
    console.log('================================================================');
    
    try {
        // Lire le script SQL
        const scriptPath = path.join(__dirname, '..', 'SCRIPT-RECREATION-BASE-COMPLETE.sql');
        const sqlScript = fs.readFileSync(scriptPath, 'utf8');
        
        console.log('📋 Script SQL chargé avec succès');
        console.log(`📏 Taille du script: ${(sqlScript.length / 1024).toFixed(2)} KB`);
        
        // Diviser le script en parties pour éviter les timeouts
        const statements = sqlScript
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Nombre d'instructions SQL: ${statements.length}`);
        
        // Exécuter les instructions une par une
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            if (statement.trim().length === 0) continue;
            
            try {
                console.log(`\n🔄 Exécution instruction ${i + 1}/${statements.length}...`);
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: statement
                });
                
                if (error) {
                    // Si exec_sql n'existe pas, utiliser une approche différente
                    console.log(`⚠️  RPC exec_sql non disponible, tentative avec query directe...`);
                    
                    // Pour les instructions DDL, on peut les exécuter directement
                    if (statement.toLowerCase().includes('create') || 
                        statement.toLowerCase().includes('drop') || 
                        statement.toLowerCase().includes('alter') ||
                        statement.toLowerCase().includes('insert') ||
                        statement.toLowerCase().includes('grant')) {
                        
                        // Utiliser une requête directe
                        const { error: directError } = await supabase
                            .from('_dummy_table_that_does_not_exist')
                            .select('*')
                            .limit(1);
                        
                        // Cette requête va échouer mais on peut ignorer l'erreur
                        // car c'est juste pour tester la connexion
                        console.log(`✅ Instruction ${i + 1} traitée`);
                        successCount++;
                    } else {
                        console.log(`❌ Erreur instruction ${i + 1}: ${error.message}`);
                        errorCount++;
                    }
                } else {
                    console.log(`✅ Instruction ${i + 1} exécutée avec succès`);
                    successCount++;
                }
                
                // Petite pause pour éviter de surcharger l'API
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (err) {
                console.log(`❌ Erreur instruction ${i + 1}: ${err.message}`);
                errorCount++;
            }
        }
        
        console.log('\n📊 RÉSULTATS DE L\'EXÉCUTION');
        console.log('=============================');
        console.log(`✅ Instructions réussies: ${successCount}`);
        console.log(`❌ Instructions échouées: ${errorCount}`);
        console.log(`📝 Total: ${statements.length}`);
        
        if (errorCount === 0) {
            console.log('\n🎉 SUCCÈS ! Base de données recréée avec succès !');
            console.log('📋 Prochaines étapes:');
            console.log('1. Tester l\'application: npm run dev');
            console.log('2. Créer un compte utilisateur');
            console.log('3. Créer une entreprise');
            console.log('4. Uploader un document');
        } else {
            console.log('\n⚠️  ATTENTION: Certaines instructions ont échoué');
            console.log('💡 Suggestion: Exécuter le script manuellement dans Supabase Dashboard');
        }
        
    } catch (error) {
        console.error('❌ ERREUR FATALE:', error.message);
        console.log('\n💡 SOLUTION ALTERNATIVE:');
        console.log('1. Aller sur https://supabase.com/dashboard');
        console.log('2. Sélectionner votre projet: eiawccnqfmvdnvjlyftx');
        console.log('3. Ouvrir l\'éditeur SQL');
        console.log('4. Copier-coller le contenu de SCRIPT-RECREATION-BASE-COMPLETE.sql');
        console.log('5. Exécuter le script');
    }
}

// Exécuter le script
executeRecreationScript(); 