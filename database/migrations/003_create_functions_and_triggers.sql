-- Create database functions and triggers
-- Run this after 002_create_schema.sql
-- This script is idempotent - safe to run multiple times

-- ============================================================================
-- FUNCTION: Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_flashcards_updated_at ON flashcards;
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
DROP TRIGGER IF EXISTS update_user_notes_updated_at ON user_notes;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at 
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at 
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at 
  BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Increment shared content usage count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_shared_content_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if shared_content_id is set (document is using shared content)
  IF NEW.shared_content_id IS NOT NULL THEN
    UPDATE shared_document_content
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.shared_content_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS increment_shared_content_usage ON documents;

CREATE TRIGGER increment_shared_content_usage 
  AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION increment_shared_content_usage();

-- ============================================================================
-- FUNCTION: Increment community member count (for Phase 2)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE study_communities
  SET member_count = member_count + 1
  WHERE id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger will be created when Phase 2 community tables are added
-- DROP TRIGGER IF EXISTS increment_member_count ON community_members;
-- CREATE TRIGGER increment_member_count AFTER INSERT ON community_members
--   FOR EACH ROW EXECUTE FUNCTION increment_community_member_count();

