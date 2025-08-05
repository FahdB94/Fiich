const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function investigateKBISOrphan() {
  console.log('🔍 Investigation du fichier KBIS orphelin...\n')

  try {
    // 1. Vérifier l'utilisateur fahdbari94@gmail.com
    console.log('👤 Recherche de l\'utilisateur fahdbari94@gmail.com...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'fahdbari94@gmail.com')
      .single()

    if (userError) {
      console.error('❌ Erreur lors de la recherche de l\'utilisateur:', userError)
      return
    }

    if (!user) {
      console.log('❌ Utilisateur fahdbari94@gmail.com non trouvé')
      return
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`)
    console.log(`   - Créé: ${user.created_at}`)
    console.log(`   - Dernière connexion: ${user.last_sign_in_at || 'Jamais'}\n`)

    // 2. Rechercher les entreprises de cet utilisateur
    console.log('🏢 Recherche des entreprises de l\'utilisateur...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)

    if (companiesError) {
      console.error('❌ Erreur lors de la recherche des entreprises:', companiesError)
      return
    }

    console.log(`✅ ${companies.length} entreprise(s) trouvée(s) pour l'utilisateur\n`)

    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.company_name}`)
      console.log(`      - ID: ${company.id}`)
      console.log(`      - SIRET: ${company.siret}`)
      console.log(`      - Créé: ${company.created_at}`)
      console.log(`      - Modifié: ${company.updated_at}`)
      console.log('')
    })

    // 3. Rechercher les documents liés à ces entreprises
    console.log('📄 Recherche des documents liés aux entreprises...')
    const companyIds = companies.map(c => c.id)
    
    if (companyIds.length === 0) {
      console.log('❌ Aucune entreprise trouvée, impossible de rechercher des documents')
      return
    }

    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.error('❌ Erreur lors de la recherche des documents:', documentsError)
      return
    }

    console.log(`✅ ${documents.length} document(s) trouvé(s)\n`)

    if (documents.length > 0) {
      documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.name}`)
        console.log(`      - ID: ${doc.id}`)
        console.log(`      - Type: ${doc.document_type || 'Non spécifié'}`)
        console.log(`      - Chemin: ${doc.file_path}`)
        console.log(`      - Taille: ${doc.file_size} bytes`)
        console.log(`      - Créé: ${doc.created_at}`)
        console.log(`      - Entreprise: ${companies.find(c => c.id === doc.company_id)?.company_name}`)
        console.log('')
      })
    }

    // 4. Rechercher spécifiquement le fichier KBIS problématique
    console.log('🔍 Recherche spécifique du fichier KBIS...')
    const kbisFileName = '1754059702600-Document_de_Synthese_J00129376059_v1.pdf'
    
    // Vérifier dans les logs ou l'historique
    const { data: kbisDocs, error: kbisError } = await supabase
      .from('documents')
      .select('*')
      .ilike('name', '%KBIS%')
      .order('created_at', { ascending: false })

    if (kbisError) {
      console.error('❌ Erreur lors de la recherche des KBIS:', kbisError)
    } else {
      console.log(`✅ ${kbisDocs.length} document(s) KBIS trouvé(s)\n`)
      
      kbisDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.name}`)
        console.log(`      - ID: ${doc.id}`)
        console.log(`      - Type: ${doc.document_type || 'Non spécifié'}`)
        console.log(`      - Chemin: ${doc.file_path}`)
        console.log(`      - Créé: ${doc.created_at}`)
        console.log(`      - Entreprise: ${companies.find(c => c.id === doc.company_id)?.company_name}`)
        console.log('')
      })
    }

    // 5. Vérifier les logs d'audit ou les tables de logs
    console.log('📋 Recherche dans les logs d\'audit...')
    
    // Vérifier s'il y a une table d'audit ou de logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .ilike('action', '%document%')
      .order('created_at', { ascending: false })
      .limit(10)

    if (auditError) {
      console.log('ℹ️  Aucune table d\'audit trouvée ou accessible')
    } else {
      console.log(`✅ ${auditLogs.length} log(s) d'audit trouvé(s)\n`)
      auditLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action}`)
        console.log(`      - Utilisateur: ${log.user_id}`)
        console.log(`      - Date: ${log.created_at}`)
        console.log(`      - Détails: ${log.details || 'Aucun'}`)
        console.log('')
      })
    }

    // 6. Analyser le processus d'upload actuel
    console.log('🔧 Analyse du processus d\'upload...')
    console.log('   - Vérification du code d\'upload dans enhanced-document-manager.tsx')
    console.log('   - Recherche de problèmes potentiels dans la logique d\'upload')
    console.log('')

    // 7. Vérifier les permissions et RLS
    console.log('🔐 Vérification des permissions...')
    
    // Vérifier les politiques RLS sur la table documents
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_rls_policies', { table_name: 'documents' })
      .catch(() => ({ data: null, error: 'Fonction non disponible' }))

    if (rlsError) {
      console.log('ℹ️  Impossible de vérifier les politiques RLS directement')
    } else {
      console.log(`✅ Politiques RLS trouvées: ${rlsPolicies?.length || 0}`)
    }

    // 8. Recommandations
    console.log('📋 Recommandations pour éviter les fichiers orphelins:')
    console.log('')
    console.log('1. 🔄 Améliorer la logique d\'upload:')
    console.log('   - Utiliser des transactions pour garantir l\'atomicité')
    console.log('   - Vérifier l\'existence du fichier après upload')
    console.log('   - Implémenter un rollback en cas d\'échec')
    console.log('')
    console.log('2. 📝 Ajouter des logs détaillés:')
    console.log('   - Logger chaque étape du processus d\'upload')
    console.log('   - Créer une table d\'audit pour tracer les opérations')
    console.log('   - Monitorer les échecs d\'upload')
    console.log('')
    console.log('3. 🛡️ Renforcer la validation:')
    console.log('   - Valider le fichier avant l\'upload')
    console.log('   - Vérifier les permissions utilisateur')
    console.log('   - Implémenter des contrôles de cohérence')
    console.log('')
    console.log('4. 🔍 Monitoring continu:')
    console.log('   - Exécuter le diagnostic régulièrement')
    console.log('   - Alerter en cas de fichiers orphelins')
    console.log('   - Automatiser le nettoyage')

  } catch (error) {
    console.error('❌ Erreur lors de l\'investigation:', error)
  }
}

// Fonction pour restaurer le fichier KBIS si nécessaire
async function restoreKBISFile() {
  console.log('🔄 Tentative de restauration du fichier KBIS...\n')

  try {
    // Rechercher l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'fahdbari94@gmail.com')
      .single()

    if (userError || !user) {
      console.log('❌ Utilisateur non trouvé')
      return
    }

    // Rechercher les entreprises de l'utilisateur
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)

    if (companiesError || !companies.length) {
      console.log('❌ Aucune entreprise trouvée')
      return
    }

    // Vérifier si le fichier existe encore dans le storage
    const fileName = '1754059702600-Document_de_Synthese_J00129376059_v1.pdf'
    const companyId = companies[0].id
    const filePath = `${companyId}/${fileName}`
    const fullPath = `documents/${filePath}`

    console.log(`🔍 Vérification du fichier: ${fullPath}`)

    // Vérifier l'existence dans le storage
    const { data: fileExists, error: storageError } = await supabase.storage
      .from('company-files')
      .list('documents', {
        limit: 1000,
        offset: 0
      })

    if (storageError) {
      console.error('❌ Erreur lors de la vérification du storage:', storageError)
      return
    }

    const fileInStorage = fileExists.find(file => file.name === filePath)
    
    if (fileInStorage) {
      console.log('✅ Fichier trouvé dans le storage, restauration de l\'entrée en base...')
      
      // Recréer l'entrée en base de données
      const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          name: fileName,
          file_path: filePath,
          mime_type: 'application/pdf',
          file_size: fileInStorage.metadata?.size || 246856,
          company_id: companyId,
          document_type: 'KBIS',
          display_name: 'Document de Synthèse KBIS'
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Erreur lors de la restauration:', insertError)
      } else {
        console.log('✅ Fichier KBIS restauré avec succès!')
        console.log(`   - ID: ${newDoc.id}`)
        console.log(`   - Nom: ${newDoc.name}`)
        console.log(`   - Entreprise: ${companies[0].company_name}`)
      }
    } else {
      console.log('❌ Fichier non trouvé dans le storage')
      console.log('   - Le fichier a probablement été supprimé manuellement')
      console.log('   - Ou il y a eu un problème lors de l\'upload initial')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error)
  }
}

// Exécution du script
const args = process.argv.slice(2)
if (args.includes('--restore')) {
  restoreKBISFile()
} else {
  investigateKBISOrphan()
} 