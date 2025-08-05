// User types
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Company types
export interface Company {
  id: string
  user_id: string
  company_name: string
  siren?: string
  siret?: string
  address_line_1: string
  address_line_2?: string
  postal_code: string
  city: string
  country: string
  phone?: string
  email: string
  website?: string
  description?: string
  logo_url?: string
  // Nouvelles informations
  ape_code?: string
  vat_number?: string
  payment_terms?: string[]
  rib?: string
  contacts?: CompanyContact[]
  created_at: string
  updated_at: string
}

// Contact types
export interface CompanyContact {
  id: string
  company_id: string
  contact_type: string
  name: string
  email?: string
  phone?: string
  job_title?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Document types
export type DocumentType = 
  | 'rib' 
  | 'kbis' 
  | 'contrat' 
  | 'facture' 
  | 'devis' 
  | 'autre'

export interface Document {
  id: string
  company_id: string
  name: string
  display_name?: string
  file_path: string
  file_size: number
  mime_type: string
  document_type: DocumentType
  document_reference?: string
  document_version?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

// Sharing types
export interface CompanyShare {
  id: string
  company_id: string
  shared_with_email: string
  share_token: string
  expires_at?: string
  is_active: boolean
  permissions: SharePermission[]
  created_at: string
  updated_at: string
}

export type SharePermission = 'view_company' | 'view_documents' | 'download_documents'

// Invitation types
export interface Invitation {
  id: string
  company_id: string
  invited_email: string
  invited_by: string
  invitation_token: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Form types
export interface CompanyFormData {
  company_name: string
  siren?: string
  siret?: string
  address_line_1: string
  address_line_2?: string
  postal_code: string
  city: string
  country: string
  phone?: string
  email: string
  website?: string
  description?: string
  // Nouvelles informations
  ape_code?: string
  vat_number?: string
  payment_terms?: string[]
  rib?: string
  contacts?: CompanyContactFormData[]
}

export interface CompanyContactFormData {
  contact_type: string
  name: string
  email?: string
  phone?: string
  job_title?: string
  notes?: string
}

export interface DocumentUploadData {
  type: string
  name: string
  file: File
  is_public: boolean
}

export interface ShareFormData {
  email: string
  permissions: SharePermission[]
  expires_at?: string
  message?: string
}

// Database table types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>
      }
      company_contacts: {
        Row: CompanyContact
        Insert: Omit<CompanyContact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CompanyContact, 'id' | 'created_at' | 'updated_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>
      }
      company_shares: {
        Row: CompanyShare
        Insert: Omit<CompanyShare, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CompanyShare, 'id' | 'created_at' | 'updated_at'>>
      }
      invitations: {
        Row: Invitation
        Insert: Omit<Invitation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Invitation, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}