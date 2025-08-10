import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🔍 API debug share-company appelée')
  
  try {
    const supabase = await createServerClient()
    
    // 1. Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 Authentification:', { 
      hasUser: !!user, 
      userId: user?.id, 
      email: user?.email,
      error: authError?.message 
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Non authentifié',
        authError: authError?.message 
      }, { status: 401 })
    }

    // 2. Vérifier les entreprises de l'utilisateur
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, user_id')
      .eq('user_id', user.id)

    console.log('🏢 Entreprises:', { 
      count: companies?.length || 0,
      error: companiesError?.message,
      companies: companies?.map(c => ({ id: c.id, name: c.company_name }))
    })

    // 3. Vérifier les membres des entreprises
    if (companies && companies.length > 0) {
      const companyId = companies[0].id
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select('user_id, role, status')
        .eq('company_id', companyId)

      console.log('👥 Membres entreprise:', { 
        companyId,
        count: members?.length || 0,
        error: membersError?.message,
        members: members?.map(m => ({ userId: m.user_id, role: m.role, status: m.status }))
      })
    }

    // 4. Tester les permissions sur la table invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('id, company_id, invited_email')
      .limit(1)

    console.log('📨 Permissions invitations:', { 
      hasAccess: !invitationsError,
      error: invitationsError?.message,
      count: invitations?.length || 0
    })

    // 5. Tester l'insertion d'une invitation (sans réellement l'insérer)
    const testData = {
      company_id: companies?.[0]?.id || '00000000-0000-0000-0000-000000000000',
      invited_email: 'test@example.com',
      invited_by: user.id,
      invitation_token: 'test-token-debug',
      role_requested: 'VIEWER',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    console.log('🧪 Test insertion:', testData)

    // 6. Vérifier les politiques RLS actives
    let policies = null
    let policiesError = null
    
    try {
      const { data, error } = await supabase
        .rpc('get_rls_policies', { table_name: 'invitations' })
      policies = data
      policiesError = error
    } catch (error) {
      policiesError = { message: 'Fonction RPC non disponible' }
    }

    console.log('📋 Politiques RLS:', { 
      policies: policies || 'Non disponible',
      error: policiesError?.message 
    })

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email
        },
        companies: companies || [],
        companiesError: companiesError?.message,
        invitationsAccess: !invitationsError,
        invitationsError: invitationsError?.message,
        testData,
        policies: policies || 'Non disponible'
      }
    })

  } catch (error) {
    console.error('💥 Erreur debug:', error)
    return NextResponse.json(
      { error: 'Erreur debug', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
