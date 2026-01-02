/**
 * AI Service using OpenRouter API
 * Generates study materials from document content
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

if (!OPENROUTER_API_KEY) {
  console.warn('VITE_OPENROUTER_API_KEY not set - AI features will not work')
}

/**
 * Token usage information from API response
 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model?: string
}

/**
 * Call OpenRouter API with a prompt
 * Returns both content and token usage for cost tracking
 */
async function callAI(
  prompt: string, 
  model = 'anthropic/claude-3.5-sonnet'
): Promise<{
  content: string
  tokenUsage?: TokenUsage
  error?: string
}> {
  if (!OPENROUTER_API_KEY) {
    return {
      content: '',
      error: 'OpenRouter API key not configured',
    }
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'NeuroNote',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    if (!content) {
      throw new Error('No content returned from AI')
    }

    // Extract token usage from response
    const tokenUsage: TokenUsage | undefined = data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
      model: model,
    } : undefined

    return { content, tokenUsage }
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'AI request failed',
    }
  }
}

/**
 * Extract topics from document text
 */
export async function extractTopics(text: string): Promise<{
  topics: Array<{
    title: string
    description?: string
    pageReferences: number[]
  }>
  tokenUsage?: TokenUsage
  error?: string
}> {
  const prompt = `Analyze the following academic document and extract key topics/concepts. 
For each topic, provide:
1. A clear, concise title
2. A brief description (1-2 sentences)
3. Page numbers where this topic appears (extract from "--- Page X ---" markers)

Return your response as a JSON array with this exact format:
[
  {
    "title": "Topic Title",
    "description": "Brief description",
    "pageReferences": [1, 2, 3]
  }
]

Document text:
${text.substring(0, 100000)} // Limit to prevent token limits

Only return valid JSON, no other text.`

  const { content, tokenUsage, error } = await callAI(prompt, 'anthropic/claude-3.5-sonnet')

  if (error) {
    return { topics: [], error }
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const topics = JSON.parse(jsonStr)

    return { topics: Array.isArray(topics) ? topics : [], tokenUsage }
  } catch (parseError) {
    return {
      topics: [],
      error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    }
  }
}

/**
 * Generate flashcards for a topic
 */
export async function generateFlashcards(
  topicTitle: string,
  topicDescription: string,
  contextText: string
): Promise<{
  flashcards: Array<{
    frontText: string
    backText: string
    difficultyLevel: 'easy' | 'medium' | 'hard'
  }>
  tokenUsage?: TokenUsage
  error?: string
}> {
  const prompt = `Generate study flashcards for the topic: "${topicTitle}"

Description: ${topicDescription}

Context from document:
${contextText.substring(0, 5000)}

Create 3-5 flashcards with:
- Front: A clear question or prompt
- Back: A concise, accurate answer
- Difficulty: easy, medium, or hard

Return as JSON array:
[
  {
    "frontText": "Question or prompt",
    "backText": "Answer",
    "difficultyLevel": "easy"
  }
]

Only return valid JSON, no other text.`

  const { content, tokenUsage, error } = await callAI(prompt, 'anthropic/claude-3.5-sonnet')

  if (error) {
    return { flashcards: [], error }
  }

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const flashcards = JSON.parse(jsonStr)

    return { flashcards: Array.isArray(flashcards) ? flashcards : [], tokenUsage }
  } catch (parseError) {
    return {
      flashcards: [],
      error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    }
  }
}

/**
 * Generate practice questions for a topic
 */
