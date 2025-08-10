import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateInvitationToken } from '@/lib/utils/tokens'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const bodySchema = z.object({
  companyId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['VIEWER','MEMBER','ADMIN']).default('VIEWER'),
  message: z.string().max(1000).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  console.log('📨 API share-company appelée')
  
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local'
    if (!rateLimit(`share-company:POST:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const supabase = await createServerClient()
    let { data: { user } } = await supabase.auth.getUser()
    
    // Fallback: Authorization: Bearer <token>
    if (!user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const userClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
          )
          ;(supabase as any).__userClient = userClient
          const { data: got } = await userClient.auth.getUser()
          user = got.user
        } catch (e) {
          console.error('Erreur fallback auth:', e)
        }
      }
    }
    
    if (!user) {
      console.error('❌ Utilisateur non authentifié')
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les données de la requête
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      console.error('❌ Données invalides:', parsed.error)
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    
    const { companyId, email, message, role, firstName, lastName, department } = parsed.data

    // Interdire l'auto-invitation
    if (email.toLowerCase() === (user.email || '').toLowerCase()) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous auto-inviter' }, { status: 400 })
    }
    
    console.log('📋 Données reçues:', { companyId, email, role, firstName, lastName, department })

    // Vérifier que l'utilisateur possède l'entreprise
    const db = (supabase as any).__userClient || supabase
    const { data: company, error: companyError } = await db
      .from('companies')
      .select('id, company_name')
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
    console.log('🔑 Token généré:', invitationToken)
    
    // Créer l'invitation
    const invitationData = {
      company_id: companyId,
      invited_email: email,
      invited_by: user.id,
      invitation_token: invitationToken,
      role_requested: role,
      first_name: firstName || null,
      last_name: lastName || null,
      department: department || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    console.log('📝 Données invitation:', invitationData)
    
    const { data: invitation, error: invitationError } = await db
      .from('invitations')
      .insert(invitationData)
      .select('id, invited_email, expires_at')
      .single()

    if (invitationError) {
      console.error('❌ Erreur création invitation:', invitationError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'invitation', details: invitationError.message },
        { status: 500 }
      )
    }

    console.log('✅ Invitation créée:', invitation)

    // Tentative d'envoi d'email (optionnel)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const invitationLink = `${baseUrl}/invitation/${invitation.invitation_token}`

        const { buildInvitationEmailHtml, buildInvitationEmailText } = await import('@/lib/email/templates/invitation')
        const mailOptions = {
          from: process.env.FROM_EMAIL || 'noreply@fiich-app.com',
          to: email,
          subject: `Invitation à consulter ${company.company_name}`,
          html: buildInvitationEmailHtml(company.company_name, invitationLink, message),
          text: buildInvitationEmailText(company.company_name, invitationLink, message),
        }

        await transporter.sendMail(mailOptions)
        console.log('📧 Email envoyé avec succès')
      } else {
        console.log('📧 SMTP non configuré, email non envoyé')
      }
    } catch (emailError) {
      console.log('⚠️ Erreur email (non bloquant):', emailError)
      // L'erreur d'email ne doit pas faire échouer l'invitation
    }

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
    console.error('💥 Erreur générale:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 