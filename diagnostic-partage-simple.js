const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticPartageSimple() {
  console.log('🔍 Diagnostic simplifié des problèmes de partage...\n')

  try {
    // =====================================================
    // 1. ANALYSE DES DOCUMENTS
    // =====================================================
    console.log('📋 1. ANALYSE DES DOCUMENTS')
    console.log('==========================')

    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('❌ Erreur récupération documents:', docsError)
      return
    }

    console.log(`✅ ${documents.length} documents trouvés`)
    documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name}`)
      console.log(`      - ID: ${doc.id}`)
      console.log(`      - Chemin: ${doc.file_path}`)
      console.log(`      - Entreprise: ${doc.company_id}`)
      console.log(`      - Public: ${doc.is_public}`)
      console.log(`      - Type: ${doc.document_type}`)
      console.log('')
    })

    // =====================================================
    // 2. TEST D'ACCÈS AUX FICHIERS
    // =====================================================
    console.log('🔍 2. TEST D\'ACCÈS AUX FICHIERS')
    console.log('================================')

    for (const doc of documents) {
      console.log(`\n📄 Test pour: ${doc.name}`)
      console.log(`   - Public: ${doc.is_public}`)
      console.log(`   - Chemin: ${doc.file_path}`)
      
      const fullPath = `documents/${doc.file_path}`
      
      // Test 1: Vérifier l'existence du fichier
      try {
        const { data: fileExists, error: existsError } = await supabase.storage
          .from('company-files')
          .list(`documents/${doc.company_id}`, { limit: 1000, offset: 0 })

        if (existsError) {
          console.log(`   ❌ Erreur vérification: ${existsError.message}`)
          continue
        }

        const fileName = doc.file_path.split('/').pop()
        const exists = fileExists.some(file => file.name === fileName)
        console.log(`   - Existe en storage: ${exists}`)

        if (!exists) {
          console.log(`   ❌ FICHIER MANQUANT EN STORAGE`)
          continue
        }

        // Test 2: URL signée avec clé service
        try {
          const { data: signedUrl, error: urlError } = await supabase.storage
            .from('company-files')
            .createSignedUrl(fullPath, 60)

          if (urlError) {
            console.log(`   ❌ Erreur URL signée (service): ${urlError.message}`)
            console.log(`   - Status: ${urlError.statusCode || 'N/A'}`)
          } else {
            console.log(`   ✅ URL signée (service) créée`)
            console.log(`   - URL: ${signedUrl.signedUrl.substring(0, 80)}...`)
          }
        } catch (urlError) {
          console.log(`   ❌ Exception URL signée: ${urlError.message}`)
        }

        // Test 3: URL publique
        try {
          const { data: publicUrl, error: publicError } = await supabase.storage
            .from('company-files')
            .getPublicUrl(fullPath)

          if (publicError) {
            console.log(`   ❌ Erreur URL publique: ${publicError.message}`)
          } else {
            console.log(`   ✅ URL publique disponible`)
            console.log(`   - URL: ${publicUrl.publicUrl.substring(0, 80)}...`)
          }
        } catch (publicError) {
          console.log(`   ❌ Exception URL publique: ${publicError.message}`)
        }

      } catch (error) {
        console.log(`   ❌ Erreur générale: ${error.message}`)
      }
    }

    // =====================================================
    // 3. TEST D'ACCÈS ANONYME
    // =====================================================
    console.log('\n🧪 3. TEST D\'ACCÈS ANONYME')
    console.log('==========================')

    if (documents.length > 0) {
      const testDoc = documents[0]
      console.log(`\n📄 Test d'accès anonyme pour: ${testDoc.name}`)
      
      // Créer un client anonyme
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      // Test 1: Accès au document en base
      try {
        const { data: anonDoc, error: anonError } = await anonClient
          .from('documents')
          .select('*')
          .eq('id', testDoc.id)
          .single()

        if (anonError) {
          console.log(`   ❌ Accès document anonyme refusé: ${anonError.message}`)
          console.log(`   - Code: ${anonError.code || 'N/A'}`)
          console.log(`   - Détails: ${anonError.details || 'N/A'}`)
        } else {
          console.log(`   ✅ Accès document anonyme autorisé`)
          console.log(`   - Document: ${anonDoc.name}`)
          console.log(`   - Public: ${anonDoc.is_public}`)
        }
      } catch (error) {
        console.log(`   ❌ Exception accès document: ${error.message}`)
      }

      // Test 2: Accès au fichier en storage
      try {
        const fullPath = `documents/${testDoc.file_path}`
        const { data: anonUrl, error: anonUrlError } = await anonClient.storage
          .from('company-files')
          .createSignedUrl(fullPath, 60)

        if (anonUrlError) {
          console.log(`   ❌ Accès storage anonyme refusé: ${anonUrlError.message}`)
          console.log(`   - Status: ${anonUrlError.statusCode || 'N/A'}`)
        } else {
          console.log(`   ✅ Accès storage anonyme autorisé`)
          console.log(`   - URL: ${anonUrl.signedUrl.substring(0, 80)}...`)
        }
      } catch (error) {
        console.log(`   ❌ Exception accès storage: ${error.message}`)
      }
    }

    // =====================================================
    // 4. ANALYSE DES PARTAGES
    // =====================================================
    console.log('\n🤝 4. ANALYSE DES PARTAGES')
    console.log('=========================')

    // Vérifier les partages d'entreprises
    try {
      const { data: companyShares, error: sharesError } = await supabase
        .from('company_shares')
        .select('*')

      if (sharesError) {
        console.log('ℹ️  Table company_shares non accessible')
      } else {
        console.log(`✅ ${companyShares.length} partages d'entreprises trouvés`)
        companyShares.forEach((share, index) => {
          console.log(`   ${index + 1}. Entreprise: ${share.company_id}`)
          console.log(`      - Partagé avec: ${share.shared_with_email}`)
          console.log(`      - Actif: ${share.is_active}`)
          console.log('')
        })
      }
    } catch (error) {
      console.log('ℹ️  Erreur accès company_shares:', error.message)
    }

    // Vérifier les invitations
    try {
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')

      if (invitationsError) {
        console.log('ℹ️  Table invitations non accessible')
      } else {
        console.log(`✅ ${invitations.length} invitations trouvées`)
        invitations.forEach((inv, index) => {
          console.log(`   ${index + 1}. ${inv.email}`)
          console.log(`      - Entreprise: ${inv.company_id}`)
          console.log(`      - Statut: ${inv.status}`)
          console.log('')
        })
      }
    } catch (error) {
      console.log('ℹ️  Erreur accès invitations:', error.message)
    }

    // =====================================================
    // 5. RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 5. RECOMMANDATIONS')
    console.log('=====================')

    console.log('\n🛡️  Solutions pour les problèmes de partage:')
    console.log('')
    console.log('1. 🔐 PERMISSIONS STORAGE:')
    console.log('   - Vérifier que le bucket company-files est public')
    console.log('   - Configurer les politiques RLS appropriées')
    console.log('   - Permettre l\'accès aux fichiers partagés')
    console.log('')
    console.log('2. 📄 PERMISSIONS DOCUMENTS:')
    console.log('   - S\'assurer que les documents partagés sont accessibles')
    console.log('   - Configurer les politiques RLS pour le partage')
    console.log('   - Gérer les permissions par entreprise')
    console.log('')
    console.log('3. 🔗 GESTION DES URLS:')
    console.log('   - Utiliser des URLs signées pour la sécurité')
    console.log('   - Implémenter un fallback vers URLs publiques')
    console.log('   - Gérer l\'expiration des URLs')
    console.log('')
    console.log('4. 🧪 TESTS:')
    console.log('   - Tester l\'accès anonyme aux documents')
    console.log('   - Valider les URLs de partage')
    console.log('   - Vérifier les permissions en contexte partagé')

    console.log('\n🎉 Diagnostic simplifié terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécution du script
diagnosticPartageSimple() 