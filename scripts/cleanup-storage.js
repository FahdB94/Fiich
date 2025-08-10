// 🗂️ Script de Nettoyage du Storage Supabase
// Ce script supprime tous les fichiers du storage et recrée les buckets

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupStorage() {
  console.log('🧹 Début du nettoyage du storage Supabase...')
  
  try {
    // 1. Lister tous les buckets existants
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      throw new Error(`Erreur lors de la récupération des buckets: ${bucketsError.message}`)
    }
    
    console.log(`📦 Buckets trouvés: ${buckets.length}`)
    
    // 2. Supprimer tous les buckets existants
    for (const bucket of buckets) {
      console.log(`🗑️ Suppression du bucket: ${bucket.name}`)
      
      // Supprimer tous les fichiers du bucket
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 1000 })
      
      if (filesError) {
        console.warn(`⚠️ Erreur lors de la liste des fichiers du bucket ${bucket.name}: ${filesError.message}`)
        continue
      }
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => file.name)
        console.log(`📁 Suppression de ${filePaths.length} fichiers du bucket ${bucket.name}`)
        
        const { error: deleteError } = await supabase.storage
          .from(bucket.name)
          .remove(filePaths)
        
        if (deleteError) {
          console.warn(`⚠️ Erreur lors de la suppression des fichiers du bucket ${bucket.name}: ${deleteError.message}`)
        }
      }
      
      // Supprimer le bucket
      const { error: bucketDeleteError } = await supabase.storage.deleteBucket(bucket.name)
      
      if (bucketDeleteError) {
        console.warn(`⚠️ Erreur lors de la suppression du bucket ${bucket.name}: ${bucketDeleteError.message}`)
      } else {
        console.log(`✅ Bucket ${bucket.name} supprimé avec succès`)
      }
    }
    
    // 3. Créer les nouveaux buckets avec la bonne configuration
    const newBuckets = [
      {
        name: 'company-logos',
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      },
      {
        name: 'documents',
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/webp'
        ],
        fileSizeLimit: 52428800 // 50MB
      },
      {
        name: 'user-avatars',
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 2097152 // 2MB
      }
    ]
    
    console.log('🏗️ Création des nouveaux buckets...')
    
    for (const bucketConfig of newBuckets) {
      console.log(`📦 Création du bucket: ${bucketConfig.name}`)
      
      const { error: createError } = await supabase.storage.createBucket(bucketConfig.name, {
        public: bucketConfig.public,
        allowedMimeTypes: bucketConfig.allowedMimeTypes,
        fileSizeLimit: bucketConfig.fileSizeLimit
      })
      
      if (createError) {
        console.error(`❌ Erreur lors de la création du bucket ${bucketConfig.name}: ${createError.message}`)
      } else {
        console.log(`✅ Bucket ${bucketConfig.name} créé avec succès`)
      }
    }
    
    // 4. Vérifier la création des buckets
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets()
    
    if (finalError) {
      throw new Error(`Erreur lors de la vérification finale: ${finalError.message}`)
    }
    
    console.log('\n🎉 Nettoyage du storage terminé avec succès !')
    console.log(`📦 Buckets créés: ${finalBuckets.length}`)
    
    finalBuckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du storage:', error.message)
    process.exit(1)
  }
}

// Exécuter le nettoyage
cleanupStorage()
