#!/usr/bin/env node

/**
 * Script DIRECT pour corriger les permissions RLS
 * Exécute chaque requête individuellement
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🎯 CORRECTION DIRECTE DES PERMISSIONS RLS\n')

async function main() {
  try {
    // Créer le client Supabase avec service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('✅ Connexion Supabase établie\n')

    // Liste des corrections à appliquer
    const corrections = [
      {
        name: '1. Supprimer politique documents partagés',
        sql: 'DROP POLICY IF EXISTS "users_can_view_shared_documents" ON public.documents;'
      },
      {
        name: '2. Créer nouvelle politique documents partagés',
        sql: `CREATE POLICY "users_can_view_shared_documents"
              ON public.documents FOR SELECT
              USING (
                  documents.is_public = true
                  AND EXISTS (
                      SELECT 1 FROM public.company_shares cs
                      JOIN public.users u ON u.id = auth.uid()
                      WHERE cs.company_id = documents.company_id
                      AND cs.shared_with_email = u.email
                      AND cs.is_active = true
                      AND (cs.expires_at IS NULL OR cs.expires_at > now())
                      AND 'view_documents' = ANY(cs.permissions)
                  )
              );`
      },
      {
        name: '3. Supprimer politique invitations reçues',
        sql: 'DROP POLICY IF EXISTS "users_can_view_invitations_received" ON public.invitations;'
      },
      {
        name: '4. Créer nouvelle politique invitations reçues',
        sql: `CREATE POLICY "users_can_view_invitations_received"
              ON public.invitations FOR SELECT
              USING (
                  EXISTS (
                      SELECT 1 FROM public.users u
                      WHERE u.id = auth.uid()
                      AND invited_email = u.email
                  )
              );`
      },
      {
        name: '5. Supprimer politique mise à jour invitations',
        sql: 'DROP POLICY IF EXISTS "users_can_update_invitations" ON public.invitations;'
      },
      {
        name: '6. Créer nouvelle politique mise à jour invitations',
        sql: `CREATE POLICY "users_can_update_invitations"
              ON public.invitations FOR UPDATE
              USING (
                  invited_by = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.users u
                      WHERE u.id = auth.uid()
                      AND invited_email = u.email
                  )
              );`
      },
      {
        name: '7. Supprimer politique partages utilisateur',
        sql: 'DROP POLICY IF EXISTS "users_can_view_shares_for_them" ON public.company_shares;'
      },
      {
        name: '8. Créer nouvelle politique partages utilisateur',
        sql: `CREATE POLICY "users_can_view_shares_for_them"
              ON public.company_shares FOR SELECT
              USING (
                  EXISTS (
                      SELECT 1 FROM public.users u
                      WHERE u.id = auth.uid()
                      AND shared_with_email = u.email
                  )
              );`
      },
      {
        name: '9. Supprimer ancienne politique documents propres',
        sql: 'DROP POLICY IF EXISTS "users_can_view_own_documents" ON public.documents;'
      },
      {
        name: '10. Créer politique documents propres (sécurisée)',
        sql: `CREATE POLICY "users_can_view_own_documents"
              ON public.documents FOR SELECT
              USING (
                  EXISTS (
                      SELECT 1 FROM public.companies c
                      WHERE c.id = documents.company_id
                      AND c.user_id = auth.uid()
                  )
              );`
      }
    ]

    // Exécuter chaque correction
    for (const correction of corrections) {
      try {
        console.log(`⚡ ${correction.name}`)
        
        const { error } = await supabase.rpc('exec', { sql: correction.sql })
        
        if (error) {
          console.log(`⚠️  Avertissement: ${error.message}`)
        } else {
          console.log(`✅ Succès`)
        }
      } catch (err) {
        console.log(`⚠️  Erreur: ${err.message}`)
      }
      console.log('')
    }

    // Test final
    console.log('🧪 Test final des permissions...')
    
    const { data: testResult, error: testError } = await supabase
      .from('documents')
      .select('id, document_type, file_name')
      .limit(1)

    if (testError) {
      console.log(`❌ Test échoué: ${testError.message}`)
    } else {
      console.log(`✅ Test réussi ! ${testResult?.length || 0} document(s) accessible(s)`)
    }

    console.log('\n============================================================')
    console.log('🎉 CORRECTION TERMINÉE')
    console.log('============================================================')
    console.log('ℹ️  Redémarrez maintenant votre serveur: npm run dev')
    console.log('ℹ️  Puis testez: http://localhost:3000/companies/33d3c38f-4ec3-4aaf-8972-fbb1d79c549d')

  } catch (error) {
    console.error('❌ Erreur critique:', error.message)
    process.exit(1)
  }
}

main()