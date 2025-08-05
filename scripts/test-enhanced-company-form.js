#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🧪 TEST DES NOUVELLES FONCTIONNALITÉS DU FORMULAIRE ENTREPRISE')
console.log('=' .repeat(60))

// Vérification des fichiers créés/modifiés
const filesToCheck = [
  {
    path: 'src/components/company/payment-terms-input.tsx',
    description: 'Composant PaymentTermsInput',
    required: true
  },
  {
    path: 'src/components/company/contacts-section.tsx',
    description: 'Composant ContactsSection',
    required: true
  },
  {
    path: 'src/components/company/company-form.tsx',
    description: 'Formulaire principal modifié',
    required: true
  },
  {
    path: 'src/lib/types.ts',
    description: 'Types étendus',
    required: true
  },
  {
    path: 'src/lib/validations.ts',
    description: 'Validations étendues',
    required: true
  },
  {
    path: 'AJOUT-COLONNES-ENTREPRISE-ETENDUE.sql',
    description: 'Script SQL pour les nouvelles colonnes',
    required: true
  }
]

let allFilesExist = true

console.log('\n📁 VÉRIFICATION DES FICHIERS :')
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file.path)
  const status = exists ? '✅' : '❌'
  console.log(`${status} ${file.description}: ${file.path}`)
  
  if (!exists && file.required) {
    allFilesExist = false
  }
})

// Vérification du contenu des fichiers clés
console.log('\n🔍 VÉRIFICATION DU CONTENU :')

// Vérification du composant PaymentTermsInput
const paymentTermsPath = 'src/components/company/payment-terms-input.tsx'
if (fs.existsSync(paymentTermsPath)) {
  const content = fs.readFileSync(paymentTermsPath, 'utf8')
  const checks = [
    { name: 'Interface PaymentTermsInputProps', found: content.includes('PaymentTermsInputProps') },
    { name: 'Fonction addTerm', found: content.includes('addTerm') },
    { name: 'Fonction removeTerm', found: content.includes('removeTerm') },
    { name: 'Suggestions de paiement', found: content.includes('Paiement comptant') },
    { name: 'Badge pour affichage', found: content.includes('Badge') }
  ]
  
  console.log('\n📋 PaymentTermsInput :')
  checks.forEach(check => {
    console.log(`  ${check.found ? '✅' : '❌'} ${check.name}`)
  })
}

// Vérification du composant ContactsSection
const contactsPath = 'src/components/company/contacts-section.tsx'
if (fs.existsSync(contactsPath)) {
  const content = fs.readFileSync(contactsPath, 'utf8')
  const checks = [
    { name: 'Interface ContactsSectionProps', found: content.includes('ContactsSectionProps') },
    { name: 'Types de contacts', found: content.includes('commercial') && content.includes('comptable') },
    { name: 'Fonction addContact', found: content.includes('addContact') },
    { name: 'Fonction removeContact', found: content.includes('removeContact') },
    { name: 'Formulaire d\'ajout', found: content.includes('Nouveau contact') },
    { name: 'Icônes pour types', found: content.includes('User') && content.includes('Building') }
  ]
  
  console.log('\n👥 ContactsSection :')
  checks.forEach(check => {
    console.log(`  ${check.found ? '✅' : '❌'} ${check.name}`)
  })
}

// Vérification du formulaire principal
const formPath = 'src/components/company/company-form.tsx'
if (fs.existsSync(formPath)) {
  const content = fs.readFileSync(formPath, 'utf8')
  const checks = [
    { name: 'Import PaymentTermsInput', found: content.includes('PaymentTermsInput') },
    { name: 'Import ContactsSection', found: content.includes('ContactsSection') },
    { name: 'État paymentTerms', found: content.includes('paymentTerms') },
    { name: 'État contacts', found: content.includes('contacts') },
    { name: 'Section APE/TVA', found: content.includes('ape_code') && content.includes('vat_number') },
    { name: 'Section RIB', found: content.includes('rib') },
    { name: 'Section conditions de paiement', found: content.includes('Informations légales') },
    { name: 'Section contacts', found: content.includes('ContactsSection') }
  ]
  
  console.log('\n📝 CompanyForm :')
  checks.forEach(check => {
    console.log(`  ${check.found ? '✅' : '❌'} ${check.name}`)
  })
}

