/**
 * Study Credits Service
 * Manages credit balance, transactions, and deductions
 */

import { supabase } from './supabase'

export interface CreditBalance {
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
}

export interface CreditTransaction {
  id: string
  amount: number
  transactionType: 'purchase' | 'refund' | 'processing' | 'generation' | 'bonus' | 'gift' | 'adjustment'
  referenceType?: string
  referenceId?: string
  description: string
  metadata?: Record<string, any>
  balanceAfter: number
  createdAt: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  priceAmount: number
  priceCurrency: 'USD' | 'NGN'
  countryCode?: string
  bonusCredits: number
  description?: string
}

export interface CreditEstimate {
  processing: number
  flashcards: number
  questions: number
  vocabulary: number
  explanations: number
  total: number
}

export interface ProcessingJob {
  id: string
  documentId: string
  estimatedCredits: number
  actualCredits?: number
  processingType: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  creditsDeductedAt?: string
  refundedAt?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<{
  balance: CreditBalance | null
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, lifetime_earned, lifetime_spent')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no record exists, return zero balance
      if (error.code === 'PGRST116') {
        return {
          balance: {
            balance: 0,
            lifetimeEarned: 0,
            lifetimeSpent: 0,
          },
        }
      }
      return { balance: null, error: error.message }
    }

    const creditData = data as { balance: number; lifetime_earned: number; lifetime_spent: number } | null
    return {
      balance: creditData ? {
        balance: creditData.balance || 0,
        lifetimeEarned: creditData.lifetime_earned || 0,
        lifetimeSpent: creditData.lifetime_spent || 0,
      } : {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
      },
    }
  } catch (error) {
    return {
      balance: null,
      error: error instanceof Error ? error.message : 'Failed to fetch credit balance',
    }
  }
}

/**
 * Get credit transaction history
 */
export async function getCreditTransactions(
  userId: string,
  limit = 50
): Promise<{
  transactions: CreditTransaction[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { transactions: [], error: error.message }
    }

    type TransactionRow = {
      id: string
      amount: number
      transaction_type: string
      reference_type: string | null
      reference_id: string | null
      description: string
      metadata: Record<string, any>
      balance_after: number
      created_at: string
    }
    const transactions = (data || []) as TransactionRow[]
    return {
      transactions: transactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        transactionType: tx.transaction_type as CreditTransaction['transactionType'],
        referenceType: tx.reference_type || undefined,
        referenceId: tx.reference_id || undefined,
        description: tx.description,
        metadata: tx.metadata || {},
        balanceAfter: tx.balance_after,
        createdAt: tx.created_at,
      })),
    }
  } catch (error) {
    return {
      transactions: [],
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    }
  }
}

/**
 * Get available credit packages
 */
export async function getCreditPackages(
  countryCode?: string
): Promise<{
  packages: CreditPackage[]
  error?: string
}> {
  try {
    let query = supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // Filter by country if provided
    if (countryCode) {
      query = query.or(`country_code.is.null,country_code.eq.${countryCode}`)
    }

    const { data, error } = await query

    if (error) {
      return { packages: [], error: error.message }
    }

    type PackageRow = {
      id: string
      name: string
      credits: number
      price_amount: string
      price_currency: 'USD' | 'NGN'
      country_code: string | null
      bonus_credits: number
      description: string | null
    }
    const packages = (data || []) as PackageRow[]
    return {
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        priceAmount: parseFloat(pkg.price_amount),
        priceCurrency: pkg.price_currency as 'USD' | 'NGN',
        countryCode: pkg.country_code || undefined,
        bonusCredits: pkg.bonus_credits || 0,
        description: pkg.description || undefined,
      })),
    }
  } catch (error) {
    return {
      packages: [],
      error: error instanceof Error ? error.message : 'Failed to fetch packages',
    }
  }
}

/**
 * Estimate credits needed for document processing
 */
