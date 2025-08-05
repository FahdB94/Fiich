import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServiceClient()
    const { id: companyId } = await params

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID de l\'entreprise requis' },
        { status: 400 }
      )
    }

    // Récupérer l'entreprise
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entreprise:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
