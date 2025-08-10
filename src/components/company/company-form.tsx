'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useCompanies } from '@/hooks/use-companies'
import { companySchema, CompanyFormData } from '@/lib/validations'
import { Company } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { CompanyDocumentUpload, PendingDocument } from '@/components/documents/company-document-upload'
import { LogoUpload } from '@/components/company/logo-upload'
import { SuccessModal } from '@/components/ui/success-modal'
import { useCompanyDocuments } from '@/hooks/use-company-documents'

interface CompanyFormProps {
  company?: Company
  mode: 'create' | 'edit'
}

export function CompanyForm({ company, mode }: CompanyFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([])
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { uploadCompanyDocuments } = useCompanyDocuments()
  const { user } = useAuth()
  const { createCompany, updateCompany, uploadLogo } = useCompanies(user?.id)
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: company ? {
      name: company.name,
      description: company.description || '',
      logo_url: company.logo_url || '',
      website: company.website || '',
      industry: company.industry || '',
      size: company.size || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email,
    } : {
      email: user?.email || '',
    },
  })

  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)

    try {
      // Préparer les données pour l'API
      const enrichedData = {
        ...data,
        owner_id: user?.id, // Ajouter l'ID de l'utilisateur connecté
        is_public: false, // Par défaut, l'entreprise n'est pas publique
      }

      let result
      
      if (mode === 'create') {
        result = await createCompany(enrichedData)
      } else if (company) {
        result = await updateCompany(company.id, enrichedData)
      }

      if (result?.error) {
        toast.error('Erreur: ' + result.error)
        return
      }

      // Upload du logo si sélectionné (sans afficher de message de succès)
      if (selectedLogo && result?.data) {
        console.log('📤 Upload du logo:', { fileName: selectedLogo.name, size: selectedLogo.size })
        const logoResult = await uploadLogo(result.data.id, selectedLogo)
        if (logoResult?.error) {
          console.error('❌ Erreur upload logo:', logoResult.error)
          toast.error('Erreur lors de l\'upload du logo: ' + logoResult.error)
        } else {
          console.log('✅ Logo uploadé avec succès:', logoResult.data?.logo_url)
          // Pas de toast de succès ici, le modal principal s'en charge
        }
      }

      // Si des documents sont en attente et que l'entreprise a été créée
      if (mode === 'create' && result?.data && pendingDocuments.length > 0) {
        // Uploader les documents après création de l'entreprise
        const uploadResult = await uploadCompanyDocuments(pendingDocuments, result.data.id)
        
        if (uploadResult.success) {
          toast.success(`${uploadResult.uploadedCount} document(s) uploadé(s) avec succès`)
        } else {
          toast.error(`${uploadResult.errors.length} erreur(s) lors de l'upload des documents`)
        }
      }

      // Si des documents sont en attente et que l'entreprise a été modifiée
      if (mode === 'edit' && result?.data && pendingDocuments.length > 0) {
        // Uploader les documents après modification de l'entreprise
        const uploadResult = await uploadCompanyDocuments(pendingDocuments, result.data.id)
        
        if (uploadResult.success) {
          toast.success(`${uploadResult.uploadedCount} document(s) uploadé(s) avec succès`)
        } else {
          toast.error(`${uploadResult.errors.length} erreur(s) lors de l'upload des documents`)
        }
      }

      // Préparer le message de succès
      let message = mode === 'create' 
        ? 'Votre entreprise a été créée avec succès !'
        : 'Votre fiche d\'entreprise a été mise à jour avec succès !'
      
      // Ajouter l'information sur le logo si un logo a été uploadé
      if (selectedLogo && result?.data) {
        message += ' Le logo a également été mis à jour.'
      }
      
      console.log('🎉 Succès - Affichage du modal:', { mode, message, showSuccessModal: true })
      setSuccessMessage(message)
      setShowSuccessModal(true)
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentsChange = (documents: PendingDocument[]) => {
    setPendingDocuments(documents)
  }

  const handleLogoChange = (file: File | null) => {
    setSelectedLogo(file)
  }

  const handleLogoRemove = () => {
    setSelectedLogo(null)
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    // Rediriger après fermeture du modal
    if (mode === 'create') {
      router.push('/companies')
    } else {
      router.push(`/companies/${company?.id}`)
    }
  }

  const handleSuccessModalAction = () => {
    setShowSuccessModal(false)
    // Rediriger vers la page de détail de l'entreprise
    if (mode === 'create') {
      router.push('/companies')
    } else {
      router.push(`/companies/${company?.id}`)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Créer une entreprise' : 'Modifier l\'entreprise'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Créez votre fiche d\'identité entreprise'
            : 'Modifiez les informations de votre entreprise'
          }
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations générales</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'entreprise *</Label>
              <Input
                id="name"
                placeholder="Nom de votre entreprise"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Logo de l'entreprise */}
            <LogoUpload
              currentLogoUrl={company?.logo_url}
              onLogoChange={handleLogoChange}
              onLogoRemove={handleLogoRemove}
              disabled={isLoading}
            />

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de votre entreprise"
                {...register('description')}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Secteur d'activité</Label>
                <Input
                  id="industry"
                  placeholder="Ex: Technologie, Commerce, Services..."
                  {...register('industry')}
                  disabled={isLoading}
                />
                {errors.industry && (
                  <p className="text-sm text-destructive">{errors.industry.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">Taille de l'entreprise</Label>
                <Input
                  id="size"
                  placeholder="Ex: 1-10, 11-50, 51-200..."
                  {...register('size')}
                  disabled={isLoading}
                />
                {errors.size && (
                  <p className="text-sm text-destructive">{errors.size.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact et localisation */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact et localisation</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                placeholder="123 Rue de la Paix, 75001 Paris"
                {...register('address')}
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+33 1 23 45 67 89"
                  {...register('phone')}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@entreprise.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.entreprise.com"
                {...register('website')}
                disabled={isLoading}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Documents</h3>
            <CompanyDocumentUpload
              companyId={company?.id}
              onDocumentsChange={handleDocumentsChange}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Annuler
          </Button>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Créer l\'entreprise' : 'Mettre à jour'}
          </Button>
        </CardFooter>
      </form>
      
      {/* Modal de succès */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={mode === 'create' ? 'Entreprise créée !' : 'Fiche mise à jour !'}
        message={successMessage}
        actionLabel={mode === 'create' ? 'Voir mes entreprises' : 'Voir la fiche'}
        onAction={handleSuccessModalAction}
        autoClose={true}
        autoCloseDelay={4000}
      />
    </Card>
  )
}