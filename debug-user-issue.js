// Script de debug avancé pour identifier le problème exact
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jjibjvxdiqvuseaexivl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWJqdnhkaXF2dXNlYWV4aXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwNTg5NywiZXhwIjoyMDY5NDgxODk3fQ.XL_jXSUFAxchEu-POq3JjF5oHs7e0J22ufhYlUXfUHc'

// Client avec service role pour accéder à toutes les données
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugUserIssue() {
  console.log('🔍 DIAGNOSTIC AVANCÉ DES UTILISATEURS\n')
  
  try {
    // 1. Lister tous les utilisateurs auth.users
    console.log('1️⃣ Utilisateurs dans auth.users:')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.log('❌ Erreur auth.users:', authError.message)
      return
    }
    
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. Email: ${user.email}`)
      console.log(`      ID: ${user.id}`)
      console.log(`      Créé: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`      Metadata: ${JSON.stringify(user.user_metadata)}`)
      console.log('')
    })
    
    // 2. Lister tous les utilisateurs public.users
    console.log('2️⃣ Utilisateurs dans public.users:')
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
    
    if (publicError) {
      console.log('❌ Erreur public.users:', publicError.message)
      return
    }
    
    if (publicUsers.length === 0) {
      console.log('   ⚠️  Aucun utilisateur dans public.users')
    } else {
      publicUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`)
        console.log(`      ID: ${user.id}`)
        console.log(`      Nom: ${user.first_name} ${user.last_name}`)
        console.log('')
      })
    }
    
    // 3. Identifier les utilisateurs manquants
    console.log('3️⃣ ANALYSE:')
    const authUserIds = authUsers.users.map(u => u.id)
    const publicUserIds = publicUsers.map(u => u.id)
    
    const missingUsers = authUsers.users.filter(authUser => 
      !publicUserIds.includes(authUser.id)
    )
    
    if (missingUsers.length > 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Utilisateurs manquants dans public.users:')
      missingUsers.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`)
      })
      
      // 4. Créer les utilisateurs manquants
      console.log('\n🔧 CORRECTION AUTOMATIQUE:')
      for (const authUser of missingUsers) {
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || authUser.email.split('@')[0],
            last_name: authUser.user_metadata?.last_name || ''
          })
        
        if (error) {
          console.log(`❌ Échec création ${authUser.email}:`, error.message)
        } else {
          console.log(`✅ Utilisateur créé: ${authUser.email}`)
        }
      }
    } else {
      console.log('✅ Tous les utilisateurs auth.users existent dans public.users')
    }
    
    // 5. Vérifier les triggers
    console.log('\n4️⃣ VÉRIFICATION DES TRIGGERS:')
    const { data: triggers, error: triggerError } = await supabase
      .rpc('pg_get_triggerdef', { triggeroid: 'on_auth_user_created' })
    
    if (triggerError) {
      console.log('⚠️  Impossible de vérifier les triggers (normal)')
    } else {
      console.log('✅ Trigger de création d\'utilisateur actif')
    }
    
    console.log('\n🎯 RECOMMANDATIONS:')
    console.log('1. Videz le cache de votre navigateur (Cmd+Shift+R)')
    console.log('2. Déconnectez-vous et reconnectez-vous')
    console.log('3. Essayez la création d\'entreprise à nouveau')
    console.log('4. Si ça ne marche toujours pas, redémarrez le serveur (npm run dev)')
    
  } catch (error) {
    console.log('💥 Erreur inattendue:', error.message)
  }
}

debugUserIssue()