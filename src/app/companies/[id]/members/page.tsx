'use client'

import { useAuth } from '@/hooks/use-auth'
import { MainLayout } from '@/components/layout/main-layout'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Member = { user_id: string; role: 'OWNER'|'ADMIN'|'MEMBER'|'VIEWER'; status: 'ACTIVE'|'PENDING'; email?: string }

export default function MembersPage() {
  const { user } = useAuth()
  const params = useParams()
  const companyId = params.id as string
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'VIEWER'|'MEMBER'|'ADMIN'>('VIEWER')

  const load = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_members')
        .select('user_id, role, status')
        .eq('company_id', companyId)

      if (error) throw error

      setMembers(data as any)
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (companyId) load() }, [companyId])

  const onInvite = async () => {
    try {
      if (!inviteEmail) return
      const res = await fetch('/api/share-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, email: inviteEmail, role: inviteRole })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erreur envoi invitation')
      }
      toast.success('Invitation envoyée')
      setInviteEmail('')
    } catch (e: any) {
      toast.error(e.message || 'Erreur envoi')
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des membres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm mb-1 block">Email à inviter</label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@domaine.com" />
              </div>
              <div>
                <label className="text-sm mb-1 block">Rôle</label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={onInvite}>Inviter</Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun membre</p>
              ) : (
                members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between border rounded p-3">
                    <div className="text-sm">
                      <div className="font-medium">{m.user_id}</div>
                      <div className="text-muted-foreground">{m.status}</div>
                    </div>
                    <div className="text-sm font-medium">{m.role}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}



