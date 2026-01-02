/**
 * Token Analytics Service
 * Provides insights into token usage for cost analysis and credit pricing
 */

import { supabase } from './supabase'

export interface TokenUsageStats {
  operationType: string
  operationCount: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCostUsd: number
  avgTokensPerOperation: number
  avgCostPerOperation: number
  firstOperation: string
  lastOperation: string
}

export interface DocumentTokenUsage {
  documentId: string
  documentTitle: string
  operationCount: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCostUsd: number
  creditsCharged: number
}

export interface ProcessingJobTokenUsage {
  jobId: string
  documentId: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
  estimatedCostUsd: number
  aiModel?: string
  operations: Array<{
    operationType: string
    tokens: number
    cost: number
  }>
}

/**
 * Get token usage summary by operation type
 */
export async function getTokenUsageSummary(): Promise<{
  stats: TokenUsageStats[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('token_usage_summary')
      .select('*')

    if (error) {
      return { stats: [], error: error.message }
    }

    type SummaryRow = {
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
    const rows = (data || []) as SummaryRow[]
    return {
      stats: rows.map(row => ({
        operationType: row.operation_type,
        operationCount: row.operation_count,
        totalPromptTokens: row.total_prompt_tokens,
        totalCompletionTokens: row.total_completion_tokens,
        totalTokens: row.total_tokens,
        totalCostUsd: parseFloat(row.total_cost_usd || '0'),
        avgTokensPerOperation: parseFloat(row.avg_tokens_per_operation || '0'),
        avgCostPerOperation: parseFloat(row.avg_cost_per_operation || '0'),
        firstOperation: row.first_operation,
        lastOperation: row.last_operation,
      })),
    }
  } catch (error) {
    return {
      stats: [],
      error: error instanceof Error ? error.message : 'Failed to fetch token usage summary',
    }
  }
}

/**
 * Get token usage for a specific document
 */
export async function getDocumentTokenUsage(documentId: string): Promise<{
  usage: DocumentTokenUsage | null
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('document_token_usage')
      .select('*')
      .eq('document_id', documentId)
      .single()

    if (error) {
      return { usage: null, error: error.message }
    }

    type DocumentUsageRow = {
      document_id: string
      document_title: string
      operation_count: number
      total_prompt_tokens: number
      total_completion_tokens: number
      total_tokens: number
      total_cost_usd: string
      credits_charged: number | null
    }
    const usageData = data as DocumentUsageRow
    return {
      usage: {
        documentId: usageData.document_id,
        documentTitle: usageData.document_title,
        operationCount: usageData.operation_count || 0,
        totalPromptTokens: usageData.total_prompt_tokens || 0,
        totalCompletionTokens: usageData.total_completion_tokens || 0,
        totalTokens: usageData.total_tokens || 0,
        totalCostUsd: parseFloat(usageData.total_cost_usd || '0'),
        creditsCharged: usageData.credits_charged || 0,
      },
    }
  } catch (error) {
    return {
      usage: null,
      error: error instanceof Error ? error.message : 'Failed to fetch document token usage',
    }
  }
}

/**
 * Get token usage for a processing job
 */
