/**
 * Debug utility for Supabase configuration
 * Use this to verify your Supabase setup
 */

import { supabase } from './supabase'

/**
 * Test Supabase connection
 * Call this in the browser console to debug connection issues
 */
export async function testSupabaseConnection() {
  console.group('🔍 Supabase Connection Test')
  
  try {
    // Test 1: Check environment variables
    const url = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('Environment Variables:')
    console.log('  URL:', url ? `${url.substring(0, 30)}...` : '❌ MISSING')
    console.log('  Anon Key:', anonKey ? '✅ Present' : '❌ MISSING')
    
    if (!url || !anonKey) {
      console.error('❌ Missing required environment variables!')
      console.log('Make sure your .env file has:')
      console.log('  VITE_SUPABASE_URL=...')
      console.log('  VITE_SUPABASE_ANON_KEY=...')
      console.log('Then restart your dev server with: npm run dev')
      return
    }
    
    // Test 2: Try to fetch from Supabase
    console.log('\nTesting API connection...')
    const { error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      if (error.message.includes('Failed to fetch')) {
        console.log('\nPossible issues:')
        console.log('  1. Check if your Supabase URL is correct')
        console.log('  2. Check if your Supabase project is active')
        console.log('  3. Check browser console for CORS errors')
        console.log('  4. Verify your .env file and restart dev server')
      }
    } else {
      console.log('✅ Connection successful!')
    }
    
    // Test 3: Check auth endpoint
    console.log('\nTesting auth endpoint...')
    const { error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.warn('⚠️  Auth check:', authError.message)
    } else {
      console.log('✅ Auth endpoint accessible')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
  
  console.groupEnd()
}

// Make it available globally in development
if (import.meta.env.DEV) {
  ;(window as any).testSupabase = testSupabaseConnection
  console.log('💡 Run testSupabase() in console to debug connection issues')
}

