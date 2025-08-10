#!/usr/bin/env node

// 🗄️ Serveur MCP Supabase Simplifié pour l'Application Fiich
// Ce serveur utilise le client Supabase existant de l'application

const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = 'https://eiawccnqfmvdnvjlyftx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik'

// Initialiser le client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Fonction pour exécuter des requêtes SQL
async function execute_sql(query, description) {
  console.log(`🔍 Exécution de la requête: ${description}`)
  console.log(`📝 SQL: ${query}`)
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query })
    
    if (error) {
      console.error('❌ Erreur lors de l\'exécution de la requête:')
      console.error(error.message)
      return {
        success: false,
        error: error.message,
        message: `Erreur: ${error.message}`
      }
    }
    
    console.log(`✅ Requête exécutée avec succès`)
    console.log(`📊 Résultats:`, data)
    
    return {
      success: true,
      data: data,
      message: `Requête exécutée avec succès`
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la requête:')
    console.error(error.message)
    
    return {
      success: false,
      error: error.message,
      message: `Erreur: ${error.message}`
    }
  }
}

// Fonction pour lister les tables
async function list_tables(schema = 'public') {
  const query = `
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables 
    WHERE table_schema = $1
    ORDER BY table_name
  `
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', schema)
      .order('table_name')
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des tables:')
      console.error(error.message)
      return {
        success: false,
        error: error.message,
        message: `Erreur: ${error.message}`
      }
    }
    
    console.log(`✅ Tables récupérées avec succès`)
    console.log(`📊 Nombre de tables: ${data.length}`)
    
    return {
      success: true,
      tables: data,
      count: data.length,
      message: `${data.length} tables trouvées dans le schéma ${schema}`
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tables:')
    console.error(error.message)
    
    return {
      success: false,
      error: error.message,
      message: `Erreur: ${error.message}`
    }
  }
}

// Fonction pour décrire une table
async function describe_table(table_name, schema = 'public') {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_schema', schema)
      .eq('table_name', table_name)
      .order('ordinal_position')
    
    if (error) {
      console.error('❌ Erreur lors de la description de la table:')
      console.error(error.message)
      return {
        success: false,
        error: error.message,
        message: `Erreur: ${error.message}`
      }
    }
    
    console.log(`✅ Structure de la table ${schema}.${table_name} récupérée`)
    console.log(`📊 Nombre de colonnes: ${data.length}`)
    
    return {
      success: true,
      table: `${schema}.${table_name}`,
      columns: data,
      count: data.length,
      message: `${data.length} colonnes trouvées dans la table ${schema}.${table_name}`
    }
  } catch (error) {
    console.error('❌ Erreur lors de la description de la table:')
    console.error(error.message)
    
    return {
      success: false,
      error: error.message,
      message: `Erreur: ${error.message}`
    }
  }
}

// Fonction pour vérifier les politiques RLS
async function check_rls_policies(table_name) {
  try {
    // Utiliser une requête SQL directe via RPC si disponible
    const { data, error } = await supabase.rpc('get_rls_policies', { table_name: table_name })
    
    if (error) {
      // Fallback: essayer de récupérer les informations de base
      console.log('⚠️ RPC get_rls_policies non disponible, tentative de fallback...')
      
      // Vérifier si RLS est activé sur la table
      const { data: tableInfo, error: tableError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('tablename', table_name)
        .eq('schemaname', 'public')
        .single()
      
      if (tableError) {
        return {
          success: false,
          error: tableError.message,
          message: `Erreur lors de la vérification RLS: ${tableError.message}`
        }
      }
      
      return {
        success: true,
        table: table_name,
        rls_enabled: tableInfo.rowsecurity,
        message: `RLS ${tableInfo.rowsecurity ? 'activé' : 'désactivé'} sur la table ${table_name}`
      }
    }
    
    return {
      success: true,
      table: table_name,
      policies: data,
      count: data.length,
      message: `${data.length} politiques RLS trouvées pour la table ${table_name}`
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des politiques RLS:')
    console.error(error.message)
    
    return {
      success: false,
      error: error.message,
      message: `Erreur: ${error.message}`
    }
  }
}

// Fonction pour tester la connexion
async function test_connection() {
  console.log('🔍 Test de connexion à Supabase...')
  
  try {
    // Test simple: récupérer la version de la base de données
    const { data, error } = await supabase.rpc('version')
    
    if (error) {
      // Fallback: essayer de récupérer des informations de base
      console.log('⚠️ RPC version non disponible, tentative de fallback...')
      
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1)
      
      if (tablesError) {
        throw new Error(`Impossible de se connecter à la base de données: ${tablesError.message}`)
      }
      
      console.log('✅ Connexion à Supabase établie avec succès !')
      console.log(`📊 Nombre de tables dans le schéma public: ${tables.length}`)
      
      return {
        success: true,
        message: 'Connexion à Supabase établie avec succès',
        tables_count: tables.length
      }
    }
    
    console.log('✅ Connexion à Supabase établie avec succès !')
    console.log(`📊 Version: ${data}`)
    
    return {
      success: true,
      message: 'Connexion à Supabase établie avec succès',
      version: data
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion à Supabase:')
    console.error(error.message)
    
    return {
      success: false,
      error: error.message,
      message: `Erreur de connexion: ${error.message}`
    }
  }
}

// Fonction principale de test
async function main() {
  console.log('🚀 Démarrage du serveur MCP Supabase simplifié...')
  
  // Test de connexion
  const connectionTest = await test_connection()
  
  if (!connectionTest.success) {
    console.error('❌ Échec de la connexion à Supabase')
    process.exit(1)
  }
  
  console.log('\n🛠️ Outils MCP disponibles:')
  console.log('  - execute_sql(query, description): Exécute une requête SQL')
  console.log('  - list_tables(schema): Liste les tables d\'un schéma')
  console.log('  - describe_table(table_name, schema): Décrit la structure d\'une table')
  console.log('  - check_rls_policies(table_name): Vérifie les politiques RLS')
  
  console.log('\n✅ Serveur MCP Supabase prêt à l\'utilisation')
  console.log('💡 Utilisez les fonctions exportées pour interagir avec la base de données')
}

// Exporter les fonctions pour utilisation externe
module.exports = {
  execute_sql,
  list_tables,
  describe_table,
  check_rls_policies,
  test_connection,
  supabase
}

// Démarrer si exécuté directement
if (require.main === module) {
  main().catch(console.error)
}