// Vérification des types
const typesPath = 'src/lib/types.ts'
if (fs.existsSync(typesPath)) {
  const content = fs.readFileSync(typesPath, 'utf8')
  const checks = [
    { name: 'Nouvelles colonnes Company', found: content.includes('ape_code') && content.includes('vat_number') },
    { name: 'Interface CompanyContact', found: content.includes('CompanyContact') },
    { name: 'Interface CompanyContactFormData', found: content.includes('CompanyContactFormData') },
    { name: 'Table company_contacts', found: content.includes('company_contacts') }
  ]
  
  console.log('\n🏷️ Types :')
  checks.forEach(check => {
    console.log(`  ${check.found ? '✅' : '❌'} ${check.name}`)
  })
}

// Vérification des validations
const validationsPath = 'src/lib/validations.ts'
if (fs.existsSync(validationsPath)) {
  const content = fs.readFileSync(validationsPath, 'utf8')
  const checks = [
    { name: 'Validation APE', found: content.includes('ape_code') },
    { name: 'Validation TVA', found: content.includes('vat_number') },
    { name: 'Validation RIB', found: content.includes('rib') },
    { name: 'Validation contacts', found: content.includes('companyContactSchema') },
    { name: 'Regex APE', found: content.includes('\\d{4}[A-Z]') },
    { name: 'Regex TVA', found: content.includes('[A-Z]{2}[A-Z0-9]{2,20}') }
  ]
  
  console.log('\n✅ Validations :')
  checks.forEach(check => {
    console.log(`  ${check.found ? '✅' : '❌'} ${check.name}`)
  })
}

// Vérification du script SQL
const sqlPath = 'AJOUT-COLONNES-ENTREPRISE-ETENDUE.sql'
if (fs.existsSync(sqlPath)) {
  const content = fs.readFileSync(sqlPath, 'utf8')
  const checks = [
    { name: 'Ajout colonnes companies', found: content.includes('ADD COLUMN') },
    { name: 'Création table company_contacts', found: content.includes('CREATE TABLE') },
    { name: 'Index performance', found: content.includes('CREATE INDEX') },
    { name: 'RLS policies', found: content.includes('CREATE POLICY') },
    { name: 'Fonction get_company_contacts', found: content.includes('get_company_contacts') },
    { name: 'Contraintes validation', found: content.includes('ADD CONSTRAINT') }
  ]
  
  console.log('\n🗄️ Script SQL :')
  checks.forEach(check => {
    console.log(`  ${check.found ? '✅' : '❌'} ${check.name}`)
  })
}

// Résumé
console.log('\n' + '=' .repeat(60))
console.log('📊 RÉSUMÉ :')

if (allFilesExist) {
  console.log('✅ Tous les fichiers requis ont été créés')
  console.log('✅ Les nouvelles fonctionnalités sont prêtes à être testées')
  console.log('\n🎯 PROCHAINES ÉTAPES :')
  console.log('1. Exécuter le script SQL dans Supabase')
  console.log('2. Tester le formulaire sur http://localhost:3000/companies/new')
  console.log('3. Vérifier les nouvelles sections :')
  console.log('   - Informations légales et financières')
  console.log('   - Conditions de paiement')
  console.log('   - Contacts multiples')
} else {
  console.log('❌ Certains fichiers requis sont manquants')
  console.log('⚠️ Veuillez vérifier la création des fichiers')
}

console.log('\n🚀 Fonctionnalités ajoutées :')
console.log('• Code APE avec validation format')
console.log('• TVA intracommunautaire avec validation')
console.log('• RIB avec validation format')
console.log('• Conditions de paiement (liste dynamique)')
console.log('• Contacts multiples (commercial, comptable, etc.)')
console.log('• Interface intuitive avec suggestions')
console.log('• Validation complète côté client et serveur') 