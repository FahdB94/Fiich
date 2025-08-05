#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 DIAGNOSTIC UPLOAD STORAGE')
console.log('=' .repeat(50))

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Variables d\'environnement manquantes')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey)
  process.exit(1)
}

// Client avec clé anonyme (comme dans l'app)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client avec service role pour les opérations admin
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey)

async function diagnostic() {
  console.log('\n📋 VÉRIFICATION DE LA CONNEXION...')
  
  try {
    // Test de connexion
    const { data, error } = await supabase.from('companies').select('count').limit(1)
    if (error) {
      console.log('❌ Erreur de connexion:', error.message)
    } else {
      console.log('✅ Connexion Supabase réussie')
    }
  } catch (err) {
    console.log('❌ Erreur de connexion:', err.message)
  }

  console.log('\n🗂️ VÉRIFICATION DU BUCKET...')
  
  try {
    // Lister les buckets
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()
    if (error) {
      console.log('❌ Erreur lors de la récupération des buckets:', error.message)
    } else {
      const companyFilesBucket = buckets.find(b => b.name === 'company-files')
      if (companyFilesBucket) {
        console.log('✅ Bucket "company-files" trouvé')
        console.log('   - Public:', companyFilesBucket.public)
        console.log('   - File size limit:', companyFilesBucket.file_size_limit)
        console.log('   - Allowed mime types:', companyFilesBucket.allowed_mime_types)
      } else {
        console.log('❌ Bucket "company-files" non trouvé')
        console.log('Buckets disponibles:', buckets.map(b => b.name))
      }
    }
  } catch (err) {
    console.log('❌ Erreur lors de la vérification du bucket:', err.message)
  }

  console.log('\n🔐 VÉRIFICATION DES POLITIQUES RLS...')
  
  try {
    // Vérifier les politiques sur le bucket
    const { data: policies, error } = await supabaseAdmin.storage.getBucket('company-files')
    if (error) {
      console.log('❌ Erreur lors de la récupération des politiques:', error.message)
    } else {
      console.log('✅ Bucket accessible')
    }
  } catch (err) {
    console.log('❌ Erreur lors de la vérification des politiques:', err.message)
  }

  console.log('\n📝 VÉRIFICATION DE LA TABLE DOCUMENTS...')
  
  try {
    // Vérifier la table documents
    const { data, error } = await supabase.from('documents').select('*').limit(1)
    if (error) {
      console.log('❌ Erreur d\'accès à la table documents:', error.message)
    } else {
      console.log('✅ Table documents accessible')
    }
  } catch (err) {
    console.log('❌ Erreur lors de la vérification de la table documents:', err.message)
  }

  console.log('\n🧪 TEST D\'UPLOAD...')
  
  try {
    // Créer un fichier de test
    const testContent = 'Test file content'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    const testPath = `test/${testFileName}`

    console.log('Tentative d\'upload vers company-files...')
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-files')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.log('❌ Erreur d\'upload:', uploadError.message)
      console.log('Code d\'erreur:', uploadError.statusCode)
      
      // Suggestions de correction
      if (uploadError.message.includes('not found')) {
        console.log('\n💡 SUGGESTION: Le bucket n\'existe pas ou n\'est pas accessible')
      } else if (uploadError.message.includes('permission')) {
        console.log('\n💡 SUGGESTION: Problème de permissions RLS')
      } else if (uploadError.message.includes('size')) {
        console.log('\n💡 SUGGESTION: Fichier trop volumineux')
      }
    } else {
      console.log('✅ Upload réussi!')
      console.log('Fichier uploadé:', uploadData.path)
      
      // Nettoyer le fichier de test
      await supabase.storage.from('company-files').remove([testPath])
      console.log('🧹 Fichier de test supprimé')
    }
  } catch (err) {
    console.log('❌ Erreur lors du test d\'upload:', err.message)
  }

  console.log('\n🔧 SUGGESTIONS DE CORRECTION...')
  console.log('1. Vérifiez que le bucket "company-files" existe dans Supabase')
  console.log('2. Vérifiez les politiques RLS sur le bucket')
  console.log('3. Vérifiez que l\'utilisateur a les bonnes permissions')
  console.log('4. Si RLS est désactivé, vérifiez les politiques sur la table documents')
  
  console.log('\n📋 COMMANDES SQL UTILES:')
  console.log('-- Vérifier les buckets')
  console.log('SELECT * FROM storage.buckets WHERE name = \'company-files\';')
  console.log('')
  console.log('-- Vérifier les politiques sur le bucket')
  console.log('SELECT * FROM storage.policies WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = \'company-files\');')
  console.log('')
  console.log('-- Vérifier les politiques sur la table documents')
  console.log('SELECT * FROM pg_policies WHERE tablename = \'documents\';')
}

diagnostic().catch(console.error) 