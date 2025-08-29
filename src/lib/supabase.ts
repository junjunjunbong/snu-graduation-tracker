import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface DatabaseUser {
  id: string
  google_id: string
  email: string
  name?: string
  picture_url?: string
  created_at: string
  updated_at: string
}

export interface DatabaseCreditTransaction {
  id: string
  user_id: string
  term: string
  bucket: string
  credits: number
  course_name?: string
  major_type?: string
  note?: string
  created_at: string
  updated_at: string
}

export interface DatabaseUserProfile {
  id: string
  user_id: string
  dual_major_enabled: boolean
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: DatabaseUser
        Insert: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>>
      }
      credit_transactions: {
        Row: DatabaseCreditTransaction
        Insert: Omit<DatabaseCreditTransaction, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseCreditTransaction, 'id' | 'created_at' | 'updated_at'>>
      }
      user_profiles: {
        Row: DatabaseUserProfile
        Insert: Omit<DatabaseUserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseUserProfile, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}