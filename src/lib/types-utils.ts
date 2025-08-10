// Types utilitaires pour résoudre les problèmes de types implicites

// Types pour les invitations
export interface ApiInvitation {
  id: string
  company_id: string
  invited_email: string
  invited_by: string
  invitation_token: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at?: string
  created_at: string
  updated_at: string
}

// Types pour les entreprises avec informations étendues
export interface CompanyInfo {
  id: string
  company_name: string
  siren?: string
  siret?: string
  logo_url?: string
  [key: string]: any
}

// Types pour les membres d'entreprise
export interface CompanyMemberInfo {
  user_id: string
  role: string
  status: string
  [key: string]: any
}

// Types pour les documents avec informations étendues
export interface DocumentInfo {
  id: string
  name: string
  file_path: string
  [key: string]: any
}

// Types pour les partages avec informations étendues
export interface ShareInfo {
  id: string
  company_id: string
  shared_with_email: string
  [key: string]: any
}

// Types pour les utilisateurs avec informations étendues
export interface UserInfo {
  id: string
  email: string
  [key: string]: any
}

// Types pour les entreprises possédées
export interface OwnedCompany {
  id: string
  [key: string]: any
}

// Types pour les invitations avec informations étendues
export interface InvitationInfo {
  id: string
  company_id: string
  invited_email: string
  [key: string]: any
}

// Types pour les partages avec informations étendues
export interface ShareInfoExtended {
  id: string
  company_id: string
  shared_with_email: string
  [key: string]: any
}
