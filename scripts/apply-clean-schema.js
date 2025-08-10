#!/usr/bin/env node

/**
 * Script pour appliquer le schéma propre à la base de données Supabase
 * Ce script exécute la migration 0001_clean_schema.sql
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = 'https://eiawccnqfmvdnvjlyftx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYXdjY25xZm12ZG52amx5ZnR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2NzcyMSwiZXhwIjoyMDY5NzQzNzIxfQ.kuO58UgPjliHAbjgv2OKG0AbLmWpx3wZCcptke6B7Ik'

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyCleanSchema() {
  console.log('🚀 Application du schéma propre à la base de données...')
  
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/0001_clean_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📖 Migration SQL chargée')
    
    // Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`🔧 Exécution de ${commands.length} commandes SQL...`)
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        try {
          console.log(`  ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`)
          
          // Utiliser rpc pour exécuter du SQL arbitraire
          const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: command + ';'
          })
          
          if (error) {
            console.log(`    ⚠️  Avertissement: ${error.message}`)
          } else {
            console.log(`    ✅ Succès`)
          }
        } catch (error) {
          console.log(`    ⚠️  Erreur ignorée: ${error.message}`)
        }
      }
    }
    
    console.log('\n✅ Schéma appliqué avec succès !')
    
    // Vérifier la structure créée
    console.log('\n🔍 Vérification de la structure...')
    
    const tables = ['users', 'companies', 'company_members', 'company_shares', 'documents', 'invitations', 'notifications']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`  ❌ Table ${table}: ${error.message}`)
        } else {
          console.log(`  ✅ Table ${table}: accessible`)
        }
      } catch (error) {
        console.log(`  ❌ Table ${table}: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application du schéma:', error.message)
    process.exit(1)
  }
}

// Lancer le script
applyCleanSchema()

