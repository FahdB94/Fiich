const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticPartageDocuments() {
  console.log('🔍 Diagnostic des problèmes de partage de documents...\n')

  try {
    // =====================================================
    // 1. ANALYSE DES DOCUMENTS ET PERMISSIONS
    // =====================================================
    console.log('📋 1. ANALYSE DES DOCUMENTS ET PERMISSIONS')
    console.log('==========================================')

    // 1.1 Récupérer tous les documents
    console.log('\n📄 1.1 Récupération de tous les documents...')
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

    // 1.2 Analyser les permissions de partage
    console.log('\n🔐 1.2 Analyse des permissions de partage...')
    
    // Vérifier les politiques RLS sur les documents
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'documents' })
      .catch(() => ({ data: null, error: 'Fonction non disponible' }))

    if (rlsError) {
      console.log('ℹ️  Impossible de vérifier les politiques RLS directement')
    } else {
      console.log(`✅ Politiques RLS trouvées: ${rlsPolicies?.length || 0}`)
    }

    // =====================================================
    // 2. ANALYSE DES FICHIERS DANS LE STORAGE
    // =====================================================
    console.log('\n📁 2. ANALYSE DES FICHIERS DANS LE STORAGE')
    console.log('==========================================')

    // 2.1 Lister tous les fichiers dans le storage
    console.log('\n📋 2.1 Liste des fichiers dans le storage...')
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (storageError) {
      console.error('❌ Erreur récupération storage:', storageError)
      return
    }

    console.log(`✅ ${storageFiles.length} éléments dans le storage`)
    storageFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`)
      console.log(`      - Taille: ${file.metadata?.size || 0} bytes`)
      console.log(`      - Créé: ${file.created_at}`)
      console.log(`      - Mis à jour: ${file.updated_at}`)
      console.log('')
    })

    // 2.2 Vérifier l'accessibilité des fichiers
    console.log('\n🔍 2.2 Test d\'accessibilité des fichiers...')
    
    for (const doc of documents) {
      console.log(`\n📄 Test d'accessibilité pour: ${doc.name}`)
      
      const fullPath = `documents/${doc.file_path}`
      console.log(`   - Chemin complet: ${fullPath}`)
      
      // Test 1: Vérifier l'existence du fichier
      try {
        const { data: fileExists, error: existsError } = await supabase.storage
          .from('company-files')
          .list(`documents/${doc.company_id}`, { limit: 1000, offset: 0 })

        if (existsError) {
          console.log(`   ❌ Erreur vérification existence: ${existsError.message}`)
          continue
        }

        const fileName = doc.file_path.split('/').pop()
        const exists = fileExists.some(file => file.name === fileName)
        console.log(`   - Existe en storage: ${exists}`)

        if (!exists) {
          console.log(`   ❌ FICHIER MANQUANT: ${doc.name} n'existe pas en storage`)
          continue
        }

        // Test 2: Tenter de créer une URL signée
        try {
          const { data: signedUrl, error: urlError } = await supabase.storage
            .from('company-files')
            .createSignedUrl(fullPath, 60)

          if (urlError) {
            console.log(`   ❌ Erreur création URL signée: ${urlError.message}`)
            console.log(`   ❌ Code d'erreur: ${urlError.statusCode || 'N/A'}`)
          } else {
            console.log(`   ✅ URL signée créée avec succès`)
            console.log(`   - URL: ${signedUrl.signedUrl.substring(0, 100)}...`)
          }
        } catch (urlError) {
          console.log(`   ❌ Exception lors de la création d'URL: ${urlError.message}`)
        }

        // Test 3: Tenter d'obtenir l'URL publique
        try {
          const { data: publicUrl, error: publicError } = await supabase.storage
            .from('company-files')
            .getPublicUrl(fullPath)

          if (publicError) {
            console.log(`   ❌ Erreur URL publique: ${publicError.message}`)
          } else {
            console.log(`   ✅ URL publique disponible`)
            console.log(`   - URL: ${publicUrl.publicUrl.substring(0, 100)}...`)
          }
        } catch (publicError) {
          console.log(`   ❌ Exception URL publique: ${publicError.message}`)
        }

      } catch (error) {
        console.log(`   ❌ Erreur générale: ${error.message}`)
      }
    }

    // =====================================================
    // 3. ANALYSE DES PARTAGES ET INVITATIONS
    // =====================================================
    console.log('\n🤝 3. ANALYSE DES PARTAGES ET INVITATIONS')
    console.log('==========================================')

    // 3.1 Vérifier les partages d'entreprises
    console.log('\n📋 3.1 Partages d\'entreprises...')
    const { data: companyShares, error: sharesError } = await supabase
      .from('company_shares')
      .select('*')

    if (sharesError) {
      console.log('ℹ️  Table company_shares non accessible ou inexistante')
    } else {
      console.log(`✅ ${companyShares.length} partages d'entreprises trouvés`)
      companyShares.forEach((share, index) => {
        console.log(`   ${index + 1}. Entreprise: ${share.company_id}`)
        console.log(`      - Partagé avec: ${share.shared_with_email}`)
        console.log(`      - Créé: ${share.created_at}`)
        console.log(`      - Actif: ${share.is_active}`)
        console.log('')
      })
    }

    // 3.2 Vérifier les invitations
    console.log('\n📧 3.2 Invitations...')
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')

    if (invitationsError) {
      console.log('ℹ️  Table invitations non accessible ou inexistante')
    } else {
      console.log(`✅ ${invitations.length} invitations trouvées`)
      invitations.forEach((inv, index) => {
        console.log(`   ${index + 1}. ${inv.email}`)
        console.log(`      - Entreprise: ${inv.company_id}`)
        console.log(`      - Statut: ${inv.status}`)
        console.log(`      - Créé: ${inv.created_at}`)
        console.log('')
      })
    }

    // =====================================================
    // 4. TEST DE SIMULATION D'ACCÈS PARTAGÉ
    // =====================================================
    console.log('\n🧪 4. TEST DE SIMULATION D\'ACCÈS PARTAGÉ')
    console.log('==========================================')

    if (documents.length > 0) {
      const testDoc = documents[0]
      console.log(`\n📄 Test d'accès partagé pour: ${testDoc.name}`)
      
      // Simuler un accès anonyme (comme un partenaire)
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      try {
        // Test d'accès au document via l'API anonyme
        const { data: anonDoc, error: anonError } = await anonClient
          .from('documents')
          .select('*')
          .eq('id', testDoc.id)
          .single()

        if (anonError) {
          console.log(`   ❌ Accès anonyme refusé: ${anonError.message}`)
          console.log(`   - Code: ${anonError.code || 'N/A'}`)
          console.log(`   - Détails: ${anonError.details || 'N/A'}`)
        } else {
          console.log(`   ✅ Accès anonyme autorisé`)
          console.log(`   - Document: ${anonDoc.name}`)
        }

        // Test d'accès au fichier via l'API anonyme
        const fullPath = `documents/${testDoc.file_path}`
        const { data: anonUrl, error: anonUrlError } = await anonClient.storage
          .from('company-files')
          .createSignedUrl(fullPath, 60)

        if (anonUrlError) {
          console.log(`   ❌ Accès storage anonyme refusé: ${anonUrlError.message}`)
          console.log(`   - Code: ${anonUrlError.statusCode || 'N/A'}`)
        } else {
          console.log(`   ✅ Accès storage anonyme autorisé`)
          console.log(`   - URL: ${anonUrl.signedUrl.substring(0, 100)}...`)
        }

      } catch (error) {
        console.log(`   ❌ Erreur test anonyme: ${error.message}`)
      }
    }

    // =====================================================
    // 5. RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 5. RECOMMANDATIONS')
    console.log('=====================')

    console.log('\n🛡️  Recommandations pour résoudre les problèmes de partage:')
    console.log('')
    console.log('1. 🔐 PERMISSIONS STORAGE:')
    console.log('   - Vérifier les politiques RLS sur le bucket company-files')
    console.log('   - S\'assurer que les fichiers publics sont accessibles')
    console.log('   - Configurer les permissions pour les accès partagés')
    console.log('')
    console.log('2. 📄 PERMISSIONS DOCUMENTS:')
    console.log('   - Vérifier les politiques RLS sur la table documents')
    console.log('   - Permettre l\'accès aux documents partagés')
    console.log('   - Gérer les permissions par entreprise')
    console.log('')
    console.log('3. 🔗 URLS SIGNÉES:')
    console.log('   - Utiliser des URLs signées pour les accès sécurisés')
    console.log('   - Gérer l\'expiration des URLs')
    console.log('   - Fallback vers URLs publiques si nécessaire')
    console.log('')
    console.log('4. 🧪 TESTS COMPLETS:')
    console.log('   - Tester l\'accès anonyme aux documents')
    console.log('   - Valider les URLs de partage')
    console.log('   - Vérifier les permissions en contexte partagé')

    console.log('\n🎉 Diagnostic de partage terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic de partage:', error)
  }
}

// Exécution du script
diagnosticPartageDocuments() 