import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Assure que l'utilisateur courant possède une entrée OWNER dans company_members
// pour chacune de ses entreprises (companies.user_id = auth.uid()).
// Renvoie l'état avant/après.
export async function GET(_req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Entreprises possédées
  const { data: ownedCompanies, error: cErr } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500 })
  }

  const companyIds = (ownedCompanies || []).map(c => c.id)

  // État avant
  const { data: beforeMembers } = await supabase
    .from('company_members')
    .select('company_id, user_id, role, status')
    .in('company_id', companyIds)
    .eq('user_id', user.id)

  // Backfill pour les manquants
  for (const companyId of companyIds) {
    const already = beforeMembers?.some(m => m.company_id === companyId)
    if (!already) {
      await supabase
        .from('company_members')
        .insert({ company_id: companyId, user_id: user.id, role: 'OWNER', status: 'ACTIVE' })
    }
  }

  // État après
  const { data: afterMembers, error: aErr } = await supabase
    .from('company_members')
    .select('company_id, user_id, role, status')
    .in('company_id', companyIds)
    .eq('user_id', user.id)

  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    ownedCompanies: companyIds,
    before: beforeMembers || [],
    after: afterMembers || [],
  })
}



