import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateShareToken } from '@/lib/utils/tokens'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const bodySchema = z.object({ companyId: z.string().uuid() })

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'local'
    if (!rateLimit(`share:POST:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Récupérer les données de la requête
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    const { companyId } = parsed.data

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID de l\'entreprise requis' },
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

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée ou vous n\'avez pas les droits pour la partager' },
        { status: 404 }
      )
    }

    // Créer ou récupérer un partage existant
    const { data: existingShare } = await supabase
      .from('company_shares')
      .select('*')
      .eq('company_id', companyId)
      .eq('shared_with_email', 'public')
      .single()

    let shareToken: string

    if (existingShare) {
      // Utiliser le partage existant
      shareToken = existingShare.share_token
    } else {
      // Générer un nouveau token
      shareToken = generateShareToken()
      
      // Créer un nouveau partage public
      const { data: newShare, error: shareError } = await supabase
        .from('company_shares')
        .insert({
          company_id: companyId,
          shared_with_email: 'public',
          share_token: shareToken,
          permissions: ['view_company', 'view_documents'],
          is_active: true
        })
        .select()
        .single()

      if (shareError) {
        console.error('Erreur lors de la création du partage:', shareError)
        return NextResponse.json(
          { error: 'Erreur lors de la création du lien de partage' },
          { status: 500 }
        )
      }
    }

    // Construire le lien de partage
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareLink = `${baseUrl}/shared/public/${shareToken}`

    return NextResponse.json({
      success: true,
      shareLink,
      shareToken,
      company: {
        id: company.id,
        name: company.company_name
      }
    })

  } catch (error) {
    console.error('Erreur lors de la génération du lien:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 