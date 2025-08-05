#!/usr/bin/env node

/**
 * Script de validation du fichier .env.local
 * Vérifie la validité des clés Supabase
 */

const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 VALIDATION DU FICHIER .env.local\n')

async function main() {
  try {
    console.log('============================================================')
    console.log('📄 1. LECTURE DU FICHIER .env.local')
    console.log('============================================================')
    
    const envContent = fs.readFileSync('.env.local', 'utf8')
    console.log('✅ Fichier .env.local lu avec succès')
    console.log(`📊 Taille: ${envContent.length} caractères`)
    console.log(`📊 Lignes: ${envContent.split('\n').length}`)
    
    // Afficher le contenu avec numéros de ligne
    const lines = envContent.split('\n')
    console.log('\n📋 CONTENU ACTUEL :')
    lines.forEach((line, index) => {
      const lineNum = (index + 1).toString().padStart(2, ' ')
      if (line.trim()) {
        if (line.includes('KEY=')) {
          const [key, value] = line.split('=', 2)
          console.log(`${lineNum}: ${key}=${value ? value.substring(0, 20) + '...' : 'VIDE'}`)
        } else {
          console.log(`${lineNum}: ${line}`)
        }
      } else {
        console.log(`${lineNum}: [LIGNE VIDE]`)
      }
    })

    console.log('\n============================================================')
    console.log('🔑 2. VALIDATION DES CLÉS SUPABASE')
    console.log('============================================================')
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    let allVarsValid = true
    
    for (const varName of requiredVars) {
      const value = process.env[varName]
      if (!value) {
        console.log(`❌ ${varName}: MANQUANTE`)
        allVarsValid = false
      } else if (value.trim() !== value) {
        console.log(`⚠️  ${varName}: Contient des espaces en début/fin`)
        allVarsValid = false
      } else if (varName.includes('KEY') && value.length < 100) {
        console.log(`⚠️  ${varName}: Trop courte (${value.length} caractères)`)
        allVarsValid = false
      } else {
        console.log(`✅ ${varName}: OK (${value.length} caractères)`)
      }
    }

    if (!allVarsValid) {
      console.log('\n❌ PROBLÈMES DÉTECTÉS DANS LE FICHIER .env.local')
      return
    }

    console.log('\n============================================================')
    console.log('🧪 3. TEST DE CONNEXION AVEC LES CLÉS')
    console.log('============================================================')
    
    // Test de décodage des JWT
    console.log('🔍 Validation des tokens JWT...')
    
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    try {
      // Décoder les JWT pour vérifier leur validité
      const anonDecoded = JSON.parse(atob(anonKey.split('.')[1]))
      const serviceDecoded = JSON.parse(atob(serviceKey.split('.')[1]))
      
      console.log(`✅ Token anon - Rôle: ${anonDecoded.role}, Expire: ${new Date(anonDecoded.exp * 1000).toLocaleString()}`)
      console.log(`✅ Token service - Rôle: ${serviceDecoded.role}, Expire: ${new Date(serviceDecoded.exp * 1000).toLocaleString()}`)
      
      // Vérifier l'expiration
      const now = Math.floor(Date.now() / 1000)
      if (anonDecoded.exp < now) {
        console.log('❌ Token anonyme EXPIRÉ !')
        allVarsValid = false
      }
      if (serviceDecoded.exp < now) {
        console.log('❌ Token service EXPIRÉ !')
        allVarsValid = false
      }
      
    } catch (err) {
      console.log(`❌ Erreur décodage JWT: ${err.message}`)
      allVarsValid = false
    }

    // Test de connexion réelle
    console.log('\n🔗 Test de connexion Supabase...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    const { data, error } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Erreur connexion: ${error.message}`)
      console.log(`📊 Code: ${error.code}`)
      console.log(`💡 Hint: ${error.hint}`)
      allVarsValid = false
    } else {
      console.log('✅ Connexion Supabase réussie !')
    }

    console.log('\n============================================================')
    console.log('📋 4. RÉSUMÉ ET RECOMMANDATIONS')
    console.log('============================================================')
    
    if (allVarsValid) {
      console.log('🎉 Votre fichier .env.local est VALIDE !')
      console.log('✅ Toutes les clés fonctionnent correctement')
      console.log('🚀 Le problème vient probablement d\'ailleurs')
    } else {
      console.log('❌ Votre fichier .env.local a des PROBLÈMES')
      console.log('')
      console.log('🔧 SOLUTIONS POSSIBLES :')
      console.log('1. Vérifiez vos clés dans le dashboard Supabase')
      console.log('2. Régénérez les clés si nécessaire')
      console.log('3. Supprimez les espaces en début/fin de ligne')
      console.log('4. Vérifiez qu\'il n\'y a pas de lignes vides au milieu')
      console.log('')
      console.log('🌐 Dashboard Supabase : https://supabase.com/dashboard')
    }

  } catch (error) {
    console.error('❌ Erreur validation:', error.message)
    process.exit(1)
  }
}

main()