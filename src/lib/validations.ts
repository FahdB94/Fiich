import { z } from 'zod'

// User validation schemas
export const userSchema = z.object({
  email: z.string().email('Email invalide'),
  first_name: z.string().min(1, 'Le prénom est requis').max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  last_name: z.string().min(1, 'Le nom est requis').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
})

// Contact validation schema (défini en premier pour éviter la référence circulaire)
export const companyContactSchema = z.object({
  contact_type: z.string().min(1, 'Le type de contact est requis').max(50, 'Le type de contact ne peut pas dépasser 50 caractères'),
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone invalide').optional().or(z.literal('')),
  job_title: z.string().max(100, 'Le poste ne peut pas dépasser 100 caractères').optional().or(z.literal('')),
  notes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').optional().or(z.literal('')),
})

// Company validation schemas
export const companySchema = z.object({
  company_name: z.string().min(1, 'La raison sociale est requise').max(100, 'La raison sociale ne peut pas dépasser 100 caractères'),
  siren: z.string().regex(/^\d{9}$/, 'Le SIREN doit contenir 9 chiffres').optional().or(z.literal('')),
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir 14 chiffres').optional().or(z.literal('')),
  address_line_1: z.string().min(1, 'L\'adresse est requise').max(100, 'L\'adresse ne peut pas dépasser 100 caractères'),
  address_line_2: z.string().max(100, 'L\'adresse ne peut pas dépasser 100 caractères').optional().or(z.literal('')),
  postal_code: z.string().min(1, 'Le code postal est requis').max(10, 'Le code postal ne peut pas dépasser 10 caractères'),
  city: z.string().min(1, 'La ville est requise').max(50, 'La ville ne peut pas dépasser 50 caractères'),
  country: z.string().min(1, 'Le pays est requis').max(50, 'Le pays ne peut pas dépasser 50 caractères'),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone invalide').optional().or(z.literal('')),
  email: z.string().email('Email invalide'),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional().or(z.literal('')),
  // Nouvelles informations
  ape_code: z.string().regex(/^\d{4}[A-Z]$/, 'Le code APE doit être au format 4 chiffres + 1 lettre').optional().or(z.literal('')),
  vat_number: z.string().regex(/^[A-Z]{2}[A-Z0-9]{2,20}$/, 'Numéro de TVA intracommunautaire invalide').optional().or(z.literal('')),
  payment_terms: z.array(z.string()).optional(),
  rib: z.string()
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}[A-Z0-9]{13}\d{2}$/, 'RIB invalide (format IBAN français attendu)')
    .refine((val) => {
      if (!val) return true // Optionnel
      const cleaned = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      return cleaned.length === 27
    }, 'Le RIB doit contenir exactement 27 caractères')
    .optional()
    .or(z.literal('')),
  contacts: z.array(companyContactSchema).optional(),
})

// Document validation schemas
export const documentUploadSchema = z.object({
  type: z.string().min(1, 'Le type de document est requis'),
  name: z.string().min(1, 'Le nom du document est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  is_public: z.boolean().default(false),
})

// Share validation schemas
export const sharePermissionSchema = z.enum(['view_company', 'view_documents', 'download_documents'])

export const shareFormSchema = z.object({
  email: z.string().email('Email invalide'),
  permissions: z.array(sharePermissionSchema).min(1, 'Au moins une permission est requise'),
  expires_at: z.string().datetime().optional(),
  message: z.string().max(500, 'Le message ne peut pas dépasser 500 caractères').optional().or(z.literal('')),
})

// Auth validation schemas
export const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  confirmPassword: z.string(),
  first_name: z.string().min(1, 'Le prénom est requis').max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  last_name: z.string().min(1, 'Le nom est requis').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

// File validation
export const fileValidationSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Le fichier ne peut pas dépasser 10MB')
    .refine(
      (file) => [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type),
      'Type de fichier non supporté'
    ),
})

// Export types
export type CompanyFormData = z.infer<typeof companySchema>
export type DocumentUploadData = z.infer<typeof documentUploadSchema>
export type ShareFormData = z.infer<typeof shareFormSchema>
export type SignInData = z.infer<typeof signInSchema>
export type SignUpData = z.infer<typeof signUpSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>