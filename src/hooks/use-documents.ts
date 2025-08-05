'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Document } from '@/lib/types'
import { generateFileName } from '@/lib/file-utils'

export function useDocuments(companyId?: string) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setDocuments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [companyId])

  const uploadDocument = async (
    file: File,
    type: string,
    name: string,
    isPublic: boolean = false
  ) => {
    if (!companyId) throw new Error('Company ID is required')

    try {
      const fileName = generateFileName(file.name)
      const filePath = `documents/${companyId}/${fileName}`
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          company_id: companyId,
          name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          is_public: isPublic,
        })
        .select()
        .single()

      if (error) {
        // Clean up uploaded file if database insertion fails
        await supabase.storage
          .from('company-files')
          .remove([filePath])
        throw error
      }

      setDocuments(prev => [data, ...prev])
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const updateDocument = async (
    documentId: string,
    updates: { name?: string; is_public?: boolean }
  ) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .eq('company_id', companyId)
        .select()
        .single()

      if (error) throw error

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId ? data : doc
        )
      )
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }

  const deleteDocument = async (documentId: string) => {
    try {
      // Get document to find file path
      const document = documents.find(doc => doc.id === documentId)
      if (!document) throw new Error('Document not found')

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('company_id', companyId)

      if (dbError) throw dbError

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('company-files')
        .remove([document.file_path])

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  const getDocumentUrl = async (documentId: string, download: boolean = false) => {
    try {
      const document = documents.find(doc => doc.id === documentId)
      if (!document) throw new Error('Document not found')

      const { data, error } = await supabase.storage
        .from('company-files')
        .createSignedUrl(document.file_path, 3600) // 1 hour expiry

      if (error) throw error

      if (download) {
        const link = window.document.createElement('a')
        link.href = data.signedUrl
        link.download = document.name
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
      }

      return { url: data.signedUrl, error: null }
    } catch (err: any) {
      return { url: null, error: err.message }
    }
  }

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.mime_type.includes(type))
  }

  const getPublicDocuments = () => {
    return documents.filter(doc => doc.is_public)
  }

  return {
    documents,
    loading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDocumentUrl,
    getDocumentsByType,
    getPublicDocuments,
    refetch: fetchDocuments,
  }
}