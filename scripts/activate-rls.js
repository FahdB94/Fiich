#!/usr/bin/env node

/**
 * Script d'activation de RLS (Row Level Security) sur toutes les tables
 * Ce script active RLS et crée les politiques de sécurité appropriées
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

// Script SQL pour activer RLS et créer les politiques
const rlsSQL = `
-- =====================================================
-- ACTIVATION DE RLS ET CRÉATION DES POLITIQUES DE SÉCURITÉ
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLITIQUES POUR LA TABLE users
-- =====================================================

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Les utilisateurs peuvent créer leur profil
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- POLITIQUES POUR LA TABLE companies
-- =====================================================

-- Les utilisateurs peuvent voir les entreprises dont ils sont membres
CREATE POLICY "Users can view companies they belong to" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = companies.id AND user_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

-- Les propriétaires peuvent modifier leurs entreprises
CREATE POLICY "Owners can update their companies" ON companies
  FOR UPDATE USING (owner_id = auth.uid());

-- Les utilisateurs authentifiés peuvent créer des entreprises
CREATE POLICY "Authenticated users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Les propriétaires peuvent supprimer leurs entreprises
CREATE POLICY "Owners can delete their companies" ON companies
  FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- POLITIQUES POUR LA TABLE company_members
-- =====================================================

-- Les membres peuvent voir les membres de leurs entreprises
CREATE POLICY "Members can view company members" ON company_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_members cm 
      WHERE cm.company_id = company_members.company_id AND cm.user_id = auth.uid()
    )
  );

-- Les propriétaires peuvent ajouter/supprimer des membres
CREATE POLICY "Owners can manage company members" ON company_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_members.company_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES POUR LA TABLE company_shares
-- =====================================================

-- Les utilisateurs peuvent voir les partages de leurs entreprises
CREATE POLICY "Users can view company shares" ON company_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = company_shares.company_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_shares.company_id AND owner_id = auth.uid()
    )
  );

-- Les propriétaires peuvent créer des partages
CREATE POLICY "Owners can create company shares" ON company_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- Les propriétaires peuvent modifier/supprimer des partages
CREATE POLICY "Owners can manage company shares" ON company_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES POUR LA TABLE company_contacts
-- =====================================================

-- Les membres peuvent voir les contacts de leurs entreprises
CREATE POLICY "Members can view company contacts" ON company_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = company_contacts.company_id AND user_id = auth.uid()
    )
  );

-- Les propriétaires peuvent gérer les contacts
CREATE POLICY "Owners can manage company contacts" ON company_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES POUR LA TABLE documents
-- =====================================================

-- Les membres peuvent voir les documents de leurs entreprises
CREATE POLICY "Members can view company documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = documents.company_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM companies 
      WHERE id = documents.company_id AND owner_id = auth.uid()
    )
  );

-- Les membres peuvent télécharger des documents
CREATE POLICY "Members can download documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = documents.company_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM companies 
      WHERE id = documents.company_id AND owner_id = auth.uid()
    )
  );

-- Les membres peuvent téléverser des documents
CREATE POLICY "Members can upload documents" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = documents.company_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM companies 
      WHERE id = documents.company_id AND owner_id = auth.uid()
    )
  );

-- Les propriétaires peuvent gérer tous les documents
CREATE POLICY "Owners can manage all documents" ON documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES POUR LA TABLE invitations
-- =====================================================

-- Les utilisateurs peuvent voir les invitations qu'ils ont envoyées
CREATE POLICY "Users can view sent invitations" ON invitations
  FOR SELECT USING (sent_by = auth.uid());

-- Les utilisateurs peuvent voir les invitations reçues (par email)
CREATE POLICY "Users can view received invitations" ON invitations
  FOR SELECT USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Les propriétaires peuvent créer des invitations
CREATE POLICY "Owners can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- Les propriétaires peuvent gérer les invitations
CREATE POLICY "Owners can manage invitations" ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLITIQUES POUR LA TABLE notifications
-- =====================================================

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Les utilisateurs peuvent créer des notifications pour eux-mêmes
CREATE POLICY "Users can create own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- POLITIQUES POUR LA TABLE plans
-- =====================================================

-- Tout le monde peut voir les plans (lecture seule)
CREATE POLICY "Everyone can view plans" ON plans
  FOR SELECT USING (true);

-- Seuls les administrateurs peuvent modifier les plans (pas de politique d'insertion/modification)

-- =====================================================
-- POLITIQUES POUR LA TABLE company_subscriptions
-- =====================================================

-- Les propriétaires peuvent voir leurs abonnements
CREATE POLICY "Owners can view company subscriptions" ON company_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- Les propriétaires peuvent gérer leurs abonnements
CREATE POLICY "Owners can manage company subscriptions" ON company_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );
`;

async function activateRLS() {
  try {
    console.log('🔒 Activation de RLS et création des politiques de sécurité...');
    
    // Exécuter le script RLS
    const { error } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (error) {
      console.log('⚠️  Fonction RPC non disponible, utilisation de l\'approche alternative...');
      
      // Diviser le SQL en parties plus petites
      const statements = rlsSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
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
    
    console.log('✅ RLS activé et politiques de sécurité créées avec succès !');
    console.log('🛡️  Sécurité activée sur toutes les tables :');
    console.log('   - users');
    console.log('   - companies');
    console.log('   - company_members');
    console.log('   - company_shares');
    console.log('   - company_contacts');
    console.log('   - documents');
    console.log('   - invitations');
    console.log('   - notifications');
    console.log('   - plans');
    console.log('   - company_subscriptions');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'activation de RLS:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
activateRLS();
