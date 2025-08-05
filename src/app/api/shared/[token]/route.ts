import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: shareToken } = await params

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Token de partage requis' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Utiliser la fonction SQL pour récupérer l'entreprise partagée
    const { data: sharedData, error: shareError } = await supabase
      .rpc('get_shared_company', { token_param: shareToken })

    if (shareError) {
      console.error('Erreur lors de la récupération du partage:', shareError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du partage' },
        { status: 500 }
      )
    }

    if (!sharedData || sharedData.length === 0) {
      return NextResponse.json(
        { error: 'Partage non trouvé ou expiré' },
        { status: 404 }
      )
    }

    const share = sharedData[0]

    // Récupérer les détails complets de l'entreprise
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', share.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les documents publics si l'utilisateur a la permission
    let documents = []
    if (share.permissions && share.permissions.includes('view_documents')) {
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', share.company_id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (!docsError && docsData) {
        documents = docsData
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        share: {
          id: share.id,
          shared_with_email: share.shared_with_email,
          permissions: share.permissions,
          expires_at: share.expires_at,
          created_at: share.created_at
        },
        company: {
          id: company.id,
          company_name: company.company_name,
          email: company.email,
          phone: company.phone,
          website: company.website,
          description: company.description,
          address_line_1: company.address_line_1,
          address_line_2: company.address_line_2,
          postal_code: company.postal_code,
          city: company.city,
          country: company.country,
          siren: company.siren,
          siret: company.siret,
          logo_url: company.logo_url,
          created_at: company.created_at
        },
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          file_path: doc.file_path,
          file_size: doc.file_size,
          mime_type: doc.mime_type,
          created_at: doc.created_at
        }))
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entreprise partagée:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}