/**
 * Topics API service
 * Handles topic-related operations
 */

import { supabase, getCurrentUser } from './supabase'
import { extractTextFromPDF } from './pdf-extractor'
import { extractTopics, generateQuestions } from './ai-service'
import { createProcessingJob, updateProcessingJob, getCreditBalance } from './credits'
import type { Topic } from '@/types'

/**
 * Map database row to Topic type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTopicRow(row: any): Topic {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    description: row.description || undefined,
    pageReferences: row.page_references || [],
    createdAt: row.created_at,
  }
}

/**
 * Get a single topic with all related content
 */
export async function getTopic(topicId: string) {
  try {
    const { data, error } = await supabase.from('topics').select('*').eq('id', topicId).single()

    if (error) throw error

    return { topic: mapTopicRow(data) }
  } catch (error) {
    return {
      topic: null,
      error: error instanceof Error ? error.message : 'Failed to fetch topic',
    }
  }
}

/**
 * Map database row to Flashcard type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFlashcardRow(row: any): import('@/types').Flashcard {
  return {
    id: row.id,
    topicId: row.topic_id,
    frontText: row.front_text,
    backText: row.back_text,
    difficultyLevel: row.difficulty_level,
    aiGenerated: row.ai_generated,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Get flashcards for a topic
 */
export async function getTopicFlashcards(topicId: string) {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return {
      flashcards: (data || []).map(mapFlashcardRow),
    }
  } catch (error) {
    return {
      flashcards: [],
      error: error instanceof Error ? error.message : 'Failed to fetch flashcards',
    }
  }
}

/**
 * Get questions for a topic
 */
export async function getTopicQuestions(topicId: string) {
  try {
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { questions: data || [] }
  } catch (error) {
    return {
      questions: [],
      error: error instanceof Error ? error.message : 'Failed to fetch questions',
    }
  }
}

/**
 * Get explanations for a topic
 */
export async function getTopicExplanations(topicId: string) {
  try {
    const { data, error } = await supabase
      .from('concept_explanations')
      .select('*')
      .eq('topic_id', topicId)
      .order('explanation_level', { ascending: true })

    if (error) throw error

    return { explanations: data || [] }
  } catch (error) {
    return {
      explanations: [],
      error: error instanceof Error ? error.message : 'Failed to fetch explanations',
    }
  }
}

/**
 * Get vocabulary for a document
 */
export async function getDocumentVocabulary(documentId: string) {
  try {
    const { data, error } = await supabase
      .from('vocabulary_terms')
      .select('*')
      .eq('document_id', documentId)
      .order('term', { ascending: true })

    if (error) throw error

    return { vocabulary: data || [] }
  } catch (error) {
    return {
      vocabulary: [],
      error: error instanceof Error ? error.message : 'Failed to fetch vocabulary',
    }
  }
}

/**
 * Generate topics for an existing document
 * Downloads the PDF, extracts text, and generates topics using AI
 * Stops immediately if any database operation fails to avoid wasting tokens
 */
export async function generateTopicsForDocument(documentId: string): Promise<{
  topics: Topic[]
  error?: string
}> {
  try {
    // Get document with file path
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, file_path, title')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error('Document not found')
    }

    const doc = document as { id: string; file_path: string; title: string | null }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      throw new Error('Failed to download PDF file')
    }

    // Convert blob to File
    const file = new File([fileData], doc.title || 'document.pdf', {
      type: 'application/pdf',
    })

    // Extract text from PDF
    const extractResult = await extractTextFromPDF(file)
    if (extractResult.error || !extractResult.text) {
      throw new Error(extractResult.error || 'Failed to extract text from PDF')
    }

    // Generate topics using AI - only proceed if we can save them
    const { topics: extractedTopics, error: topicsError } = await extractTopics(extractResult.text)

    if (topicsError || !extractedTopics || extractedTopics.length === 0) {
      throw new Error(topicsError || 'No topics were generated')
    }

    // Save topics to database - stop if this fails
    const topicsToInsert = extractedTopics.map(topic => ({
      document_id: documentId,
      title: topic.title,
      description: topic.description || null,
      page_references: topic.pageReferences || [],
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedTopics, error: saveError } = await (supabase.from('topics') as any)
      .insert(topicsToInsert)
      .select()

    if (saveError || !savedTopics) {
      throw new Error(saveError?.message || 'Failed to save topics to database')
    }

    // Map to Topic type
    const topics = savedTopics.map(mapTopicRow)

    return { topics }
  } catch (error) {
    return {
      topics: [],
      error: error instanceof Error ? error.message : 'Failed to generate topics',
    }
  }
}

/**
 * Generate more questions for a topic
 * Deducts credits and generates additional practice questions
 */