export async function getProcessingJobTokenUsage(jobId: string): Promise<{
  usage: ProcessingJobTokenUsage | null
  error?: string
}> {
  try {
    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('document_processing_jobs')
      .select('id, document_id, total_tokens, prompt_tokens, completion_tokens, estimated_cost_usd, ai_model')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return { usage: null, error: jobError?.message || 'Job not found' }
    }

    type JobRow = {
      id: string
      document_id: string
      total_tokens: number | null
      prompt_tokens: number | null
      completion_tokens: number | null
      estimated_cost_usd: string | null
      ai_model: string | null
    }
    const jobData = job as JobRow

    // Get individual operations
    const { data: operations } = await supabase
      .from('ai_operation_tokens')
      .select('operation_type, total_tokens, estimated_cost_usd')
      .eq('processing_job_id', jobId)

    type OperationRow = {
      operation_type: string
      total_tokens: number
      estimated_cost_usd: string
    }
    const operationRows = (operations || []) as OperationRow[]

    return {
      usage: {
        jobId: jobData.id,
        documentId: jobData.document_id,
        totalTokens: jobData.total_tokens || 0,
        promptTokens: jobData.prompt_tokens || 0,
        completionTokens: jobData.completion_tokens || 0,
        estimatedCostUsd: parseFloat(jobData.estimated_cost_usd || '0'),
        aiModel: jobData.ai_model || undefined,
        operations: operationRows.map(op => ({
          operationType: op.operation_type,
          tokens: op.total_tokens,
          cost: parseFloat(op.estimated_cost_usd || '0'),
        })),
      },
    }
  } catch (error) {
    return {
      usage: null,
      error: error instanceof Error ? error.message : 'Failed to fetch job token usage',
    }
  }
}

/**
 * Calculate credit markup based on token costs
 * Returns suggested credit cost based on actual AI costs
 */
export function calculateCreditMarkup(
  tokenCostUsd: number,
  markupMultiplier: number = 3.0 // 3x markup by default (200% profit margin)
): number {
  // Convert USD cost to credits
  // Example: If $0.10 cost, with 3x markup = $0.30 = 30 credits (assuming $0.01 per credit)
  const creditCost = Math.ceil(tokenCostUsd * markupMultiplier * 100) // $0.01 per credit
  return creditCost
}

/**
 * Get cost efficiency metrics
 */
export async function getCostEfficiencyMetrics(): Promise<{
  totalCostUsd: number
  totalCreditsCharged: number
  averageCostPerCredit: number
  markupPercentage: number
  error?: string
}> {
  try {
    // Get total cost from all operations
    const { data: costData, error: costError } = await supabase
      .from('ai_operation_tokens')
      .select('estimated_cost_usd')

    if (costError) {
      return {
        totalCostUsd: 0,
        totalCreditsCharged: 0,
        averageCostPerCredit: 0,
        markupPercentage: 0,
        error: costError.message,
      }
    }

    type CostRow = { estimated_cost_usd: string }
    const costRows = (costData || []) as CostRow[]
    const totalCostUsd = costRows.reduce((sum, row) => {
      return sum + parseFloat(row.estimated_cost_usd || '0')
    }, 0)

    // Get total credits charged
    const { data: creditsData, error: creditsError } = await supabase
      .from('document_processing_jobs')
      .select('actual_credits')
      .not('actual_credits', 'is', null)

    if (creditsError) {
      return {
        totalCostUsd,
        totalCreditsCharged: 0,
        averageCostPerCredit: 0,
        markupPercentage: 0,
        error: creditsError.message,
      }
    }

    type CreditsRow = { actual_credits: number }
    const creditsRows = (creditsData || []) as CreditsRow[]
    const totalCreditsCharged = creditsRows.reduce((sum, row) => {
      return sum + (row.actual_credits || 0)
    }, 0)

    const averageCostPerCredit = totalCreditsCharged > 0 
      ? totalCostUsd / totalCreditsCharged 
      : 0

    // Calculate markup (assuming $0.01 per credit)
    const revenueUsd = totalCreditsCharged * 0.01
    const markupPercentage = totalCostUsd > 0 
      ? ((revenueUsd - totalCostUsd) / totalCostUsd) * 100 
      : 0

    return {
      totalCostUsd,
      totalCreditsCharged,
      averageCostPerCredit,
      markupPercentage,
    }
  } catch (error) {
    return {
      totalCostUsd: 0,
      totalCreditsCharged: 0,
      averageCostPerCredit: 0,
      markupPercentage: 0,
      error: error instanceof Error ? error.message : 'Failed to calculate metrics',
    }
  }
}