export function estimateDocumentCredits(
  pageCount: number,
  estimatedTopics: number = 5,
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): CreditEstimate {
  // Base processing cost (with complexity multiplier)
  const complexityMultiplier = {
    simple: 1.0,
    medium: 1.5,
    complex: 2.0,
  }

  const processing = Math.floor(pageCount * complexityMultiplier[complexity])

  // Content generation costs
  const flashcards = estimatedTopics * 2
  const questions = estimatedTopics * 3
  const vocabulary = 1 // Flat rate per document
  const explanations = estimatedTopics * 2

  const total = processing + flashcards + questions + vocabulary + explanations

  return {
    processing,
    flashcards,
    questions,
    vocabulary,
    explanations,
    total,
  }
}

/**
 * Create a processing job and deduct credits
 * This should be called BEFORE processing starts
 */
export async function createProcessingJob(
  userId: string,
  documentId: string,
  estimatedCredits: number,
  processingType: 'initial' | 'regenerate_flashcards' | 'regenerate_questions' | 'regenerate_explanations' | 'regenerate_vocabulary',
  metadata: Record<string, any> = {}
): Promise<{
  jobId: string | null
  newBalance: number | null
  error?: string
}> {
  try {
    // Check balance first
    const { balance, error: balanceError } = await getCreditBalance(userId)
    if (balanceError || !balance) {
      return { jobId: null, newBalance: null, error: balanceError || 'Failed to check balance' }
    }

    if (balance.balance < estimatedCredits) {
      return {
        jobId: null,
        newBalance: balance.balance,
        error: `Insufficient credits. You have ${balance.balance} credits, but need ${estimatedCredits}.`,
      }
    }

    // Create processing job
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job, error: jobError } = await (supabase.from('document_processing_jobs') as any)
      .insert({
        document_id: documentId,
        user_id: userId,
        estimated_credits: estimatedCredits,
        processing_type: processingType,
        status: 'pending',
        metadata,
      })
      .select()
      .single()

    if (jobError || !job) {
      return { jobId: null, newBalance: null, error: jobError?.message || 'Failed to create job' }
    }

    const jobData = job as { id: string }

    // Deduct credits using database function (transaction-safe)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: deductError } = await (supabase.rpc as any)('deduct_credits_from_user', {
      p_user_id: userId,
      p_amount: estimatedCredits,
      p_transaction_type: 'processing',
      p_description: `Processing document: ${processingType}`,
      p_reference_type: 'job',
      p_reference_id: jobData.id,
      p_metadata: {
        estimated_credits: estimatedCredits,
        processing_type: processingType,
        ...metadata,
      },
    })

    if (deductError) {
      // Rollback: delete the job if credit deduction failed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('document_processing_jobs') as any).delete().eq('id', jobData.id)
      return {
        jobId: null,
        newBalance: null,
        error: `Failed to deduct credits: ${deductError.message}`,
      }
    }

    // Update job with deduction timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('document_processing_jobs') as any)
      .update({
        status: 'processing',
        credits_deducted_at: new Date().toISOString(),
      })
      .eq('id', jobData.id)

    return {
      jobId: jobData.id,
      newBalance: result as number,
    }
  } catch (error) {
    return {
      jobId: null,
      newBalance: null,
      error: error instanceof Error ? error.message : 'Failed to create processing job',
    }
  }
}

/**
 * Update processing job with actual credits consumed
 */
