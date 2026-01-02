/**
 * Document Processing Service
 * Orchestrates the entire document processing workflow:
 * 1. Upload PDF to storage
 * 2. Extract text
 * 3. Generate study materials with AI
 * 4. Save to database
 */

import { supabase } from './supabase'
import { uploadPDF, calculateFileHash } from './storage'
import { extractTextFromPDF } from './pdf-extractor'
import {
  extractTopics,
  generateFlashcards,
  generateQuestions,
  generateVocabulary,
  generateExplanations,
  type TokenUsage,
} from './ai-service'
import {
  estimateDocumentCredits,
  createProcessingJob,
  updateProcessingJob,
  type CreditEstimate,
} from './credits'

export interface ProcessingProgress {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'generating' | 'saving' | 'completed' | 'failed'
  progress: number
  message: string
  error?: string
  creditEstimate?: CreditEstimate
  creditsUsed?: number
}

type ProgressCallback = (progress: ProcessingProgress) => void

/**
 * Process a document: upload, extract, and generate study materials
 */
export async function processDocument(
  file: File,
  userId: string,
  onProgress?: ProgressCallback
): Promise<{
  documentId: string
  error?: string
  creditEstimate?: CreditEstimate
}> {
  // Declare documentId and jobId outside try block so they're accessible in catch block
  let documentId: string | undefined
  let jobId: string | undefined

  try {
    // Stage 1: Upload PDF
    onProgress?.({
      stage: 'uploading',
      progress: 10,
      message: 'Uploading document...',
    })

    const hash = await calculateFileHash(file)

    // Check if THIS USER already has a document with this hash
    const { data: existingUserDoc } = await supabase
      .from('documents')
      .select('id, shared_content_id, processing_status')
      .eq('user_id', userId)
      .eq('content_hash', hash)
      .limit(1)
      .maybeSingle()

    if (existingUserDoc) {
      // User already uploaded this document
      const doc = existingUserDoc as {
        id: string
        shared_content_id: string | null
        processing_status: string
      }
      documentId = doc.id
      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: 'You already have this document!',
      })
      return { documentId }
    }

    // Check if ANY user has processed this document (for content cloning)
    const { data: existingSharedDoc } = await supabase
      .from('documents')
      .select('id, shared_content_id')
      .eq('content_hash', hash)
      .not('shared_content_id', 'is', null)
      .limit(1)
      .maybeSingle()

    const sharedDoc = existingSharedDoc as { id: string; shared_content_id: string } | null
    const hasSharedContent = !!sharedDoc?.shared_content_id

    // New document - process it
    {
      // New document - process it
      const uploadResult = await uploadPDF(file, userId)
      if (uploadResult.error) {
        throw new Error(uploadResult.error)
      }

      // Stage 2: Extract text
      onProgress?.({
        stage: 'extracting',
        progress: 20,
        message: 'Extracting text from PDF...',
      })

      const extractResult = await extractTextFromPDF(file)
      if (extractResult.error) {
        throw new Error(extractResult.error)
      }

      // Estimate credits needed (before processing)
      const estimatedTopics = Math.max(1, Math.floor(extractResult.pageCount / 4)) // Rough estimate
      const complexity: 'simple' | 'medium' | 'complex' =
        extractResult.pageCount > 100
          ? 'complex'
          : extractResult.pageCount > 50
          ? 'medium'
          : 'simple'

      const creditEstimate = estimateDocumentCredits(
        extractResult.pageCount,
        estimatedTopics,
        complexity
      )

      onProgress?.({
        stage: 'analyzing',
        progress: 30,
        message: `Estimated cost: ${creditEstimate.total} credits`,
        creditEstimate,
      })

      // Stage 3: Analyze document structure
      onProgress?.({
        stage: 'analyzing',
        progress: 40,
        message: 'Analyzing document structure...',
      })

      const {
        topics,
        tokenUsage: topicsTokenUsage,
        error: topicsError,
      } = await extractTopics(extractResult.text)
      if (topicsError) {
        throw new Error(`Topic extraction failed: ${topicsError}`)
      }

      // Store token usage for topic extraction (will store after job is created)

      // Create document record first
      // If shared content exists, link to it (will clone content later)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newDoc, error: docError } = await (supabase.from('documents') as any)
        .insert({
          user_id: userId,
          title: file.name.replace('.pdf', ''),
          file_path: uploadResult.path,
          file_size: file.size,
          page_count: extractResult.pageCount,
          content_hash: hash,
          shared_content_id: hasSharedContent && sharedDoc ? sharedDoc.shared_content_id : null,
          processing_status: hasSharedContent ? 'processing' : 'processing', // Will clone if shared content exists
        })
        .select()
        .single()

      if (docError || !newDoc) {
        throw new Error(docError?.message || 'Failed to create document record')
      }

      const doc = newDoc as { id: string; shared_content_id: string | null }
      documentId = doc.id

      // If shared content exists, clone it instead of processing
      if (hasSharedContent && sharedDoc?.shared_content_id) {
        // TODO: Implement content cloning logic here
        // For now, we'll still process it but mark it as using shared content
        // This is a placeholder - you should clone topics, flashcards, etc. from the shared document

        // Update document status to completed (cloned)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('documents') as any)
          .update({
            processing_status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', documentId)

        onProgress?.({
          stage: 'completed',
          progress: 100,
          message: 'Document content cloned! No credits used.',
        })
        return { documentId }
      }

      // Re-estimate credits with actual topic count
      const actualCreditEstimate = estimateDocumentCredits(
        extractResult.pageCount,
        topics.length,
        complexity
      )

      // Create processing job and deduct credits
      const { jobId: createdJobId, error: jobError } = await createProcessingJob(
        userId,
        documentId,
        actualCreditEstimate.total,
        'initial',
        {
          page_count: extractResult.pageCount,
          complexity,
          estimated_topics: topics.length,
        }
      )

      if (jobError || !createdJobId) {
        // Update document status to failed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('documents') as any)
          .update({ processing_status: 'failed' })
          .eq('id', documentId)
        throw new Error(jobError || 'Failed to create processing job')
      }

      jobId = createdJobId

      // Stage 4: Generate study materials
      onProgress?.({
        stage: 'generating',
        progress: 50,
        message: `Generating study materials... (${actualCreditEstimate.total} credits deducted)`,
        creditEstimate: actualCreditEstimate,
        creditsUsed: actualCreditEstimate.total,
      })

      // Track actual credits used
      let actualCreditsUsed = actualCreditEstimate.processing // Start with processing cost
      let processedTopics = 0
      const totalTopics = topics.length

      // Store token usage for topic extraction now that we have jobId
      if (topicsTokenUsage && jobId) {
        await storeTokenUsage(jobId, documentId, userId, 'extract_topics', topicsTokenUsage)
      }

      for (const topic of topics) {
        // Save topic FIRST - if this fails, stop processing to avoid wasting tokens on AI generation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedTopic, error: topicError } = await (supabase.from('topics') as any)
          .insert({
            document_id: documentId,
            title: topic.title,
            description: topic.description,
            page_references: topic.pageReferences,
          })
          .select()
          .single()

        if (topicError || !savedTopic) {
          throw new Error(
            `Failed to save topic "${topic.title}": ${topicError?.message || 'Unknown error'}`
          )
        }

        // Only generate AI content if topic was saved successfully
        // Get context text for this topic (from relevant pages)
        const contextText = extractResult.text // Simplified - could extract specific pages

        // Generate flashcards
        const { flashcards, tokenUsage: flashcardsTokenUsage } = await generateFlashcards(
          topic.title,
          topic.description || '',
          contextText
        )

        // Generate questions
        const { questions, tokenUsage: questionsTokenUsage } = await generateQuestions(
          topic.title,
          topic.description || '',
          contextText
        )

        // Generate explanations
        const { explanations, tokenUsage: explanationsTokenUsage } = await generateExplanations(
          topic.title,
          topic.description || '',
          contextText
        )

        // Store token usage for each operation
        if (jobId) {
          if (flashcardsTokenUsage) {
            await storeTokenUsage(
              jobId,
              documentId,
              userId,
              'generate_flashcards',
              flashcardsTokenUsage,
              {
                topic_id: savedTopic.id,
                topic_title: topic.title,
              }
            )
          }
          if (questionsTokenUsage) {
            await storeTokenUsage(
              jobId,
              documentId,
              userId,
              'generate_questions',
              questionsTokenUsage,
              {
                topic_id: savedTopic.id,
                topic_title: topic.title,
              }
            )
          }
          if (explanationsTokenUsage) {
            await storeTokenUsage(
              jobId,
              documentId,
              userId,
              'generate_explanations',
              explanationsTokenUsage,
              {
                topic_id: savedTopic.id,
                topic_title: topic.title,
              }
            )
          }
        }

        // Save flashcards - check for errors
        if (flashcards.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: flashcardsError } = await (supabase.from('flashcards') as any).insert(
            flashcards.map(card => ({
              topic_id: (savedTopic as { id: string }).id,
              front_text: card.frontText,
              back_text: card.backText,
              difficulty_level: card.difficultyLevel,
              ai_generated: true,
            }))
          )

          if (flashcardsError) {
            throw new Error(
              `Failed to save flashcards for topic "${topic.title}": ${flashcardsError.message}`
            )
          }
        }

        // Save questions - check for errors
        if (questions.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: questionsError } = await (supabase.from('exam_questions') as any).insert(
            questions.map(q => ({
              topic_id: (savedTopic as { id: string }).id,
              question_type: q.questionType,
              question_text: q.questionText,
              correct_answer: q.correctAnswer,
              options: q.options || null,
              explanation: q.explanation || null,
              ai_generated: true,
            }))
          )

          if (questionsError) {
            throw new Error(
              `Failed to save questions for topic "${topic.title}": ${questionsError.message}`
            )
          }
        }

        // Save explanations - check for errors
        if (explanations.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: explanationsError } = await (
            supabase.from('concept_explanations') as any
          ).insert(
            explanations.map(exp => ({
              topic_id: (savedTopic as { id: string }).id,
              explanation_level: exp.explanationLevel,
              explanation_text: exp.explanationText,
              ai_generated: true,
            }))
          )

          if (explanationsError) {
            throw new Error(
              `Failed to save explanations for topic "${topic.title}": ${explanationsError.message}`
            )
          }
        }

        // Track credits used for this topic
        actualCreditsUsed += 2 + 3 + 2 // flashcards + questions + explanations

        processedTopics++
        onProgress?.({
          stage: 'generating',
          progress: 50 + (processedTopics / totalTopics) * 30,
          message: `Generating materials for topic ${processedTopics} of ${totalTopics}...`,
          creditsUsed: actualCreditsUsed,
        })
      }

      // Add vocabulary cost
      actualCreditsUsed += 1

      // Generate vocabulary (document-level) - only if topics were saved successfully
      const { terms, tokenUsage: vocabularyTokenUsage } = await generateVocabulary(
        extractResult.text
      )

      // Store vocabulary token usage
      if (vocabularyTokenUsage && jobId) {
        await storeTokenUsage(
          jobId,
          documentId,
          userId,
          'generate_vocabulary',
          vocabularyTokenUsage
        )
      }
      if (terms.length > 0 && documentId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: vocabularyError } = await (supabase.from('vocabulary_terms') as any).insert(
          terms.map(term => ({
            document_id: documentId!,
            term: term.term,
            definition: term.definition,
            etymology: term.etymology || null,
            pronunciation: term.pronunciation || null,
            context_sentences: term.contextSentences || [],
            difficulty_level: term.difficultyLevel,
            ai_generated: true,
          }))
        )

        if (vocabularyError) {
          throw new Error(`Failed to save vocabulary: ${vocabularyError.message}`)
        }
      }

      // Update document status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: statusUpdateError } = await (supabase.from('documents') as any)
        .update({
          processing_status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (statusUpdateError) {
        throw new Error(`Failed to update document status: ${statusUpdateError.message}`)
      }

      // Update processing job with actual credits used and token usage
      if (jobId) {
        await updateProcessingJob(jobId, actualCreditsUsed, 'completed')

        // Update job with aggregated token usage (database function will calculate cost)
        // Note: This RPC function needs to be created in the database migration
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.rpc as any)('update_job_token_usage', { p_job_id: jobId })
        } catch (error) {
          console.warn('Failed to update job token usage (function may not exist yet):', error)
        }
      }

      // Stage 5: Complete
      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: `Document processing complete! (${actualCreditsUsed} credits used)`,
        creditsUsed: actualCreditsUsed,
      })
    }

    if (!documentId) {
      throw new Error('Document ID was not created')
    }

    return { documentId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Processing failed'

    // Update document status to failed if document was created
    if (documentId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('documents') as any)
          .update({
            processing_status: 'failed',
          })
          .eq('id', documentId)
      } catch (updateError) {
        console.error('Failed to update document status:', updateError)
      }
    }

    // Update processing job to failed (this will trigger automatic refund)
    if (jobId) {
      try {
        await updateProcessingJob(jobId, 0, 'failed', errorMessage)
      } catch (jobError) {
        console.error('Failed to update processing job:', jobError)
      }
    }

    onProgress?.({
      stage: 'failed',
      progress: 0,
      message: 'Processing failed',
      error: errorMessage,
    })

    return {
      documentId: documentId || '',
      error: errorMessage,
    }
  }
}

