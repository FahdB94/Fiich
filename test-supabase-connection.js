// Script de test pour diagnostiquer les problèmes Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Test de connexion Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✅ Présente' : '❌ Manquante');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Test 1: Connexion de base...');
    
    // Test de connexion simple
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erreur de connexion:', error.message);
      
      if (error.message.includes('permission denied')) {
        console.log('\n🔧 SOLUTION: Exécutez le script SQL dans Supabase');
        console.log('1. Allez sur https://supabase.com');
        console.log('2. Ouvrez votre projet Fiich');
        console.log('3. Cliquez sur "SQL Editor"');
        console.log('4. Créez une nouvelle requête');
        console.log('5. Copiez-collez le script SQL fourni');
        console.log('6. Cliquez sur "Run"');
      }
    } else {
      console.log('✅ Connexion réussie');
    }
    
  } catch (err) {
    console.log('❌ Erreur:', err.message);
  }
}

async function testAuth() {
  try {
    console.log('\n🔐 Test 2: Authentification...');
    
    // Test d'authentification
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Erreur d\'authentification:', error.message);
    } else {
      console.log('✅ Authentification configurée');
      console.log('Session:', data.session ? '✅ Active' : '❌ Inactive');
    }
    
  } catch (err) {
    console.log('❌ Erreur d\'authentification:', err.message);
  }
}

async function testTables() {
  try {
    console.log('\n📋 Test 3: Tables de base...');
    
    // Test des tables principales
    const tables = ['users', 'companies', 'documents', 'invitations', 'company_shares'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}:`, error.message);
        } else {
          console.log(`✅ Table ${table}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}:`, err.message);
      }
    }
    
  } catch (err) {
    console.log('❌ Erreur test tables:', err.message);
  }
}

async function runTests() {
  await testConnection();
  await testAuth();
  await testTables();
  
  console.log('\n🎯 RÉCAPITULATIF:');
  console.log('Si vous voyez des erreurs "permission denied",');
  console.log('vous devez exécuter le script SQL dans Supabase.');
  console.log('\n📝 Script SQL disponible dans: CORRECTION-PERMISSIONS-SIMPLE.sql');
}

runTests();