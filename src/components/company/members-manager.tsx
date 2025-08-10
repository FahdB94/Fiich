'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog'
import { Users, Shield, UserMinus, Send, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

type MemberRole = 'OWNER'|'ADMIN'|'MEMBER'|'VIEWER'
type MemberStatus = 'ACTIVE'|'PENDING'

type Member = {
  user_id: string
  email?: string
  role: MemberRole
  status: MemberStatus
}

type PendingInvitation = {
  id: string
  invited_email: string
  role_requested: 'OWNER'|'ADMIN'|'MEMBER'|'VIEWER' | null
  expires_at: string
}

const RoleBadge = ({ role }: { role: MemberRole }) => {
  const styleMap: Record<MemberRole, string> = {
    OWNER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    MEMBER: 'bg-green-100 text-green-800',
    VIEWER: 'bg-gray-100 text-gray-800',
  }
  const labelMap: Record<MemberRole, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Admin',
    MEMBER: 'Membre',
    VIEWER: 'Lecteur',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded ${styleMap[role]}`}>{labelMap[role]}</span>
}

const StatusBadge = ({ status }: { status: MemberStatus }) => {
  const style: Record<MemberStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
  }
  const label: Record<MemberStatus, string> = {
    ACTIVE: 'Actif',
    PENDING: 'En attente',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded ${style[status]}`}>{label[status]}</span>
}

