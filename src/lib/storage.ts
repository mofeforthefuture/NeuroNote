import { supabase } from './supabase'

/**
 * Supabase Storage service
 * Handles file uploads and management
 */

const BUCKET_NAME = 'documents'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Upload a PDF file to Supabase Storage
 */
export async function uploadPDF(file: File, userId: string): Promise<{
  path: string
  url: string
  error?: string
}> {
  try {
    // Validate file
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      path: filePath,
      url: urlData.publicUrl,
    }
  } catch (error) {
    return {
      path: '',
      url: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deletePDF(filePath: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

    if (error) {
      throw error
    }

    return {}
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

/**
 * Get file URL
 */
export function getFileURL(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Calculate file hash (SHA-256) for deduplication
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

