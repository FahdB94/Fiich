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
import { Company, CompanyContactFormData } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { CompanyDocumentUpload, PendingDocument } from '@/components/documents/company-document-upload'
import { PaymentTermsInput } from '@/components/company/payment-terms-input'
import { ContactsSection } from '@/components/company/contacts-section'
import { RIBInput } from '@/components/company/rib-input'
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
  const [paymentTerms, setPaymentTerms] = useState<string[]>(company?.payment_terms || [])
  const [contacts, setContacts] = useState<CompanyContactFormData[]>([])
  const [rib, setRib] = useState(company?.rib || '')
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
      company_name: company.company_name,
      siren: company.siren || '',
      siret: company.siret || '',
      address_line_1: company.address_line_1,
      address_line_2: company.address_line_2 || '',
      postal_code: company.postal_code,
      city: company.city,
      country: company.country,
      phone: company.phone || '',
      email: company.email,
      website: company.website || '',
      description: company.description || '',
      ape_code: company.ape_code || '',
      vat_number: company.vat_number || '',
    } : {
      country: 'France',
    },
  })

  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)

    try {
      // Ajouter les nouvelles données au formulaire
      const enrichedData = {
        ...data,
        payment_terms: paymentTerms.length > 0 ? paymentTerms : undefined,
        contacts: contacts.length > 0 ? contacts : undefined,
        rib: rib || undefined,
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
              <Label htmlFor="company_name">Raison sociale *</Label>
              <Input
                id="company_name"
                placeholder="Nom de votre entreprise"
                {...register('company_name')}
                disabled={isLoading}
              />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name.message}</p>
              )}
            </div>

            {/* Logo de l'entreprise */}
            <LogoUpload
              currentLogoUrl={company?.logo_url}
              onLogoChange={handleLogoChange}
              onLogoRemove={handleLogoRemove}
              disabled={isLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siren">SIREN</Label>
                <Input
                  id="siren"
                  placeholder="123456789"
                  {...register('siren')}
                  disabled={isLoading}
                />
                {errors.siren && (
                  <p className="text-sm text-destructive">{errors.siren.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  placeholder="12345678901234"
                  {...register('siret')}
                  disabled={isLoading}
                />
                {errors.siret && (
                  <p className="text-sm text-destructive">{errors.siret.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adresse</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Adresse *</Label>
              <Input
                id="address_line_1"
                placeholder="123 Rue de la Paix"
                {...register('address_line_1')}
                disabled={isLoading}
              />
              {errors.address_line_1 && (
                <p className="text-sm text-destructive">{errors.address_line_1.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address_line_2">Complément d'adresse</Label>
              <Input
                id="address_line_2"
                placeholder="Appartement, suite, etc."
                {...register('address_line_2')}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal *</Label>
                <Input
                  id="postal_code"
                  placeholder="75001"
                  {...register('postal_code')}
                  disabled={isLoading}
                />
                {errors.postal_code && (
                  <p className="text-sm text-destructive">{errors.postal_code.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  {...register('city')}
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Pays *</Label>
                <Input
                  id="country"
                  placeholder="France"
                  {...register('country')}
                  disabled={isLoading}
                />
                {errors.country && (
                  <p className="text-sm text-destructive">{errors.country.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="01 23 45 67 89"
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
                placeholder="https://www.entreprise.com"
                {...register('website')}
                disabled={isLoading}
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>
          </div>

          {/* Informations légales et financières */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations légales et financières</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ape_code">Code APE</Label>
                <Input
                  id="ape_code"
                  placeholder="6201A"
                  {...register('ape_code')}
                  disabled={isLoading}
                />
                {errors.ape_code && (
                  <p className="text-sm text-destructive">{errors.ape_code.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vat_number">TVA intracommunautaire</Label>
                <Input
                  id="vat_number"
                  placeholder="FR12345678901"
                  {...register('vat_number')}
                  disabled={isLoading}
                />
                {errors.vat_number && (
                  <p className="text-sm text-destructive">{errors.vat_number.message}</p>
                )}
              </div>
            </div>

            <RIBInput
              value={rib}
              onChange={setRib}
              error={errors.rib?.message}
              disabled={isLoading}
            />

            <PaymentTermsInput
              value={paymentTerms}
              onChange={setPaymentTerms}
              disabled={isLoading}
            />
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <ContactsSection
              contacts={contacts}
              onChange={setContacts}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Description</h3>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description de l'entreprise</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre entreprise, ses activités, ses valeurs..."
                rows={4}
                {...register('description')}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Documents</h3>
            <CompanyDocumentUpload
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