import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // Rate limit basique
    const ip = request.headers.get('x-forwarded-for') || 'local'
    if (!rateLimit(`invitations:GET:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

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
          company: inv.companies
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