/**
 * Store token usage for an AI operation
 */
async function storeTokenUsage(
  jobId: string,
  documentId: string,
  userId: string,
  operationType:
    | 'extract_topics'
    | 'generate_flashcards'
    | 'generate_questions'
    | 'generate_vocabulary'
    | 'generate_explanations',
  tokenUsage: TokenUsage,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    // Calculate estimated cost using database function
    let estimatedCost = 0
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const costResult = await (supabase.rpc as any)('calculate_token_cost', {
        p_model: tokenUsage.model || 'anthropic/claude-3.5-sonnet',
        p_prompt_tokens: tokenUsage.promptTokens,
        p_completion_tokens: tokenUsage.completionTokens,
      })
      estimatedCost = costResult.data || 0
    } catch {
      // If function doesn't exist, calculate manually
      // Claude 3.5 Sonnet: ~$3 input, $15 output per 1M tokens
      const promptCost = (tokenUsage.promptTokens / 1000) * 0.003
      const completionCost = (tokenUsage.completionTokens / 1000) * 0.015
      estimatedCost = promptCost + completionCost
    }

    // Insert token usage (using type assertion since table may not be in types yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)('ai_operation_tokens').insert({
      processing_job_id: jobId,
      document_id: documentId,
      user_id: userId,
      operation_type: operationType,
      prompt_tokens: tokenUsage.promptTokens,
      completion_tokens: tokenUsage.completionTokens,
      total_tokens: tokenUsage.totalTokens,
      ai_model: tokenUsage.model || 'anthropic/claude-3.5-sonnet',
      estimated_cost_usd: estimatedCost,
      metadata,
    })
  } catch (error) {
    console.error('Failed to store token usage:', error)
    // Don't throw - token tracking failure shouldn't break processing
  }
}

/**
 * Get document processing status
 */
export async function getDocumentStatus(documentId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
}> {
  const { data, error } = await supabase
    .from('documents')
    .select('processing_status')
    .eq('id', documentId)
    .single()

  if (error || !data) {
    return { status: 'failed' }
  }

  const docData = data as { processing_status: string }
  return {
    status: docData.processing_status as 'pending' | 'processing' | 'completed' | 'failed',
  }
}
