import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Import debug utility in development
if (import.meta.env.DEV) {
  import('./supabase-debug')
}

/**
 * Supabase client configuration
 * Uses environment variables for URL and keys
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase Config:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceRoleKey,
  })
}

if (!supabaseUrl) {
  const error = 'Missing env.VITE_SUPABASE_URL. Please check your .env file and restart the dev server.'
  console.error(error)
  throw new Error(error)
}

if (!supabaseAnonKey) {
  const error = 'Missing env.VITE_SUPABASE_ANON_KEY. Please check your .env file and restart the dev server.'
  console.error(error)
  throw new Error(error)
}

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  const error = `Invalid VITE_SUPABASE_URL format. Expected URL starting with http:// or https://, got: ${supabaseUrl.substring(0, 50)}...`
  console.error(error)
  throw new Error(error)
}

/**
 * Client-side Supabase client
 * Uses anon key - respects Row Level Security (RLS)
 * Use this for all client-side operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Server-side Supabase client (admin)
 * Uses service role key - bypasses RLS
 * Only use this in server-side code or admin operations
 * NEVER expose this in client-side code
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

/**
 * Get the current user session
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