export async function generateMoreQuestionsForTopic(topicId: string): Promise<{
  questionsGenerated: number
  error?: string
}> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { questionsGenerated: 0, error: 'User not authenticated' }
    }

    // Get topic and document info
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, title, description, document_id')
      .eq('id', topicId)
      .single()

    if (topicError || !topic) {
      return { questionsGenerated: 0, error: 'Topic not found' }
    }

    const topicData = topic as {
      id: string
      title: string
      description: string | null
      document_id: string
    }

    // Get document to access PDF
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, file_path, title')
      .eq('id', topicData.document_id)
      .single()

    if (docError || !document) {
      return { questionsGenerated: 0, error: 'Document not found' }
    }

    const doc = document as { id: string; file_path: string; title: string | null }

    // Check credit balance (3 credits per topic for questions)
    const { balance, error: balanceError } = await getCreditBalance(user.id)
    if (balanceError || !balance) {
      return { questionsGenerated: 0, error: 'Failed to check credit balance' }
    }

    if (balance.balance < 3) {
      return {
        questionsGenerated: 0,
        error: `Insufficient credits. You need 3 credits to generate questions, but you have ${balance.balance}.`,
      }
    }

    // Create processing job and deduct credits
    const { jobId, error: jobError } = await createProcessingJob(
      user.id,
      doc.id,
      3, // 3 credits for question generation
      'regenerate_questions',
      {
        topic_id: topicId,
        topic_title: topicData.title,
      }
    )

    if (jobError || !jobId) {
      return { questionsGenerated: 0, error: jobError || 'Failed to create processing job' }
    }

    // Download PDF to get context
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      // Refund credits if we can't get the file
      await updateProcessingJob(jobId, 0, 'failed', 'Failed to download PDF file')
      return { questionsGenerated: 0, error: 'Failed to download PDF file' }
    }

    // Convert blob to File
    const file = new File([fileData], doc.title || 'document.pdf', {
      type: 'application/pdf',
    })

    // Extract text from PDF
    const { extractTextFromPDF } = await import('./pdf-extractor')
    const extractResult = await extractTextFromPDF(file)
    if (extractResult.error || !extractResult.text) {
      await updateProcessingJob(jobId, 0, 'failed', extractResult.error || 'Failed to extract text')
      return { questionsGenerated: 0, error: extractResult.error || 'Failed to extract text' }
    }

    // Generate questions using AI
    const {
      questions,
      tokenUsage,
      error: questionsError,
    } = await generateQuestions(topicData.title, topicData.description || '', extractResult.text)

    if (questionsError || !questions || questions.length === 0) {
      await updateProcessingJob(jobId, 0, 'failed', questionsError || 'No questions generated')
      return { questionsGenerated: 0, error: questionsError || 'Failed to generate questions' }
    }

    // Save questions to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: saveError } = await (supabase.from('exam_questions') as any).insert(
      questions.map(q => ({
        topic_id: topicId,
        question_type: q.questionType,
        question_text: q.questionText,
        correct_answer: q.correctAnswer,
        options: q.options || null,
        explanation: q.explanation || null,
        ai_generated: true,
      }))
    )

    if (saveError) {
      await updateProcessingJob(jobId, 0, 'failed', saveError.message)
      return { questionsGenerated: 0, error: `Failed to save questions: ${saveError.message}` }
    }

    // Store token usage
    if (tokenUsage && jobId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const costResult = await (supabase.rpc as any)('calculate_token_cost', {
          p_model: tokenUsage.model || 'anthropic/claude-3.5-sonnet',
          p_prompt_tokens: tokenUsage.promptTokens,
          p_completion_tokens: tokenUsage.completionTokens,
        })
        const estimatedCost = costResult.data || 0

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('ai_operation_tokens') as any).insert({
          processing_job_id: jobId,
          document_id: doc.id,
          user_id: user.id,
          operation_type: 'generate_questions',
          prompt_tokens: tokenUsage.promptTokens,
          completion_tokens: tokenUsage.completionTokens,
          total_tokens: tokenUsage.totalTokens,
          ai_model: tokenUsage.model || 'anthropic/claude-3.5-sonnet',
          estimated_cost_usd: estimatedCost.toString(),
          metadata: {
            topic_id: topicId,
            topic_title: topicData.title,
            questions_generated: questions.length,
          },
        })
      } catch (tokenError) {
        console.error('Failed to store token usage:', tokenError)
        // Don't fail the whole operation if token tracking fails
      }
    }

    // Update processing job as completed
    await updateProcessingJob(jobId, 3, 'completed')

    return { questionsGenerated: questions.length }
  } catch (error) {
    return {
      questionsGenerated: 0,
      error: error instanceof Error ? error.message : 'Failed to generate questions',
    }
  }
}