export async function generateQuestions(
  topicTitle: string,
  topicDescription: string,
  contextText: string
): Promise<{
  questions: Array<{
    questionType: 'mcq' | 'short_answer' | 'true_false'
    questionText: string
    correctAnswer: string
    options?: Record<string, string>
    explanation?: string
  }>
  tokenUsage?: TokenUsage
  error?: string
}> {
  const prompt = `Generate practice questions for the topic: "${topicTitle}"

Description: ${topicDescription}

Context from document:
${contextText.substring(0, 5000)}

Create 2-4 questions of different types (MCQ, short answer, true/false).
For MCQ, provide options as an object with keys a, b, c, d.

Return as JSON array:
[
  {
    "questionType": "mcq",
    "questionText": "Question text",
    "correctAnswer": "a",
    "options": {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"},
    "explanation": "Why this is correct"
  }
]

Only return valid JSON, no other text.`

  const { content, tokenUsage, error } = await callAI(prompt, 'anthropic/claude-3.5-sonnet')

  if (error) {
    return { questions: [], error }
  }

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const questions = JSON.parse(jsonStr)

    return { questions: Array.isArray(questions) ? questions : [], tokenUsage }
  } catch (parseError) {
    return {
      questions: [],
      error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    }
  }
}

/**
 * Generate vocabulary terms
 */
export async function generateVocabulary(
  text: string
): Promise<{
  terms: Array<{
    term: string
    definition: string
    etymology?: string
    pronunciation?: string
    contextSentences?: string[]
    difficultyLevel: 'easy' | 'medium' | 'hard'
  }>
  tokenUsage?: TokenUsage
  error?: string
}> {
  const prompt = `Extract key vocabulary terms from this academic document.

For each term, provide:
- Term: The word or phrase
- Definition: Clear, concise definition
- Etymology: Word origin (if relevant)
- Pronunciation: IPA or phonetic spelling (if helpful)
- Context sentences: 1-2 example sentences from the document
- Difficulty: easy, medium, or hard

Return as JSON array:
[
  {
    "term": "Word",
    "definition": "Definition",
    "etymology": "Origin",
    "pronunciation": "Pronunciation",
    "contextSentences": ["Sentence 1", "Sentence 2"],
    "difficultyLevel": "medium"
  }
]

Document text:
${text.substring(0, 50000)}

Only return valid JSON, no other text.`

  const { content, tokenUsage, error } = await callAI(prompt, 'anthropic/claude-3.5-sonnet')

  if (error) {
    return { terms: [], error }
  }

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const terms = JSON.parse(jsonStr)

    return { terms: Array.isArray(terms) ? terms : [], tokenUsage }
  } catch (parseError) {
    return {
      terms: [],
      error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    }
  }
}

/**
 * Generate concept explanations at different levels
 */
export async function generateExplanations(
  topicTitle: string,
  topicDescription: string,
  contextText: string
): Promise<{
  explanations: Array<{
    explanationLevel: 'eli5' | 'beginner' | 'intermediate' | 'advanced'
    explanationText: string
  }>
  tokenUsage?: TokenUsage
  error?: string
}> {
  const prompt = `Create explanations for the concept: "${topicTitle}"

Description: ${topicDescription}

Context:
${contextText.substring(0, 5000)}

Generate explanations at 4 levels:
1. ELI5 (Explain Like I'm 5) - Very simple, use analogies
2. Beginner - Simple but accurate
3. Intermediate - More detailed, assumes some knowledge
4. Advanced - Comprehensive, technical

Return as JSON array:
[
  {
    "explanationLevel": "eli5",
    "explanationText": "Simple explanation"
  },
  {
    "explanationLevel": "beginner",
    "explanationText": "Beginner explanation"
  },
  {
    "explanationLevel": "intermediate",
    "explanationText": "Intermediate explanation"
  },
  {
    "explanationLevel": "advanced",
    "explanationText": "Advanced explanation"
  }
]

Only return valid JSON, no other text.`

  const { content, tokenUsage, error } = await callAI(prompt, 'anthropic/claude-3.5-sonnet')

  if (error) {
    return { explanations: [], error }
  }

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const explanations = JSON.parse(jsonStr)

    return { explanations: Array.isArray(explanations) ? explanations : [], tokenUsage }
  } catch (parseError) {
    return {
      explanations: [],
      error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    }
  }
}

