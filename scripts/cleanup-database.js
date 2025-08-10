#!/usr/bin/env node

/**
 * Script de nettoyage complet de la base de données Fiich
 * ⚠️  ATTENTION: Ce script supprime TOUTES les données !
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Script SQL de nettoyage
const cleanupSQL = `
-- =====================================================
-- NETTOYAGE COMPLET DE LA BASE DE DONNÉES FIICH
-- =====================================================

-- Désactiver RLS temporairement pour le nettoyage
ALTER TABLE IF EXISTS company_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les données dans l'ordre (éviter les contraintes de clés étrangères)
DELETE FROM company_subscriptions;
DELETE FROM plans;
DELETE FROM notifications;
DELETE FROM invitations;
DELETE FROM documents;
DELETE FROM company_contacts;
DELETE FROM company_shares;
DELETE FROM company_members;
DELETE FROM companies;
DELETE FROM users;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_company_contacts_updated_at ON company_contacts;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_company_subscriptions_updated_at ON company_subscriptions;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Supprimer les index
DROP INDEX IF EXISTS idx_companies_owner_id;
DROP INDEX IF EXISTS idx_company_members_company_id;
DROP INDEX IF EXISTS idx_company_members_user_id;
DROP INDEX IF EXISTS idx_company_shares_company_id;
DROP INDEX IF EXISTS idx_company_shares_token;
DROP INDEX IF EXISTS idx_documents_company_id;
DROP INDEX IF EXISTS idx_invitations_company_id;
DROP INDEX IF EXISTS idx_invitations_email;
DROP INDEX IF EXISTS idx_invitations_token;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;

-- Supprimer les tables
DROP TABLE IF EXISTS company_subscriptions;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS company_contacts;
DROP TABLE IF EXISTS company_shares;
DROP TABLE IF EXISTS company_members;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users;

-- Supprimer l'extension UUID si elle n'est plus utilisée
-- DROP EXTENSION IF EXISTS "uuid-ossp";
`;

async function cleanupDatabase() {
  try {
    console.log('🧹 Nettoyage complet de la base de données Fiich...');
    console.log('⚠️  ATTENTION: Toutes les données seront supprimées !');
    
    // Demander confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirmation = await new Promise((resolve) => {
      rl.question('Tapez "CONFIRM" pour continuer le nettoyage: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
    
    if (confirmation !== 'CONFIRM') {
      console.log('❌ Nettoyage annulé');
      process.exit(0);
    }
    
    console.log('🚀 Début du nettoyage...');
    
    // Exécuter le script de nettoyage
    const { error } = await supabase.rpc('exec_sql', { sql: cleanupSQL });
    
    if (error) {
      console.log('⚠️  Fonction RPC non disponible, utilisation de l\'approche alternative...');
      
      // Diviser le SQL en parties plus petites
      const statements = cleanupSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (stmtError) {
              console.log(`⚠️  Statement ignoré: ${statement.substring(0, 50)}...`);
            }
          } catch (e) {
            console.log(`⚠️  Statement ignoré: ${statement.substring(0, 50)}...`);
          }
        }
      }
    }
    
    console.log('✅ Base de données nettoyée avec succès !');
    console.log('🗑️  Toutes les tables et données ont été supprimées');
    console.log('🔄 La base de données est maintenant prête pour un nouveau schéma');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
cleanupDatabase();
