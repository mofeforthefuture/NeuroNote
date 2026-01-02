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
      exam_questions: {
        Row: {
          id: string
          topic_id: string
          question_type: 'mcq' | 'short_answer' | 'true_false' | 'essay'
          question_text: string
          correct_answer: string | null
          options: Json | null
          explanation: string | null
          points: number
          ai_generated: boolean
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          question_type: 'mcq' | 'short_answer' | 'true_false' | 'essay'
          question_text: string
          correct_answer?: string | null
          options?: Json | null
          explanation?: string | null
          points?: number
          ai_generated?: boolean
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          question_type?: 'mcq' | 'short_answer' | 'true_false' | 'essay'
          question_text?: string
          correct_answer?: string | null
          options?: Json | null
          explanation?: string | null
          points?: number
          ai_generated?: boolean
          version?: number
          created_at?: string
        }
        Relationships: []
      }
      vocabulary_terms: {
        Row: {
          id: string
          topic_id: string | null
          document_id: string
          term: string
          definition: string
          etymology: string | null
          pronunciation: string | null
          context_sentences: string[]
          difficulty_level: 'easy' | 'medium' | 'hard'
          ai_generated: boolean
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          topic_id?: string | null
          document_id: string
          term: string
          definition: string
          etymology?: string | null
          pronunciation?: string | null
          context_sentences?: string[]
          difficulty_level?: 'easy' | 'medium' | 'hard'
          ai_generated?: boolean
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string | null
          document_id?: string
          term?: string
          definition?: string
          etymology?: string | null
          pronunciation?: string | null
          context_sentences?: string[]
          difficulty_level?: 'easy' | 'medium' | 'hard'
          ai_generated?: boolean
          version?: number
          created_at?: string
        }
        Relationships: []
      }
      concept_explanations: {
        Row: {
          id: string
          topic_id: string
          explanation_level: 'eli5' | 'beginner' | 'intermediate' | 'advanced'
          explanation_text: string
          ai_generated: boolean
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          explanation_level: 'eli5' | 'beginner' | 'intermediate' | 'advanced'
          explanation_text: string
          ai_generated?: boolean
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          explanation_level?: 'eli5' | 'beginner' | 'intermediate' | 'advanced'
          explanation_text?: string
          ai_generated?: boolean
          version?: number
          created_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          content_type: 'flashcard' | 'exam_question' | 'vocabulary_term'
          content_id: string
          mastery_level: number
          last_reviewed_at: string | null
          next_review_at: string | null
          review_count: number
          correct_count: number
          incorrect_count: number
          ease_factor: number
          interval_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: 'flashcard' | 'exam_question' | 'vocabulary_term'
          content_id: string
          mastery_level?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          correct_count?: number
          incorrect_count?: number
          ease_factor?: number
          interval_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: 'flashcard' | 'exam_question' | 'vocabulary_term'
          content_id?: string
          mastery_level?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          correct_count?: number
          incorrect_count?: number
          ease_factor?: number
          interval_days?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          note_text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          note_text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          note_text?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          lifetime_earned: number
          lifetime_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'refund' | 'processing' | 'generation' | 'bonus' | 'gift' | 'adjustment'
          reference_type: string | null
          reference_id: string | null
          description: string
          metadata: Json
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'refund' | 'processing' | 'generation' | 'bonus' | 'gift' | 'adjustment'
          reference_type?: string | null
          reference_id?: string | null
          description: string
          metadata?: Json
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          transaction_type?: 'purchase' | 'refund' | 'processing' | 'generation' | 'bonus' | 'gift' | 'adjustment'
          reference_type?: string | null
          reference_id?: string | null
          description?: string
          metadata?: Json
          balance_after?: number
          created_at?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          id: string
          name: string
          credits: number
          price_amount: string
          price_currency: 'USD' | 'NGN'
          country_code: string | null
          is_active: boolean
          display_order: number
          bonus_credits: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          price_amount: string
          price_currency?: 'USD' | 'NGN'
          country_code?: string | null
          is_active?: boolean
          display_order?: number
          bonus_credits?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          credits?: number
          price_amount?: string
          price_currency?: 'USD' | 'NGN'
          country_code?: string | null
          is_active?: boolean
          display_order?: number
          bonus_credits?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_processing_jobs: {
        Row: {
          id: string
          document_id: string
          user_id: string
          estimated_credits: number
          actual_credits: number | null
          processing_type: 'initial' | 'regenerate_flashcards' | 'regenerate_questions' | 'regenerate_explanations' | 'regenerate_vocabulary'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          credits_deducted_at: string | null
          refunded_at: string | null
          error_message: string | null
          metadata: Json
          total_tokens: number | null
          prompt_tokens: number | null
          completion_tokens: number | null
          ai_model: string | null
          estimated_cost_usd: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          estimated_credits: number
          actual_credits?: number | null
          processing_type: 'initial' | 'regenerate_flashcards' | 'regenerate_questions' | 'regenerate_explanations' | 'regenerate_vocabulary'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          credits_deducted_at?: string | null
          refunded_at?: string | null
          error_message?: string | null
          metadata?: Json
          total_tokens?: number | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          ai_model?: string | null
          estimated_cost_usd?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          estimated_credits?: number
          actual_credits?: number | null
          processing_type?: 'initial' | 'regenerate_flashcards' | 'regenerate_questions' | 'regenerate_explanations' | 'regenerate_vocabulary'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          credits_deducted_at?: string | null
          refunded_at?: string | null
          error_message?: string | null
          metadata?: Json
          total_tokens?: number | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          ai_model?: string | null
          estimated_cost_usd?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_operation_tokens: {
        Row: {
          id: string
          processing_job_id: string | null
          document_id: string
          user_id: string
          operation_type: 'extract_topics' | 'generate_flashcards' | 'generate_questions' | 'generate_vocabulary' | 'generate_explanations'
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          ai_model: string
          estimated_cost_usd: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          processing_job_id?: string | null
          document_id: string
          user_id: string
          operation_type: 'extract_topics' | 'generate_flashcards' | 'generate_questions' | 'generate_vocabulary' | 'generate_explanations'
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          ai_model: string
          estimated_cost_usd?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          processing_job_id?: string | null
          document_id?: string
          user_id?: string
          operation_type?: 'extract_topics' | 'generate_flashcards' | 'generate_questions' | 'generate_vocabulary' | 'generate_explanations'
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          ai_model?: string
          estimated_cost_usd?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      token_usage_summary: {
        Row: {
          operation_type: string
          operation_count: number
          total_prompt_tokens: number
          total_completion_tokens: number
          total_tokens: number
          total_cost_usd: string
          avg_tokens_per_operation: string
          avg_cost_per_operation: string
          first_operation: string
          last_operation: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      document_token_usage: {
        Row: {
          document_id: string
          document_title: string
          user_id: string
          operation_count: number
          total_prompt_tokens: number
          total_completion_tokens: number
          total_tokens: number
          total_cost_usd: string
          credits_charged: number | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: {
      token_usage_summary: {
        Row: {
          operation_type: string
          operation_count: number
          total_prompt_tokens: number
          total_completion_tokens: number
          total_tokens: number
          total_cost_usd: string
          avg_tokens_per_operation: string
          avg_cost_per_operation: string
          first_operation: string
          last_operation: string
        }
      }
      document_token_usage: {
        Row: {
          document_id: string
          document_title: string
          user_id: string
          operation_count: number
          total_prompt_tokens: number
          total_completion_tokens: number
          total_tokens: number
          total_cost_usd: string
          credits_charged: number | null
        }
      }
    }
    Functions: {
      deduct_credits_from_user: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_description: string
          p_reference_type?: string | null
          p_reference_id?: string | null
          p_metadata?: Json
        }
        Returns: number
      }
      add_credits_to_user: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_description: string
          p_reference_type?: string | null
          p_reference_id?: string | null
          p_metadata?: Json
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

