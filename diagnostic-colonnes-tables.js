const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnosticColonnesTables() {
  console.log('🔍 Diagnostic des colonnes des tables...\n')

  try {
    // =====================================================
    // 1. DIAGNOSTIC DE LA TABLE AUTH.USERS
    // =====================================================
    console.log('👤 1. DIAGNOSTIC DE LA TABLE AUTH.USERS')
    console.log('========================================')

    try {
      // Essayer de récupérer les utilisateurs
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (usersError) {
        console.log('❌ Erreur accès auth.users:', usersError.message)
      } else {
        console.log(`✅ Accès auth.users réussi: ${users.users.length} utilisateurs`)
        
        if (users.users.length > 0) {
          const sampleUser = users.users[0]
          console.log('📋 Colonnes disponibles dans auth.users:')
          Object.keys(sampleUser).forEach(key => {
            console.log(`   - ${key}: ${typeof sampleUser[key]} (${sampleUser[key] ? 'avec valeur' : 'null/vide'})`)
          })
        }
      }
    } catch (error) {
      console.log('❌ Erreur générale auth.users:', error.message)
    }

    // =====================================================
    // 2. DIAGNOSTIC DES TABLES PUBLIQUES
    // =====================================================
    console.log('\n📋 2. DIAGNOSTIC DES TABLES PUBLIQUES')
    console.log('=======================================')

    const tablesToCheck = ['companies', 'documents', 'user_companies', 'company_shares', 'invitations']

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ Table ${tableName}: accessible`)
          
          if (data && data.length > 0) {
            const sampleRow = data[0]
            console.log(`   📋 Colonnes dans ${tableName}:`)
            Object.keys(sampleRow).forEach(key => {
              console.log(`      - ${key}: ${typeof sampleRow[key]} (${sampleRow[key] ? 'avec valeur' : 'null/vide'})`)
            })
          } else {
            console.log(`   ℹ️  Table ${tableName} vide`)
          }
        }
      } catch (error) {
        console.log(`❌ Erreur table ${tableName}: ${error.message}`)
      }
    }

    // =====================================================
    // 3. VÉRIFICATION DES COLONNES SPÉCIFIQUES
    // =====================================================
    console.log('\n🔍 3. VÉRIFICATION DES COLONNES SPÉCIFIQUES')
    console.log('============================================')

    // Vérifier si la colonne email existe dans auth.users
    try {
      const { data: emailTest, error: emailError } = await supabase
        .from('auth.users')
        .select('email')
        .limit(1)

      if (emailError) {
        console.log('❌ Colonne email dans auth.users:', emailError.message)
      } else {
        console.log('✅ Colonne email dans auth.users: accessible')
      }
    } catch (error) {
      console.log('❌ Erreur test colonne email:', error.message)
    }

    // Vérifier les colonnes dans companies
    try {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1)

      if (companiesError) {
        console.log('❌ Erreur companies:', companiesError.message)
      } else if (companies && companies.length > 0) {
        const company = companies[0]
        console.log('📋 Colonnes dans companies:')
        Object.keys(company).forEach(key => {
          console.log(`   - ${key}: ${typeof company[key]} (${company[key] ? 'avec valeur' : 'null/vide'})`)
        })
      }
    } catch (error) {
      console.log('❌ Erreur diagnostic companies:', error.message)
    }

    // =====================================================
    // 4. RECHERCHE D'ALTERNATIVES POUR EMAIL
    // =====================================================
    console.log('\n🔍 4. RECHERCHE D\'ALTERNATIVES POUR EMAIL')
    console.log('==========================================')

    // Vérifier s'il y a d'autres colonnes qui pourraient contenir l'email
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (!usersError && users.users.length > 0) {
        const user = users.users[0]
        console.log('🔍 Colonnes potentiellement liées à l\'email dans auth.users:')
        
        const emailRelatedColumns = Object.keys(user).filter(key => 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('mail') ||
          key.toLowerCase().includes('contact')
        )
        
        if (emailRelatedColumns.length > 0) {
          emailRelatedColumns.forEach(col => {
            console.log(`   ✅ ${col}: ${user[col]}`)
          })
        } else {
          console.log('   ℹ️  Aucune colonne email trouvée')
        }
      }
    } catch (error) {
      console.log('❌ Erreur recherche alternatives email:', error.message)
    }

    // =====================================================
    // 5. RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 5. RECOMMANDATIONS')
    console.log('=====================')

    console.log('\n🛠️  Solutions pour résoudre l\'erreur "column email does not exist":')
    console.log('')
    console.log('1. 🔍 VÉRIFIER LA STRUCTURE AUTH.USERS:')
    console.log('   - La colonne email pourrait s\'appeler différemment')
    console.log('   - Utiliser la colonne correcte (ex: user_email, contact_email)')
    console.log('')
    console.log('2. 🔧 ADAPTER LE SCRIPT:')
    console.log('   - Remplacer "email" par le nom correct de la colonne')
    console.log('   - Ou utiliser une approche alternative pour identifier l\'utilisateur')
    console.log('')
    console.log('3. 🧪 TESTER LES ALTERNATIVES:')
    console.log('   - Utiliser auth.uid() directement')
    console.log('   - Créer une fonction pour récupérer l\'email')
    console.log('   - Utiliser une table de mapping utilisateur-email')
    console.log('')
    console.log('4. 📝 MODIFIER LES FONCTIONS:')
    console.log('   - Adapter can_access_document()')
    console.log('   - Adapter get_accessible_documents()')
    console.log('   - Adapter la vue accessible_documents')

    console.log('\n🎉 Diagnostic des colonnes terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
  }
}

// Exécution du script
diagnosticColonnesTables() 