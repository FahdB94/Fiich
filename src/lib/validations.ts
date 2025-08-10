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
  name: z.string().min(1, 'Le nom de l\'entreprise est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional().or(z.literal('')),
  logo_url: z.string().url('URL invalide').optional().or(z.literal('')),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  industry: z.string().max(100, 'Le secteur d\'activité ne peut pas dépasser 100 caractères').optional().or(z.literal('')),
  size: z.string().max(50, 'La taille ne peut pas dépasser 50 caractères').optional().or(z.literal('')),
  address: z.string().max(200, 'L\'adresse ne peut pas dépasser 200 caractères').optional().or(z.literal('')),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone invalide').optional().or(z.literal('')),
  email: z.string().email('Email invalide'),
})

// Document validation schemas
export const documentUploadSchema = z.object({
  name: z.string().min(1, 'Le nom du document est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional().or(z.literal('')),
  is_public: z.boolean(),
})

// Share validation schemas
export const sharePermissionSchema = z.enum(['view', 'edit', 'delete'])

export const shareFormSchema = z.object({
  permissions: z.record(z.boolean()).min(1, 'Au moins une permission est requise'),
  expires_at: z.string().datetime().optional(),
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