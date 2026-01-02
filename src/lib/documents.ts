/**
 * Document API service
 * Handles document CRUD operations
 */

import { supabase } from './supabase'
import { deletePDF } from './storage'
import type { Document } from '@/types'

/**
 * Map database row to Document type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDocumentRow(row: any): Document {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    filePath: row.file_path,
    fileSize: row.file_size || 0,
    pageCount: row.page_count || undefined,
    contentHash: row.content_hash,
    sharedContentId: row.shared_content_id || undefined,
    uploadedAt: row.uploaded_at,
    processedAt: row.processed_at || undefined,
    processingStatus: row.processing_status as 'pending' | 'processing' | 'completed' | 'failed',
    metadata: (row.metadata as Record<string, unknown>) || {},
  }
}

/**
 * Get all documents for the current user
 */
export async function getDocuments(): Promise<{
  documents: Document[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error) throw error

    return {
      documents: (data || []).map(mapDocumentRow),
    }
  } catch (error) {
    return {
      documents: [],
      error: error instanceof Error ? error.message : 'Failed to fetch documents',
    }
  }
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<{
  document: Document | null
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) throw error

    return {
      document: mapDocumentRow(data),
    }
  } catch (error) {
    return {
      document: null,
      error: error instanceof Error ? error.message : 'Failed to fetch document',
    }
  }
}

/**
 * Delete a document and its associated file from storage
 */
export async function deleteDocument(documentId: string): Promise<{
  error?: string
}> {
  try {
    // First, get the document to retrieve the file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single()

    if (fetchError) throw fetchError

    // Delete the file from storage if it exists
    if (document?.file_path) {
      const deleteFileResult = await deletePDF(document.file_path)
      if (deleteFileResult.error) {
        // Log error but continue with database deletion
        console.error('Failed to delete file from storage:', deleteFileResult.error)
      }
    }

    // Delete the document record (cascade will delete related topics, flashcards, etc.)
    const { error } = await supabase.from('documents').delete().eq('id', documentId)

    if (error) throw error

    return {}
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete document',
    }
  }
}

/**
 * Get topics for a document
 */
export async function getDocumentTopics(documentId: string) {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return {
      topics: data || [],
    }
  } catch (error) {
    return {
      topics: [],
      error: error instanceof Error ? error.message : 'Failed to fetch topics',
    }
  }
}