export function MembersManager({ companyId }: { companyId: string }) {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'VIEWER'|'MEMBER'|'ADMIN'>('VIEWER')
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<{open: boolean; member?: Member}>({open:false})
  const firstNameRef = { current: '' }
  const lastNameRef = { current: '' }
  const departmentRef = { current: '' }

  const isOwner = useMemo(() => !!ownerUserId, [ownerUserId])

  const load = async () => {
    try {
      setLoading(true)
      const [companyRes, membersRes, invitesRes] = await Promise.all([
        supabase.from('companies').select('user_id').eq('id', companyId).single(),
        supabase.rpc('get_company_members', { p_company_id: companyId }),
        supabase.from('invitations').select('id, invited_email, role_requested, expires_at').eq('company_id', companyId).eq('status','pending')
      ])
      setOwnerUserId(companyRes.data?.user_id ?? null)
      const list = (membersRes.data as any[] || []).map((m) => ({ user_id: m.user_id, role: m.role, status: m.status, email: m.email } as any))
      // Fallback: si OWNER pas présent dans la liste, l'ajouter en local (affichage) avec l'email courant
      const ownerId = companyRes.data?.user_id
      const hasOwner = ownerId && list.some(m => m.user_id === ownerId)
      const enriched = !hasOwner && ownerId
        ? [...list, { user_id: ownerId, email: user?.email, role: 'OWNER', status: 'ACTIVE' } as Member]
        : list
      setMembers(enriched)
      setPending(invitesRes.data || [])
    } catch (e: any) {
      toast.error(e.message || 'Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (companyId) load() }, [companyId])

  const onInvite = async () => {
    try {
      if (!inviteEmail) return
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/share-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId, 
          email: inviteEmail, 
          role: inviteRole,
          firstName: firstNameRef.current || undefined,
          lastName: lastNameRef.current || undefined,
          department: departmentRef.current || undefined,
        }),
        // Passe le token d'accès pour l'auth serveur si les cookies ne sont pas dispo
        ...(session?.access_token ? { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` } } : {})
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Erreur envoi invitation')
      }
      toast.success('Invitation envoyée')
      setInviteEmail('')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Erreur envoi')
    }
  }

  const onResend = async (inv: PendingInvitation) => {
    try {
      const res = await fetch('/api/share-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, email: inv.invited_email, role: (inv.role_requested ?? 'VIEWER') })
      })
      if (!res.ok) throw new Error('Erreur renvoi')
      toast.success('Invitation renvoyée')
    } catch (e:any) {
      toast.error(e.message || 'Erreur renvoi')
    }
  }

  const onRevoke = async (inv: PendingInvitation) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', inv.id)
      if (error) throw error
      toast.success('Invitation révoquée')
      load()
    } catch (e:any) {
      toast.error(e.message || 'Erreur révocation')
    }
  }

  const onChangeRole = async (member: Member, role: Exclude<MemberRole, 'OWNER'>) => {
    try {
      if (!isOwner) {
        toast.error("Seul le propriétaire peut modifier les rôles")
        return
      }
      if (member.user_id === ownerUserId) {
        toast.error("Impossible de modifier le rôle du propriétaire")
        return
      }
      const { error } = await supabase
        .from('company_members')
        .update({ role })
        .eq('company_id', companyId)
        .eq('user_id', member.user_id)
      if (error) throw error
      toast.success('Rôle mis à jour')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Erreur mise à jour rôle')
    }
  }

  const onRemove = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('company_id', companyId)
        .eq('user_id', member.user_id)
      if (error) throw error
      toast.success('Membre retiré')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Erreur retrait membre')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Inviter un membre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs mb-1 block">Email</label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@domaine.com" />
            </div>
            <div>
              <label className="text-xs mb-1 block">Prénom</label>
              <Input placeholder="Prénom" id="firstName" onChange={(e) => (e as any).target && (firstNameRef.current = (e.target as HTMLInputElement).value)} />
            </div>
            <div>
              <label className="text-xs mb-1 block">Nom</label>
              <Input placeholder="Nom" id="lastName" onChange={(e) => (e as any).target && (lastNameRef.current = (e.target as HTMLInputElement).value)} />
            </div>
            <div>
              <label className="text-xs mb-1 block">Rôle</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5">
              <label className="text-xs mb-1 block">Service / Département</label>
              <Input placeholder="Ex: Finance, Marketing" id="department" onChange={(e) => (e as any).target && (departmentRef.current = (e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button onClick={onInvite} className="btn-modern">Envoyer l'invitation</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Membres actifs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun membre pour le moment</div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const isSelf = user?.id === m.user_id
                  const title = isSelf ? 'Vous' : (m.email || 'Utilisateur')
                  const shortId = `${m.user_id.slice(0,8)}…${m.user_id.slice(-4)}`
                  const canManage = isOwner && m.user_id !== ownerUserId
                  return (
                    <div key={m.user_id} className="flex items-center justify-between rounded-md border p-3 shadow-modern">
                      <div>
                        <div className="text-sm font-medium break-all flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs">
                            {(m.email || m.user_id).slice(0,2).toUpperCase()}
                          </span>
                          <span>{title}</span>
                          <RoleBadge role={m.role} />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                          <StatusBadge status={m.status} />
                          <span className="opacity-60">•</span>
                          <span className="font-mono text-[10px]" title={m.user_id}>{shortId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.role !== 'OWNER' && (
                          <Select
                            value={m.role}
                            onValueChange={(v) => onChangeRole(m, v as any)}
                            disabled={!canManage}
                          >
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VIEWER">Lecteur</SelectItem>
                              <SelectItem value="MEMBER">Membre</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {m.role !== 'OWNER' && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setConfirmRemove({open:true, member:m})}
                            disabled={!canManage}
                            title="Retirer le membre"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Invitations en attente</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune invitation en attente</div>
            ) : (
              <div className="space-y-2">
                {pending.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="text-sm font-medium break-all flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                          {inv.invited_email[0]?.toUpperCase()}
                        </span>
                        {inv.invited_email}
                        <Badge variant="secondary" className="text-[10px]">{inv.role_requested || 'VIEWER'}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onResend(inv)}>
                        <Send className="h-4 w-4 mr-1" /> Renvoyer
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onRevoke(inv)}>
                        <XCircle className="h-4 w-4 mr-1" /> Révoquer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmRemove.open} onOpenChange={(open) => setConfirmRemove({open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le membre perdra l'accès à la fiche et aux documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(confirmRemove.member) onRemove(confirmRemove.member); }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


