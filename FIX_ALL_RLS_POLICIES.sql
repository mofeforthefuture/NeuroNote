-- ============================================================================
-- COMPREHENSIVE RLS POLICY FIX
-- Fixes all RLS policies for topics, flashcards, exam_questions, 
-- vocabulary_terms, and concept_explanations
-- ============================================================================
-- This script ensures users can INSERT, UPDATE, DELETE, and SELECT
-- content from their own documents
-- ============================================================================

-- ============================================================================
-- 1. TOPICS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view topics from own documents" ON topics;
DROP POLICY IF EXISTS "Users can manage topics from own documents" ON topics;

-- Enable RLS (idempotent)
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view topics from their own documents
CREATE POLICY "Users can view topics from own documents" ON topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert topics into their own documents
CREATE POLICY "Users can insert topics into own documents" ON topics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update topics from their own documents
CREATE POLICY "Users can update topics from own documents" ON topics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete topics from their own documents
CREATE POLICY "Users can delete topics from own documents" ON topics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = topics.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. FLASHCARDS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view flashcards from own topics" ON flashcards;
DROP POLICY IF EXISTS "Users can manage flashcards from own topics" ON flashcards;

-- Enable RLS (idempotent)
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view flashcards from their own topics
CREATE POLICY "Users can view flashcards from own topics" ON flashcards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = flashcards.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert flashcards into their own topics
CREATE POLICY "Users can insert flashcards into own topics" ON flashcards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = flashcards.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update flashcards from their own topics
CREATE POLICY "Users can update flashcards from own topics" ON flashcards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = flashcards.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete flashcards from their own topics
CREATE POLICY "Users can delete flashcards from own topics" ON flashcards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = flashcards.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. EXAM QUESTIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view questions from own topics" ON exam_questions;
DROP POLICY IF EXISTS "Users can manage questions from own topics" ON exam_questions;

-- Enable RLS (idempotent)
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view questions from their own topics
CREATE POLICY "Users can view questions from own topics" ON exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = exam_questions.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert questions into their own topics
CREATE POLICY "Users can insert questions into own topics" ON exam_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = exam_questions.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update questions from their own topics
CREATE POLICY "Users can update questions from own topics" ON exam_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = exam_questions.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete questions from their own topics
CREATE POLICY "Users can delete questions from own topics" ON exam_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = exam_questions.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. VOCABULARY TERMS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view vocabulary from own documents" ON vocabulary_terms;
DROP POLICY IF EXISTS "Users can manage vocabulary from own documents" ON vocabulary_terms;

-- Enable RLS (idempotent)
ALTER TABLE vocabulary_terms ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view vocabulary from their own documents
CREATE POLICY "Users can view vocabulary from own documents" ON vocabulary_terms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = vocabulary_terms.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert vocabulary into their own documents
CREATE POLICY "Users can insert vocabulary into own documents" ON vocabulary_terms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = vocabulary_terms.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update vocabulary from their own documents
CREATE POLICY "Users can update vocabulary from own documents" ON vocabulary_terms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = vocabulary_terms.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete vocabulary from their own documents
CREATE POLICY "Users can delete vocabulary from own documents" ON vocabulary_terms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = vocabulary_terms.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. CONCEPT EXPLANATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view explanations from own topics" ON concept_explanations;
DROP POLICY IF EXISTS "Users can manage explanations from own topics" ON concept_explanations;

-- Enable RLS (idempotent)
ALTER TABLE concept_explanations ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view explanations from their own topics
CREATE POLICY "Users can view explanations from own topics" ON concept_explanations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = concept_explanations.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- INSERT: Users can insert explanations into their own topics
CREATE POLICY "Users can insert explanations into own topics" ON concept_explanations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = concept_explanations.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update explanations from their own topics
CREATE POLICY "Users can update explanations from own topics" ON concept_explanations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = concept_explanations.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete explanations from their own topics
CREATE POLICY "Users can delete explanations from own topics" ON concept_explanations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM topics
      JOIN documents ON documents.id = topics.document_id
      WHERE topics.id = concept_explanations.topic_id
      AND documents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all policies were created correctly

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename IN ('topics', 'flashcards', 'exam_questions', 'vocabulary_terms', 'concept_explanations')
ORDER BY tablename, cmd, policyname;

