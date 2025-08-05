import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateShareToken } from '@/lib/utils/tokens'

export async function POST(request: NextRequest) {
  try {
    const { invitationToken, userEmail } = await request.json()

    if (!invitationToken || !userEmail) {
      return NextResponse.json(
        { error: 'Token d\'invitation et email requis' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Récupérer l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select(`
        *,
        companies:company_id (
          id,
          company_name,
          user_id
        )
      `)
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation non trouvée ou expirée' },
        { status: 404 }
      )
    }

    // Vérifier que l'invitation n'est pas expirée
    if (new Date(invitation.expires_at) < new Date()) {
      // Marquer l'invitation comme expirée
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Invitation expirée' },
        { status: 400 }
      )
    }

    // Vérifier que l'email correspond
    if (invitation.invited_email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Cette invitation n\'est pas pour cet email' },
        { status: 403 }
      )
    }

    // Marquer l'invitation comme acceptée
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Erreur lors de l\'acceptation de l\'invitation:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'acceptation de l\'invitation' },
        { status: 500 }
      )
    }

    // Créer un partage pour l'utilisateur invité
    const shareToken = generateShareToken()
    
    const { data: share, error: shareError } = await supabase
      .from('company_shares')
      .insert({
        company_id: invitation.company_id,
        shared_with_email: userEmail,
        share_token: shareToken,
        permissions: ['view_company', 'view_documents'],
        is_active: true
      })
      .select()
      .single()

    if (shareError) {
      console.error('Erreur lors de la création du partage:', shareError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du partage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation acceptée avec succès',
      data: {
        invitation: {
          id: invitation.id,
          company_name: invitation.companies?.company_name,
          status: 'accepted'
        },
        share: {
          id: share.id,
          share_token: shareToken
        }
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'acceptation de l\'invitation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}