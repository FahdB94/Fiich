import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateShareToken } from '@/lib/utils/tokens'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const bodySchema = z.object({
  invitationToken: z.string().min(10),
  userEmail: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local'
    if (!rateLimit(`invitations:ACCEPT:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }
    const { invitationToken, userEmail } = parsed.data

    if (!invitationToken || !userEmail) {
      return NextResponse.json(
        { error: 'Token d\'invitation et email requis' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Appel RPC atomique
    const { data: result, error: rpcError } = await supabase
      .rpc('accept_invitation', { p_token: invitationToken, p_email: (user.email ?? userEmail) })

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation acceptée avec succès',
      data: {
        result
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