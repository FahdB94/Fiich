'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Users, Mail, Crown, Shield, User, Eye, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from 'sonner'

interface CompanyMember {
  id: string
  user_id: string
  company_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'pending' | 'invited'
  created_at: string
  user?: {
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

interface CompanyMembersListProps {
  companyId: string
  userRole?: string
  onRefresh?: () => void
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
}

const roleColors = {
  owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
  member: 'bg-blue-100 text-blue-800 border-blue-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200',
}

const roleLabels = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
  viewer: 'Lecteur',
}

export function CompanyMembersList({ companyId, userRole, onRefresh }: CompanyMembersListProps) {
  const { user } = useAuth()
  const { canManageUsers } = usePermissions(userRole as any)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (companyId) {
      fetchMembers()
    }
  }, [companyId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      
      // Récupérer les membres de l'entreprise
      const { data, error } = await supabase
        .from('company_members')
        .select(`
          *,
          user:users(email, user_metadata)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur lors de la récupération des membres:', error)
        toast.error('Erreur lors de la récupération des membres')
        return
      }

      setMembers(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des membres:', error)
      toast.error('Erreur lors de la récupération des membres')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!canManageUsers) {
      toast.error('Vous n\'avez pas les permissions pour modifier les rôles')
      return
    }

    try {
      const { error } = await supabase
        .from('company_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) {
        console.error('Erreur lors de la modification du rôle:', error)
        toast.error('Erreur lors de la modification du rôle')
        return
      }

      toast.success('Rôle modifié avec succès')
      fetchMembers()
      onRefresh?.()
    } catch (error) {
      console.error('Erreur lors de la modification du rôle:', error)
      toast.error('Erreur lors de la modification du rôle')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!canManageUsers) {
      toast.error('Vous n\'avez pas les permissions pour supprimer des membres')
      return
    }

    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        console.error('Erreur lors de la suppression du membre:', error)
        toast.error('Erreur lors de la suppression du membre')
        return
      }

      toast.success('Membre supprimé avec succès')
      fetchMembers()
      onRefresh?.()
    } catch (error) {
      console.error('Erreur lors de la suppression du membre:', error)
      toast.error('Erreur lors de la suppression du membre')
    }
  }

  const getInitials = (email: string, fullName?: string) => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Membres de l'entreprise
        </CardTitle>
        <CardDescription>
          {members.length} membre{members.length > 1 ? 's' : ''} au total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member, index) => {
            const RoleIcon = roleIcons[member.role]
            const isCurrentUser = member.user_id === user?.id
            
            return (
              <div key={member.id}>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(member.user?.email || '', member.user?.user_metadata?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {member.user?.user_metadata?.full_name || member.user?.email}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`${roleColors[member.role]} border`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleLabels[member.role]}
                    </Badge>
                    
                    {canManageUsers && !isCurrentUser && (
                      <div className="flex items-center gap-1">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 bg-background"
                        >
                          <option value="viewer">Lecteur</option>
                          <option value="member">Membre</option>
                          <option value="admin">Administrateur</option>
                          <option value="owner">Propriétaire</option>
                        </select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Retirer
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {index < members.length - 1 && <Separator className="my-4" />}
              </div>
            )
          })}
        </div>

        {canManageUsers && (
          <div className="mt-6 pt-4 border-t">
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Inviter un nouveau membre
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
