import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServiceClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les invitations envoyées par l'utilisateur
    const { data: sentInvitations, error: sentError } = await supabase
      .from('invitations')
      .select(`
        *,
        companies:company_id (
          id,
          company_name
        )
      `)
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false })

    if (sentError) {
      console.error('Erreur lors de la récupération des invitations envoyées:', sentError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des invitations' },
        { status: 500 }
      )
    }

    // Récupérer les invitations reçues par l'utilisateur
    const { data: receivedInvitations, error: receivedError } = await supabase
      .from('invitations')
      .select(`
        *,
        companies:company_id (
          id,
          company_name
        ),
        invited_by_user:invited_by (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('invited_email', user.email)
      .order('created_at', { ascending: false })

    if (receivedError) {
      console.error('Erreur lors de la récupération des invitations reçues:', receivedError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        sent: sentInvitations?.map(inv => ({
          id: inv.id,
          invited_email: inv.invited_email,
          status: inv.status,
          expires_at: inv.expires_at,
          created_at: inv.created_at,
          company: inv.companies
        })) || [],
        received: receivedInvitations?.map(inv => ({
          id: inv.id,
          invitation_token: inv.invitation_token,
          status: inv.status,
          expires_at: inv.expires_at,
          created_at: inv.created_at,
          company: inv.companies,
          invited_by: inv.invited_by_user
        })) || []
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des invitations:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}