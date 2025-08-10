#!/usr/bin/env node

// 🗄️ Serveur MCP PostgreSQL pour l'Application Fiich
// Ce serveur permet d'exécuter des requêtes SQL directement sur Supabase

const { Client } = require('pg')
const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js')

// Configuration PostgreSQL Supabase
const connectionString = 'postgresql://postgres.eiawccnqfmvdnvjlyftx:[aKivEEjsjxCEPTEl]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres'

// Définir les outils disponibles
const tools = [
  {
    name: 'execute_sql',
    description: 'Exécute une requête SQL sur la base de données Supabase',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'La requête SQL à exécuter'
        },
        description: {
          type: 'string',
          description: 'Description de ce que fait cette requête'
        }
      },
      required: ['query', 'description']
    }
  },
  {
    name: 'list_tables',
    description: 'Liste toutes les tables de la base de données',
    inputSchema: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          description: 'Le schéma à interroger (par défaut: public)',
          default: 'public'
        }
      }
    }
  },
  {
    name: 'describe_table',
    description: 'Décrit la structure d\'une table spécifique',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Le nom de la table à décrire'
        },
        schema: {
          type: 'string',
          description: 'Le schéma de la table (par défaut: public)',
          default: 'public'
        }
      },
      required: ['table_name']
    }
  },
  {
    name: 'check_rls_policies',
    description: 'Vérifie les politiques RLS sur une table',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Le nom de la table à vérifier'
        }
      },
      required: ['table_name']
    }
  },
  {
    name: 'cleanup_database',
    description: 'Nettoie complètement la base de données (SUPPRIME TOUT)',
    inputSchema: {
      type: 'object',
      properties: {
        confirmation: {
          type: 'string',
          description: 'Tapez "CONFIRM" pour confirmer la suppression'
        }
      },
      required: ['confirmation']
    }
  },
  {
    name: 'create_clean_schema',
    description: 'Crée le nouveau schéma propre de la base de données',
    inputSchema: {
      type: 'object',
      properties: {
        confirmation: {
          type: 'string',
          description: 'Tapez "CONFIRM" pour confirmer la création'
        }
      },
      required: ['confirmation']
    }
  },
  {
    name: 'activate_rls',
    description: 'Active la sécurité RLS sur toutes les tables',
    inputSchema: {
      type: 'object',
      properties: {
        confirmation: {
          type: 'string',
          description: 'Tapez "CONFIRM" pour confirmer l\'activation'
        }
      },
      required: ['confirmation']
    }
  }
]

// Créer le serveur MCP
const server = new Server({
  name: 'postgresql-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
})

// Fonction pour exécuter des requêtes SQL
async function execute_sql(args) {
  const { query, description } = args
  
  console.log(`🔍 Exécution de la requête: ${description}`)
  console.log(`📝 SQL: ${query}`)
  
  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    console.log('✅ Connexion à la base de données établie')
    
    const result = await client.query(query)
    console.log(`✅ Requête exécutée avec succès`)
    console.log(`📊 Résultats: ${result.rowCount} lignes affectées`)
    
    if (result.rows && result.rows.length > 0) {
      console.log('📋 Premières lignes:')
      console.log(JSON.stringify(result.rows.slice(0, 5), null, 2))
    }
    
    await client.end()
    
    return {
      success: true,
      rowCount: result.rowCount,
      rows: result.rows,
      message: `Requête exécutée avec succès: ${result.rowCount} lignes affectées`
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la requête:')
    console.error(error.message)
    
    if (client) {
      await client.end()
    }
    
    return {
      success: false,
      error: error.message,
      message: `Erreur: ${error.message}`
    }
  }
}

// Fonction pour lister les tables
async function list_tables(args) {
  const { schema = 'public' } = args
  
  const query = `
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables 
    WHERE table_schema = $1
    ORDER BY table_name
  `
  
  return await execute_sql({
    query,
    description: `Liste des tables du schéma ${schema}`
  })
}

