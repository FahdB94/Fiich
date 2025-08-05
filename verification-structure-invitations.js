const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verificationStructureInvitations() {
  console.log('🔍 Vérification de la structure de la table invitations...\n')

  try {
    // =====================================================
    // 1. VÉRIFICATION DE LA TABLE INVITATIONS
    // =====================================================
    console.log('📋 1. VÉRIFICATION DE LA TABLE INVITATIONS')
    console.log('===========================================')

    // Essayer de récupérer la structure de la table
    try {
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .limit(1)

      if (invitationsError) {
        console.log('❌ Erreur accès invitations:', invitationsError.message)
      } else {
        console.log(`✅ Table invitations accessible`)
        
        if (invitations && invitations.length > 0) {
          const sampleInvitation = invitations[0]
          console.log('📋 Colonnes dans invitations:')
          Object.keys(sampleInvitation).forEach(key => {
            console.log(`   - ${key}: ${typeof sampleInvitation[key]} (${sampleInvitation[key] ? 'avec valeur' : 'null/vide'})`)
          })
        } else {
          console.log('ℹ️  Table invitations vide, création d\'un enregistrement de test...')
          
          // Créer un enregistrement de test pour voir la structure
          const { data: testInvitation, error: testError } = await supabase
            .from('invitations')
            .insert({
              company_id: '00000000-0000-0000-0000-000000000000', // UUID fictif
              email: 'test@example.com',
              invited_by_user_id: '00000000-0000-0000-0000-000000000000', // UUID fictif
              role: 'member',
              status: 'pending',
              token: 'test-token-123',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single()

          if (testError) {
            console.log('❌ Erreur création test invitation:', testError.message)
            console.log('🔍 Détails de l\'erreur:', testError)
          } else {
            console.log('✅ Enregistrement de test créé')
            console.log('📋 Structure de la table invitations:')
            Object.keys(testInvitation).forEach(key => {
              console.log(`   - ${key}: ${typeof testInvitation[key]} (${testInvitation[key] ? 'avec valeur' : 'null/vide'})`)
            })
            
            // Nettoyer l'enregistrement de test
            await supabase.from('invitations').delete().eq('id', testInvitation.id)
            console.log('🧹 Enregistrement de test supprimé')
          }
        }
      }
    } catch (error) {
      console.log('❌ Erreur générale invitations:', error.message)
    }

    // =====================================================
    // 2. VÉRIFICATION DES AUTRES TABLES
    // =====================================================
    console.log('\n📋 2. VÉRIFICATION DES AUTRES TABLES')
    console.log('=====================================')

    const tablesToCheck = ['company_shares', 'user_companies']

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
    // 3. RECHERCHE D'ALTERNATIVES POUR EMAIL
    // =====================================================
    console.log('\n🔍 3. RECHERCHE D\'ALTERNATIVES POUR EMAIL')
    console.log('==========================================')

    // Vérifier s'il y a d'autres colonnes qui pourraient contenir l'email
    try {
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .limit(1)

      if (!invitationsError && invitations && invitations.length > 0) {
        const invitation = invitations[0]
        console.log('🔍 Colonnes potentiellement liées à l\'email dans invitations:')
        
        const emailRelatedColumns = Object.keys(invitation).filter(key => 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('mail') ||
          key.toLowerCase().includes('contact') ||
          key.toLowerCase().includes('user')
        )
        
        if (emailRelatedColumns.length > 0) {
          emailRelatedColumns.forEach(col => {
            console.log(`   ✅ ${col}: ${invitation[col]}`)
          })
        } else {
          console.log('   ℹ️  Aucune colonne email trouvée')
        }
      }
    } catch (error) {
      console.log('❌ Erreur recherche alternatives email:', error.message)
    }

    // =====================================================
    // 4. RECOMMANDATIONS
    // =====================================================
    console.log('\n📋 4. RECOMMANDATIONS')
    console.log('=====================')

    console.log('\n🛠️  Solutions pour résoudre l\'erreur "column i.email does not exist":')
    console.log('')
    console.log('1. 🔍 VÉRIFIER LA STRUCTURE INVITATIONS:')
    console.log('   - La colonne email pourrait s\'appeler différemment')
    console.log('   - Utiliser la colonne correcte (ex: user_email, invited_email)')
    console.log('')
    console.log('2. 🔧 ADAPTER LE SCRIPT:')
    console.log('   - Remplacer "i.email" par le nom correct de la colonne')
    console.log('   - Ou modifier la structure de la table invitations')
    console.log('')
    console.log('3. 🧪 CRÉER LA COLONNE MANQUANTE:')
    console.log('   - ALTER TABLE invitations ADD COLUMN email TEXT;')
    console.log('   - Ou utiliser une colonne existante')
    console.log('')
    console.log('4. 📝 MODIFIER LA VUE:')
    console.log('   - Adapter accessible_documents pour utiliser la bonne colonne')
    console.log('   - Vérifier toutes les références à i.email')

    console.log('\n🎉 Vérification de la structure terminée!')

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  }
}

// Exécution du script
verificationStructureInvitations() 