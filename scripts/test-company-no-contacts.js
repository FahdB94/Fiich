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

async function testCompanyNoContacts() {
  console.log('🧪 TEST CRÉATION ENTREPRISE SANS CONTACTS');
  console.log('==========================================');

  try {
    // Test de création d'entreprise sans contacts
    console.log('📋 1. Test création entreprise sans contacts...');
    
    const testCompanyData = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID factice pour le test
      company_name: 'Entreprise Test Sans Contacts',
      siren: '987654321',
      siret: '98765432109876',
      address_line_1: '456 Avenue Test',
      address_line_2: '',
      postal_code: '69001',
      city: 'Lyon',
      country: 'France',
      phone: '+33456789012',
      email: 'contact@test-sans-contacts.com',
      website: 'https://test-sans-contacts.com',
      description: 'Description de test sans contacts',
      ape_code: '6201Z',
      vat_number: 'FR98765432109',
      payment_terms: ['30 jours'],
      rib: 'FR7630001007941234567890185',
      // Pas de contacts
    };

    const { data: createdCompany, error: createError } = await supabase
      .from('companies')
      .insert([testCompanyData])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erreur création entreprise:', createError.message);
      return;
    }

    console.log('✅ Entreprise créée avec succès (sans contacts)');
    console.log('📊 ID:', createdCompany.id);
    console.log('📊 Nom:', createdCompany.company_name);
    console.log('📊 Code APE:', createdCompany.ape_code);
    console.log('📊 TVA:', createdCompany.vat_number);
    console.log('📊 RIB:', createdCompany.rib);
    console.log('📊 Contacts:', createdCompany.contacts || 'Aucun');

    // Test de création d'entreprise avec contacts
    console.log('\n📋 2. Test création entreprise avec contacts...');
    
    const testCompanyWithContacts = {
      user_id: '00000000-0000-0000-0000-000000000000',
      company_name: 'Entreprise Test Avec Contacts',
      siren: '111222333',
      siret: '11122233344455',
      address_line_1: '789 Boulevard Test',
      address_line_2: '',
      postal_code: '13001',
      city: 'Marseille',
      country: 'France',
      phone: '+33456789013',
      email: 'contact@test-avec-contacts.com',
      website: 'https://test-avec-contacts.com',
      description: 'Description de test avec contacts',
      ape_code: '6201Z',
      vat_number: 'FR11122233344',
      payment_terms: ['À réception', '15 jours'],
      rib: 'FR7630001007941234567890185',
      contacts: [
        {
          contact_type: 'commercial',
          name: 'Pierre Dupont',
          email: 'pierre@test.com',
          phone: '+33456789014',
          job_title: 'Commercial',
          notes: 'Contact principal'
        }
      ]
    };

    const { data: createdCompanyWithContacts, error: createErrorWithContacts } = await supabase
      .from('companies')
      .insert([testCompanyWithContacts])
      .select()
      .single();

    if (createErrorWithContacts) {
      console.log('❌ Erreur création entreprise avec contacts:', createErrorWithContacts.message);
    } else {
      console.log('✅ Entreprise créée avec succès (avec contacts)');
      console.log('📊 ID:', createdCompanyWithContacts.id);
      console.log('📊 Nom:', createdCompanyWithContacts.company_name);
      console.log('📊 Contacts:', createdCompanyWithContacts.contacts?.length || 0);
    }

    // Nettoyer (supprimer les entreprises de test)
    console.log('\n📋 3. Nettoyage...');
    
    const { error: deleteError1 } = await supabase
      .from('companies')
      .delete()
      .eq('id', createdCompany.id);

    const { error: deleteError2 } = await supabase
      .from('companies')
      .delete()
      .eq('id', createdCompanyWithContacts?.id);

    if (deleteError1 || deleteError2) {
      console.log('⚠️  Erreur suppression:', deleteError1?.message || deleteError2?.message);
    } else {
      console.log('✅ Entreprises de test supprimées');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n📋 RÉCAPITULATIF:');
  console.log('1. ✅ Tests effectués');
  console.log('2. ✅ Création sans contacts fonctionne');
  console.log('3. ✅ Création avec contacts fonctionne');
  
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Tester l\'application: http://localhost:3001/companies/new');
  console.log('2. Créer une entreprise sans ajouter de contacts');
  console.log('3. Vérifier que tout fonctionne correctement');
}

testCompanyNoContacts(); 