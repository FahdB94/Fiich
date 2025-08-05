const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCompanyCreation() {
  console.log('🧪 TEST CRÉATION ENTREPRISE');
  console.log('============================');

  try {
    // 1. Vérifier la structure de la table companies
    console.log('📋 1. Vérification de la table companies...');
    
    const { data: testCompany, error: testError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Erreur accès table companies:', testError.message);
      return;
    }

    console.log('✅ Table companies accessible');
    if (testCompany && testCompany.length > 0) {
      const company = testCompany[0];
      console.log('📊 Colonnes disponibles:', Object.keys(company));
      
      // Vérifier les nouvelles colonnes
      const requiredColumns = ['ape_code', 'vat_number', 'payment_terms', 'rib', 'contacts'];
      for (const col of requiredColumns) {
        if (col in company) {
          console.log(`✅ Colonne ${col} présente`);
        } else {
          console.log(`⚠️  Colonne ${col} manquante`);
        }
      }
    }

    // 2. Test de création d'entreprise avec tous les champs
    console.log('\n📋 2. Test de création d\'entreprise...');
    
    const testCompanyData = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID factice pour le test
      company_name: 'Entreprise Test Complète',
      siren: '123456789',
      siret: '12345678901234',
      address_line_1: '123 Rue Test',
      address_line_2: 'Bâtiment A',
      postal_code: '75001',
      city: 'Paris',
      country: 'France',
      phone: '+33123456789',
      email: 'contact@test.com',
      website: 'https://test.com',
      description: 'Description de test',
      ape_code: '6201Z',
      vat_number: 'FR12345678901',
      payment_terms: ['30 jours', 'À réception'],
      rib: 'FR7630001007941234567890185',
      contacts: [
        {
          contact_type: 'commercial',
          name: 'Jean Dupont',
          email: 'jean@test.com',
          phone: '+33123456789',
          job_title: 'Commercial',
          notes: 'Contact principal'
        },
        {
          contact_type: 'comptable',
          name: 'Marie Martin',
          email: 'marie@test.com',
          phone: '+33123456790',
          job_title: 'Comptable',
          notes: 'Contact comptabilité'
        }
      ]
    };

    const { data: createdCompany, error: createError } = await supabase
      .from('companies')
      .insert([testCompanyData])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erreur création entreprise:', createError.message);
      console.log('💡 Exécutez AJOUT-COLONNE-CONTACTS.sql dans Supabase');
      return;
    }

    console.log('✅ Entreprise créée avec succès');
    console.log('📊 ID:', createdCompany.id);
    console.log('📊 Nom:', createdCompany.company_name);
    console.log('📊 Code APE:', createdCompany.ape_code);
    console.log('📊 TVA:', createdCompany.vat_number);
    console.log('📊 RIB:', createdCompany.rib);
    console.log('📊 Contacts:', createdCompany.contacts?.length || 0);

    // 3. Nettoyer (supprimer l'entreprise de test)
    console.log('\n📋 3. Nettoyage...');
    
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', createdCompany.id);

    if (deleteError) {
      console.log('⚠️  Erreur suppression:', deleteError.message);
    } else {
      console.log('✅ Entreprise de test supprimée');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n📋 RÉCAPITULATIF:');
  console.log('1. ✅ Vérifications effectuées');
  console.log('2. 💡 Exécutez AJOUT-COLONNE-CONTACTS.sql si nécessaire');
  console.log('3. 🧪 Testez l\'application avec tous les champs');
  
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Exécuter AJOUT-COLONNE-CONTACTS.sql dans Supabase');
  console.log('2. Tester l\'application: http://localhost:3001/companies/new');
  console.log('3. Créer une entreprise avec tous les champs');
  console.log('4. Vérifier que tout fonctionne correctement');
}

testCompanyCreation(); 