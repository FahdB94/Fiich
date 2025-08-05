'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LogoUploadProps {
  currentLogoUrl?: string
  onLogoChange: (file: File | null) => void
  onLogoRemove: () => void
  disabled?: boolean
}

export function LogoUpload({ 
  currentLogoUrl, 
  onLogoChange, 
  onLogoRemove, 
  disabled = false 
}: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image valide')
      return
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La taille du fichier ne doit pas dépasser 5MB')
      return
    }

    // Créer l'URL de prévisualisation
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onLogoChange(file)
  }

  const handleRemoveLogo = () => {
    setPreviewUrl(null)
    onLogoChange(null)
    onLogoRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const input = fileInputRef.current
      if (input) {
        input.files = event.dataTransfer.files
        handleFileSelect({ target: { files: event.dataTransfer.files } } as any)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <div className="space-y-4">
      <Label>Logo de l'entreprise</Label>
      
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          {previewUrl ? (
            // Affichage du logo sélectionné
            <div className="relative group">
              <div className="flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Logo de l'entreprise"
                  className="max-h-32 max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
              
              {/* Bouton de suppression */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveLogo}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                Cliquez sur le logo pour le modifier
              </p>
            </div>
          ) : (
            // Zone de drop/upload
            <div
              className="text-center cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {disabled ? 'Logo non modifiable' : 'Cliquez ou glissez-déposez votre logo'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF jusqu'à 5MB
                  </p>
                </div>
                
                {!disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploading ? 'Upload en cours...' : 'Sélectionner un fichier'}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </CardContent>
      </Card>
      
      {currentLogoUrl && !previewUrl && (
        <div className="text-xs text-muted-foreground">
          Logo actuel conservé
        </div>
      )}
    </div>
  )
} 