// Fonction pour décrire une table
async function describe_table(args) {
  const { table_name, schema = 'public' } = args
  
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
  `
  
  return await execute_sql({
    query,
    description: `Structure de la table ${schema}.${table_name}`
  })
}

// Fonction pour vérifier les politiques RLS
async function check_rls_policies(args) {
  const { table_name } = args
  
  const query = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies 
    WHERE tablename = $1
  `
  
  return await execute_sql({
    query,
    description: `Politiques RLS pour la table ${table_name}`
  })
}

// Fonction pour nettoyer la base de données
async function cleanup_database(args) {
  const { confirmation } = args
  
  if (confirmation !== 'CONFIRM') {
    return {
      success: false,
      error: 'Confirmation requise',
      message: 'Vous devez taper "CONFIRM" pour confirmer la suppression complète de la base de données'
    }
  }
  
  const query = `
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      -- Désactiver les triggers
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE TRIGGER ALL';
      END LOOP;
      
      -- Supprimer toutes les tables
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
      
      -- Supprimer tous les types personnalisés
      FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
      
      -- Supprimer toutes les fonctions
      FOR r IN (SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
      END LOOP;
      
      -- Supprimer tous les schémas (sauf public)
      FOR r IN (SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('public', 'information_schema', 'pg_catalog')) LOOP
        EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(r.nspname) || ' CASCADE';
      END LOOP;
    END $$;
  `
  
  return await execute_sql({
    query,
    description: 'Nettoyage complet de la base de données'
  })
}

// Fonction pour créer le schéma propre
async function create_clean_schema(args) {
  const { confirmation } = args
  
  if (confirmation !== 'CONFIRM') {
    return {
      success: false,
      error: 'Confirmation requise',
      message: 'Vous devez taper "CONFIRM" pour confirmer la création du schéma'
    }
  }
  
  // Ici vous pouvez ajouter le script de création du schéma
  const query = `
    -- Création des tables de base
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
  
  return await execute_sql({
    query,
    description: 'Création du schéma propre de la base de données'
  })
}

// Fonction pour activer RLS
async function activate_rls(args) {
  const { confirmation } = args
  
  if (confirmation !== 'CONFIRM') {
    return {
      success: false,
      error: 'Confirmation requise',
      message: 'Vous devez taper "CONFIRM" pour confirmer l\'activation de RLS'
    }
  }
  
  const query = `
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
      END LOOP;
    END $$;
  `
  
  return await execute_sql({
    query,
    description: 'Activation de RLS sur toutes les tables'
  })
}

// Enregistrer les outils
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  
  console.log(`🛠️ Appel de l'outil: ${name}`)
  console.log(`📝 Arguments:`, args)
  
  try {
    let result
    
    switch (name) {
      case 'execute_sql':
        result = await execute_sql(args)
        break
      case 'list_tables':
        result = await list_tables(args)
        break
      case 'describe_table':
        result = await describe_table(args)
        break
      case 'check_rls_policies':
        result = await check_rls_policies(args)
        break
      case 'cleanup_database':
        result = await cleanup_database(args)
        break
      case 'create_clean_schema':
        result = await create_clean_schema(args)
        break
      case 'activate_rls':
        result = await activate_rls(args)
        break
      default:
        throw new Error(`Outil inconnu: ${name}`)
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de l'outil ${name}:`, error)
    
    return {
      content: [
        {
          type: 'text',
          text: `Erreur: ${error.message}`
        }
      ],
      isError: true
    }
  }
})

// Démarrer le serveur
async function main() {
  console.log('🚀 Démarrage du serveur MCP PostgreSQL...')
  
  // Test simple de connexion à la base de données
  console.log('🔍 Test de connexion à la base de données...')
  
  try {
    const client = new Client({ connectionString })
    await client.connect()
    console.log('✅ Connexion à la base de données établie avec succès !')
    
    // Test simple de requête
    const result = await client.query('SELECT version()')
    console.log('📊 Version PostgreSQL:', result.rows[0].version)
    
    await client.end()
    console.log('✅ Test de connexion réussi !')
    
    // Afficher les outils disponibles
    console.log('\n🛠️ Outils MCP disponibles:')
    tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`)
    })
    
    console.log('\n✅ Serveur MCP PostgreSQL prêt à l\'utilisation')
    
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:')
    console.error(error.message)
    process.exit(1)
  }
}

main().catch(console.error)
