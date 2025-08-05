import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateInvitationToken } from '@/lib/utils/tokens'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  console.log('📨 API share-company appelée')
  
  try {
    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Auth header:', authHeader ? 'Présent' : 'Manquant')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token d\'authentification manquant')
      return NextResponse.json(
        { error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServiceClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log('👤 Authentification:', { hasUser: !!user, error: authError?.message })
    
    if (authError || !user) {
      console.error('❌ Erreur d\'authentification:', authError)
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const { companyId, email, message } = await request.json()
    console.log('📋 Données reçues:', { companyId, email, message })

    if (!companyId || !email) {
      console.error('❌ Données manquantes:', { companyId, email })
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur possède l'entreprise
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('user_id', user.id)
      .single()

    console.log('🏢 Vérification entreprise:', { 
      hasCompany: !!company, 
      error: companyError?.message,
      companyId,
      userId: user.id 
    })

    if (companyError || !company) {
      console.error('❌ Entreprise non trouvée:', companyError)
      return NextResponse.json(
        { error: 'Entreprise non trouvée ou vous n\'avez pas les droits pour la partager' },
        { status: 404 }
      )
    }

    // Générer un token d'invitation
    const invitationToken = generateInvitationToken()
    
    // Créer l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        company_id: companyId,
        invited_email: email,
        invited_by: user.id,
        invitation_token: invitationToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Erreur lors de la création de l\'invitation:', invitationError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'invitation' },
        { status: 500 }
      )
    }

    // Configuration SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    // Construire le lien d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/invitation/${invitation.invitation_token}`

    // Envoyer l'email
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@fiich-app.com',
      to: email,
      subject: `Invitation à consulter ${company.company_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invitation de partage</h2>
          <p>Bonjour,</p>
          <p>Vous avez été invité(e) à consulter les informations de l'entreprise <strong>${company.company_name}</strong>.</p>
          ${message ? `<p><strong>Message de l'expéditeur :</strong><br>${message}</p>` : ''}
          <p>Pour accepter cette invitation, cliquez sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accepter l'invitation
            </a>
          </div>
          <p>Ce lien expirera le ${new Date(invitation.expires_at).toLocaleDateString('fr-FR')}.</p>
          <p>Si vous ne pouvez pas cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; color: #666;">${invitationLink}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé automatiquement. Ne répondez pas à cet email.
          </p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: 'Invitation envoyée avec succès',
      invitation: {
        id: invitation.id,
        email: invitation.invited_email,
        expires_at: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('Erreur lors du partage:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 