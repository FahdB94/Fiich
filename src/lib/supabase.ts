import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'
import type { Database } from './types'

// Single client instance to avoid multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

// Client-side Supabase client (use in client components)
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'fiich-auth',  // Unique storage key
        },
      }
    )
  }
  return supabaseInstance
})()

// Browser client (returns the same instance)
export const createBrowserClient = () => {
  return supabase
}

// Server-side Supabase client (only use in server components)
export const createServerClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    }
  )
}

// Service role client (for admin operations)
export const createServiceClient = () => {
  if (!supabaseConfig.serviceRoleKey) {
    throw new Error('Service role key is required')
  }
  
  return createClient<Database>(
    supabaseConfig.url,
    supabaseConfig.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}