/**
 * Database type definitions for Supabase
 * 
 * This file should be auto-generated from your Supabase schema
 * For now, it's a placeholder that you can update as needed
 * 
 * To generate types automatically:
 * npx supabase gen types typescript --project-id [YOUR-PROJECT-ID] > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          country_code: string | null
          is_medical_field: boolean
          study_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          country_code?: string | null
          is_medical_field?: boolean
          study_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          country_code?: string | null
          is_medical_field?: boolean
          study_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          file_path: string
          file_size: number | null
          page_count: number | null
          content_hash: string
          shared_content_id: string | null
          uploaded_at: string
          processed_at: string | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          file_path: string
          file_size?: number | null
          page_count?: number | null
          content_hash: string
          shared_content_id?: string | null
          uploaded_at?: string
          processed_at?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_path?: string
          file_size?: number | null
          page_count?: number | null
          content_hash?: string
          shared_content_id?: string | null
          uploaded_at?: string
          processed_at?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          metadata?: Json
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          document_id: string
          title: string
          description: string | null
          page_references: number[]
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          title: string
          description?: string | null
          page_references?: number[]
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          title?: string
          description?: string | null
          page_references?: number[]
          created_at?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          id: string
          topic_id: string
          front_text: string
          back_text: string
          difficulty_level: 'easy' | 'medium' | 'hard'
          ai_generated: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          front_text: string
          back_text: string
          difficulty_level?: 'easy' | 'medium' | 'hard'
          ai_generated?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          front_text?: string
          back_text?: string
          difficulty_level?: 'easy' | 'medium' | 'hard'
          ai_generated?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add more table types as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

