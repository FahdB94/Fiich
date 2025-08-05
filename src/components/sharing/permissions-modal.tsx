'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Building, 
  FileText, 
  Users, 
  Settings,
  Eye,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface Permission {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

interface PermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  share: any
  onUpdatePermissions: (shareId: string, permissions: string[]) => Promise<boolean>
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    id: 'view_company',
    label: 'Voir les informations de l\'entreprise',
    description: 'Accès aux coordonnées, adresse, SIRET, etc.',
    icon: <Building className="h-4 w-4" />
  },
  {
    id: 'view_documents',
    label: 'Voir les documents',
    description: 'Accès à la liste et au téléchargement des documents',
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: 'download_documents',
    label: 'Télécharger les documents',
    description: 'Possibilité de télécharger les documents partagés',
    icon: <Download className="h-4 w-4" />
  },
  {
    id: 'view_team',
    label: 'Voir l\'équipe',
    description: 'Accès aux informations sur les membres de l\'équipe',
    icon: <Users className="h-4 w-4" />
  }
]

export function PermissionsModal({ isOpen, onClose, share, onUpdatePermissions }: PermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(share?.permissions || [])
  const [updating, setUpdating] = useState(false)

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSave = async () => {
    setUpdating(true)
    try {
      const success = await onUpdatePermissions(share.id, selectedPermissions)
      if (success) {
        toast.success('Permissions mises à jour avec succès')
        onClose()
      } else {
        toast.error('Erreur lors de la mise à jour des permissions')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des permissions')
    } finally {
      setUpdating(false)
    }
  }

  const handleClose = () => {
    setSelectedPermissions(share?.permissions || [])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Gérer les permissions d'accès</span>
          </DialogTitle>
          <DialogDescription>
            Configurez les accès pour {share?.shared_with_company_name || share?.shared_with_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du partage */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {share?.shared_with_company_logo ? (
                  <img
                    src={share.shared_with_company_logo}
                    alt={share.shared_with_company_name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{share?.shared_with_company_name}</h3>
                  <p className="text-sm text-muted-foreground">{share?.shared_with_company_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des permissions */}
          <div className="space-y-3">
            <h4 className="font-medium">Permissions disponibles</h4>
            {AVAILABLE_PERMISSIONS.map((permission) => (
              <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={permission.id}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                />
                <div className="flex-1">
                  <label htmlFor={permission.id} className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-primary">{permission.icon}</span>
                    <span className="font-medium">{permission.label}</span>
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">{permission.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions actuellement accordées */}
          {selectedPermissions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Permissions accordées</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPermissions.map((permissionId) => {
                  const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId)
                  return (
                    <Badge key={permissionId} variant="secondary" className="flex items-center space-x-1">
                      {permission?.icon}
                      <span>{permission?.label}</span>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updating}>
            {updating ? 'Mise à jour...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 