-- ============================================================================
-- Fix Document Hash Constraint
-- 
-- The unique constraint on content_hash prevents multiple users from uploading
-- the same document. We need to allow duplicate hashes but ensure each user
-- can only have one document per hash.
-- ============================================================================

-- Drop the unique constraint on content_hash
DROP INDEX IF EXISTS idx_documents_content_hash;

-- Create a non-unique index for fast lookups (still allows duplicates)
CREATE INDEX idx_documents_content_hash ON documents(content_hash);

-- Add a unique constraint on (user_id, content_hash) to prevent same user
-- from uploading the same document twice
CREATE UNIQUE INDEX idx_documents_user_hash_unique ON documents(user_id, content_hash);