export async function updateProcessingJob(
  jobId: string,
  actualCredits: number,
  status: 'completed' | 'failed',
  errorMessage?: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const updateData: any = {
      actual_credits: actualCredits,
      status,
      updated_at: new Date().toISOString(),
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('document_processing_jobs') as any)
      .update(updateData)
      .eq('id', jobId)

    if (error) {
      return { success: false, error: error.message }
    }

    // If failed, refund the difference (if actual < estimated)
    if (status === 'failed') {
      const { data: job } = await supabase
        .from('document_processing_jobs')
        .select('user_id, estimated_credits, actual_credits')
        .eq('id', jobId)
        .single()
      
      type JobRow = { user_id: string; estimated_credits: number; actual_credits: number | null }
      const jobData = job as JobRow | null

      if (jobData && jobData.estimated_credits > 0) {
        // Refund full estimated amount
        await refundCredits(jobData.user_id, jobData.estimated_credits, 'Processing failed', 'job', jobId)
      }
    } else if (status === 'completed') {
      // If actual credits differ from estimated, adjust
      const { data: job } = await supabase
        .from('document_processing_jobs')
        .select('user_id, estimated_credits, actual_credits')
        .eq('id', jobId)
        .single()
      
      type JobRow = { user_id: string; estimated_credits: number; actual_credits: number | null }
      const jobData = job as JobRow | null

      if (jobData && jobData.estimated_credits !== actualCredits) {

      type JobRow = { user_id: string; estimated_credits: number; actual_credits: number | null }
      const jobData = job as JobRow | null

      if (jobData && jobData.estimated_credits > 0) {
        // Refund full estimated amount
        await refundCredits(jobData.user_id, jobData.estimated_credits, 'Processing failed', 'job', jobId)
      }
    } else if (status === 'completed') {
      // If actual credits differ from estimated, adjust
      const { data: job } = await supabase
        .from('document_processing_jobs')
        .select('user_id, estimated_credits, actual_credits')
        .eq('id', jobId)
        .single()

      type JobRow = { user_id: string; estimated_credits: number; actual_credits: number | null }
      const jobData = job as JobRow | null

      if (jobData && jobData.estimated_credits !== actualCredits) {
        const difference = jobData.estimated_credits - actualCredits
        if (difference > 0) {
          // Refund excess
          await refundCredits(jobData.user_id, difference, 'Processing used fewer credits than estimated', 'job', jobId)
        } else {
          // Charge additional (shouldn't happen often, but handle it)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: addError } = await (supabase.rpc as any)('deduct_credits_from_user', {
            p_user_id: jobData.user_id,
            p_amount: Math.abs(difference),
            p_transaction_type: 'processing',
            p_description: 'Additional credits for processing',
            p_reference_type: 'job',
            p_reference_id: jobId,
            p_metadata: { adjustment: true },
          })
          if (addError) {
            console.error('Failed to charge additional credits:', addError)
          }
        }
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update processing job',
    }
  }
}

/**
 * Refund credits to user
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceType?: string,
  referenceId?: string
): Promise<{
  success: boolean
  newBalance?: number
  error?: string
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('add_credits_to_user', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: 'refund',
      p_description: reason,
      p_reference_type: referenceType || null,
      p_reference_id: referenceId || null,
      p_metadata: {},
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Update processing job if reference is a job
    if (referenceType === 'job' && referenceId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('document_processing_jobs') as any)
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('id', referenceId)
    }

    return {
      success: true,
      newBalance: data as number,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refund credits',
    }
  }
}

/**
 * Get processing job details
 */
export async function getProcessingJob(jobId: string): Promise<{
  job: ProcessingJob | null
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('document_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      return { job: null, error: error.message }
    }

    type JobRow = {
      id: string
      document_id: string
      estimated_credits: number
      actual_credits: number | null
      processing_type: string
      status: string
      credits_deducted_at: string | null
      refunded_at: string | null
      error_message: string | null
      metadata: Record<string, any>
    }
    const jobData = data as JobRow
    return {
      job: {
        id: jobData.id,
        documentId: jobData.document_id,
        estimatedCredits: jobData.estimated_credits,
        actualCredits: jobData.actual_credits || undefined,
        processingType: jobData.processing_type,
        status: jobData.status as ProcessingJob['status'],
        creditsDeductedAt: jobData.credits_deducted_at || undefined,
        refundedAt: jobData.refunded_at || undefined,
        errorMessage: jobData.error_message || undefined,
        metadata: jobData.metadata || {},
      },
    }
  } catch (error) {
    return {
      job: null,
      error: error instanceof Error ? error.message : 'Failed to fetch processing job',
    }
  }
}

