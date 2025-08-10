// User types
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Company types
export interface Company {
  id: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  industry?: string
  size?: string
  address?: string
  phone?: string
  email: string
  owner_id: string // Référence à users.id
  is_public: boolean
  created_at: string
  updated_at: string
}

// Company member types
export interface CompanyMember {
  id: string
  company_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer' // Correspond à l'enum user_role
  joined_at: string
  created_at: string
  updated_at: string
}

// Company with user role
export interface CompanyWithRole extends Company {
  user_role: 'owner' | 'admin' | 'member' | 'viewer'
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
  description?: string
  file_path: string
  file_size: number
  file_type: string // Correspond à la colonne file_type
  uploaded_by: string // Référence à users.id
  is_public: boolean
  created_at: string
  updated_at: string
}

// Sharing types
export interface CompanyShare {
  id: string
  company_id: string
  token: string // Correspond à la colonne token
  permissions: Record<string, any> // JSONB dans la base
  expires_at?: string
  created_by: string // Référence à users.id
  created_at: string
  updated_at: string
}

export type SharePermission = 'view' | 'edit' | 'delete'

// Invitation types
export interface Invitation {
  id: string
  company_id: string
  email: string // Correspond à la colonne email
  role: 'owner' | 'admin' | 'member' | 'viewer' // Correspond à l'enum user_role
  token: string // Correspond à la colonne token
  status: 'pending' | 'accepted' | 'declined' | 'expired' // Correspond à l'enum invitation_status
  expires_at: string
  invited_by: string // Référence à users.id
  // Champs optionnels ajoutés par les migrations
  first_name?: string
  last_name?: string
  department?: string
  created_at: string
  updated_at: string
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  type: 'invitation' | 'document_shared' | 'company_update' | 'system' // Correspond à l'enum notification_type
  title: string
  message: string
  data?: Record<string, any> // JSONB dans la base
  is_read: boolean
  created_at: string
  updated_at: string
}

// Plan types
export interface Plan {
  id: string
  code: string // Correspond à la colonne code
  name: string
  description?: string
  price_monthly?: number // Correspond à la colonne price_monthly
  price_yearly?: number // Correspond à la colonne price_yearly
  features: Record<string, any> // JSONB dans la base
  is_active: boolean
  created_at: string
  updated_at: string
}

// Company subscription types
export interface CompanySubscription {
  id: string
  company_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'trialing' | 'past_due' // Correspond à l'enum subscription_status
  started_at: string // Correspond à la colonne started_at
  ends_at?: string // Correspond à la colonne ends_at
  trial_ends_at?: string // Correspond à la colonne trial_ends_at
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
  name: string
  description?: string
  logo_url?: string
  website?: string
  industry?: string
  size?: string
  address?: string
  phone?: string
  email: string
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
  name: string
  description?: string
  file: File
  is_public: boolean
}

export interface ShareFormData {
  permissions: Record<string, any>
  expires_at?: string
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
      company_members: {
        Row: CompanyMember
        Insert: Omit<CompanyMember, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CompanyMember, 'id' | 'created_at' | 'updated_at'>>
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
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Plan, 'id' | 'created_at' | 'updated_at'>>
      }
      company_subscriptions: {
        Row: CompanySubscription
        Insert: Omit<CompanySubscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CompanySubscription, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}