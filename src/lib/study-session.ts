/**
 * Study Session Service
 * Handles study session tracking and progress updates
 */

import { supabase } from './supabase'

/**
 * SM-2 Algorithm for spaced repetition
 * Returns new interval, ease factor, and next review date
 */
function calculateSM2(
  easeFactor: number,
  interval: number,
  quality: number // 0-5: 0=blackout, 1=incorrect, 2=incorrect but remembered, 3=correct with difficulty, 4=correct, 5=perfect
): {
  newEaseFactor: number
  newInterval: number
  nextReviewAt: Date
} {
  let newEaseFactor = easeFactor
  let newInterval = interval

  // Update ease factor
  newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  // Calculate new interval
  if (quality < 3) {
    // Incorrect - reset interval
    newInterval = 1
  } else {
    if (interval === 0) {
      newInterval = 1
    } else if (interval === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
  }

  // Calculate next review date
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)

  return {
    newEaseFactor,
    newInterval,
    nextReviewAt,
  }
}

/**
 * Update flashcard progress after review
 */
export async function updateFlashcardProgress(
  flashcardId: string,
  gotIt: boolean
): Promise<{ error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Get existing progress or create new
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_type', 'flashcard')
      .eq('content_id', flashcardId)
      .single()

    type ProgressRow = {
      id: string
      ease_factor: number
      interval_days: number
      mastery_level: number
      review_count: number
      correct_count: number
      incorrect_count: number
    }
    const existingProgressRow = existingProgress as ProgressRow | null
    
    const quality = gotIt ? 4 : 1 // 4 = correct, 1 = incorrect
    const currentEaseFactor = existingProgressRow?.ease_factor || 2.5
    const currentInterval = existingProgressRow?.interval_days || 0

    const { newEaseFactor, newInterval, nextReviewAt } = calculateSM2(
      currentEaseFactor,
      currentInterval,
      quality
    )

    const progressData = {
      user_id: user.id,
      content_type: 'flashcard' as const,
      content_id: flashcardId,
      mastery_level: gotIt
        ? Math.min(100, (existingProgressRow?.mastery_level || 0) + 10)
        : Math.max(0, (existingProgressRow?.mastery_level || 0) - 5),
      last_reviewed_at: new Date().toISOString(),
      next_review_at: nextReviewAt.toISOString(),
      review_count: (existingProgressRow?.review_count || 0) + 1,
      correct_count: gotIt
        ? (existingProgressRow?.correct_count || 0) + 1
        : existingProgressRow?.correct_count || 0,
      incorrect_count: gotIt
        ? existingProgressRow?.incorrect_count || 0
        : (existingProgressRow?.incorrect_count || 0) + 1,
      ease_factor: newEaseFactor,
      interval_days: newInterval,
    }

    if (existingProgressRow) {
      // Update existing progress
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('user_progress') as any)
        .update(progressData)
        .eq('id', existingProgressRow.id)

      if (error) throw error
    } else {
      // Create new progress record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('user_progress') as any).insert(progressData)

      if (error) throw error
    }

    return {}
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update progress',
    }
  }
}

/**
 * Update question progress after answering
 */
export async function updateQuestionProgress(
  questionId: string,
  isCorrect: boolean
): Promise<{ error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Get existing progress or create new
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_type', 'exam_question')
      .eq('content_id', questionId)
      .single()

    type ProgressRow = {
      id: string
      mastery_level: number
      review_count: number
      correct_count: number
      incorrect_count: number
      ease_factor: number
      interval_days: number
    }
    const progressRow = existingProgress as ProgressRow | null
    
    const progressData = {
      user_id: user.id,
      content_type: 'exam_question' as const,
      content_id: questionId,
      mastery_level: isCorrect
        ? Math.min(100, (progressRow?.mastery_level || 0) + 15)
        : Math.max(0, (progressRow?.mastery_level || 0) - 10),
      last_reviewed_at: new Date().toISOString(),
      review_count: (progressRow?.review_count || 0) + 1,
      correct_count: isCorrect
        ? (progressRow?.correct_count || 0) + 1
        : progressRow?.correct_count || 0,
      incorrect_count: isCorrect
        ? progressRow?.incorrect_count || 0
        : (progressRow?.incorrect_count || 0) + 1,
      ease_factor: progressRow?.ease_factor || 2.5,
      interval_days: progressRow?.interval_days || 1,
    }

    if (progressRow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('user_progress') as any)
        .update(progressData)
        .eq('id', progressRow.id)

      if (error) throw error
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('user_progress') as any).insert(progressData)

      if (error) throw error
    }

    return {}
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update progress',
    }
  }
}

/**
 * Get study progress for a topic
 */
export async function getTopicProgress(topicId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { progress: null, error: 'User not authenticated' }
    }

    // Get all flashcards and questions for this topic
    const [flashcardsResult, questionsResult] = await Promise.all([
      supabase.from('flashcards').select('id').eq('topic_id', topicId),
      supabase.from('exam_questions').select('id').eq('topic_id', topicId),
    ])

    type FlashcardRow = { id: string }
    type QuestionRow = { id: string }
    const flashcardIds = ((flashcardsResult.data || []) as FlashcardRow[]).map((f) => f.id)
    const questionIds = ((questionsResult.data || []) as QuestionRow[]).map((q) => q.id)

    // Get progress for all content
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .or(
        `content_id.in.(${flashcardIds.join(',')}),content_id.in.(${questionIds.join(',')})`
      )

    // Calculate overall progress
    const totalItems = flashcardIds.length + questionIds.length
    type ProgressRow = {
      mastery_level: number
    }
    const masteredItems =
      ((progressData || []) as ProgressRow[]).filter((p) => p.mastery_level >= 80).length || 0

    return {
      progress: {
        total: totalItems,
        mastered: masteredItems,
        percentage: totalItems > 0 ? Math.round((masteredItems / totalItems) * 100) : 0,
        details: progressData || [],
      },
    }
  } catch (error) {
    return {
      progress: null,
      error: error instanceof Error ? error.message : 'Failed to get progress',
    }
  }
}

