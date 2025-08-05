const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.log('Vérifiez que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnosticLogoModal() {
  console.log('🔍 Diagnostic Logo et Modal')
  console.log('============================\n')

  try {
    // 1. Vérifier la structure de la table companies
    console.log('1. Vérification de la structure de la table companies...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'companies')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.error('❌ Erreur lors de la vérification des colonnes:', columnsError)
    } else {
      console.log('✅ Colonnes de la table companies:')
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
      
      const hasLogoUrl = columns.some(col => col.column_name === 'logo_url')
      if (hasLogoUrl) {
        console.log('✅ Colonne logo_url trouvée')
      } else {
        console.log('❌ Colonne logo_url manquante - Exécutez AJOUT-COLONNE-LOGO-URL.sql')
      }
    }

    // 2. Vérifier les entreprises existantes
    console.log('\n2. Vérification des entreprises existantes...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, logo_url, created_at')
      .limit(5)

    if (companiesError) {
      console.error('❌ Erreur lors de la récupération des entreprises:', companiesError)
    } else {
      console.log(`✅ ${companies.length} entreprises trouvées:`)
      companies.forEach(company => {
        console.log(`   - ${company.company_name}: ${company.logo_url ? '✅ Logo' : '❌ Pas de logo'}`)
      })
    }

    // 3. Vérifier le bucket storage
    console.log('\n3. Vérification du bucket company-files...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error('❌ Erreur lors de la vérification des buckets:', bucketsError)
    } else {
      const companyFilesBucket = buckets.find(b => b.name === 'company-files')
      if (companyFilesBucket) {
        console.log('✅ Bucket company-files trouvé')
        
        // Vérifier les fichiers dans le bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('company-files')
          .list('logos', { limit: 10 })

        if (filesError) {
          console.error('❌ Erreur lors de la vérification des fichiers:', filesError)
        } else {
          console.log(`✅ ${files.length} fichiers trouvés dans logos/`)
          files.forEach(file => {
            console.log(`   - ${file.name}`)
          })
        }
      } else {
        console.log('❌ Bucket company-files manquant')
      }
    }

    // 4. Test d'upload de logo
    console.log('\n4. Test d\'upload de logo...')
    if (companies && companies.length > 0) {
      const testCompany = companies[0]
      console.log(`   Test avec l'entreprise: ${testCompany.company_name}`)
      
      // Créer un fichier de test (1x1 pixel PNG)
      const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      const testFile = Buffer.from(testImageData, 'base64')
      
      const fileName = `logos/${testCompany.id}/test-${Date.now()}.png`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(fileName, testFile, {
          contentType: 'image/png'
        })

      if (uploadError) {
        console.error('❌ Erreur lors du test d\'upload:', uploadError)
      } else {
        console.log('✅ Test d\'upload réussi')
        
        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('company-files')
          .getPublicUrl(fileName)
        
        console.log('   URL publique:', publicUrl)
        
        // Mettre à jour l'entreprise avec le logo
        const { data: updateData, error: updateError } = await supabase
          .from('companies')
          .update({ logo_url: publicUrl })
          .eq('id', testCompany.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError)
        } else {
          console.log('✅ Logo mis à jour dans la base de données')
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }

  console.log('\n📋 Résumé des actions à effectuer:')
  console.log('1. Si logo_url manque: Exécuter AJOUT-COLONNE-LOGO-URL.sql')
  console.log('2. Si bucket manque: Créer le bucket company-files dans Supabase')
  console.log('3. Si permissions manquent: Configurer les politiques RLS')
  console.log('4. Vérifier les logs dans la console du navigateur')
}

diagnosticLogoModal() 