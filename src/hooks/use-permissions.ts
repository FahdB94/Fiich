import { useMemo } from 'react'

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface UserPermissions {
  canReadCompany: boolean
  canWriteCompany: boolean
  canDeleteCompany: boolean
  canManageUsers: boolean
  canShareCompany: boolean
  canReadDocuments: boolean
  canUploadDocuments: boolean
  canDeleteDocuments: boolean
  canDownloadDocuments: boolean
  canManageInvitations: boolean
}

export function usePermissions(userRole?: UserRole): UserPermissions {
  return useMemo(() => {
    const role = userRole || 'viewer'
    
    switch (role) {
      case 'owner':
        return {
          canReadCompany: true,
          canWriteCompany: true,
          canDeleteCompany: true,
          canManageUsers: true,
          canShareCompany: true,
          canReadDocuments: true,
          canUploadDocuments: true,
          canDeleteDocuments: true,
          canDownloadDocuments: true,
          canManageInvitations: true,
        }
      
      case 'admin':
        return {
          canReadCompany: true,
          canWriteCompany: true,
          canDeleteCompany: false,
          canManageUsers: true,
          canShareCompany: true,
          canReadDocuments: true,
          canUploadDocuments: true,
          canDeleteDocuments: true,
          canDownloadDocuments: true,
          canManageInvitations: true,
        }
      
      case 'member':
        return {
          canReadCompany: true,
          canWriteCompany: false,
          canDeleteCompany: false,
          canManageUsers: false,
          canShareCompany: false,
          canReadDocuments: true,
          canUploadDocuments: true,
          canDeleteDocuments: false,
          canDownloadDocuments: true,
          canManageInvitations: false,
        }
      
      case 'viewer':
      default:
        return {
          canReadCompany: true,
          canWriteCompany: false,
          canDeleteCompany: false,
          canManageUsers: false,
          canShareCompany: false,
          canReadDocuments: true,
          canUploadDocuments: false,
          canDeleteDocuments: false,
          canDownloadDocuments: true,
          canManageInvitations: false,
        }
    }
  }, [userRole])
}
