-- Drop all tables in correct order (respecting foreign key constraints)
-- Run this script to clear the database before setting up fresh schema

-- Drop triggers first
DROP TRIGGER IF EXISTS increment_shared_content_usage ON documents;
DROP TRIGGER IF EXISTS increment_member_count ON community_members;
DROP TRIGGER IF EXISTS update_user_notes_updated_at ON user_notes;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
DROP TRIGGER IF EXISTS update_flashcards_updated_at ON flashcards;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Drop functions
DROP FUNCTION IF EXISTS increment_shared_content_usage();
DROP FUNCTION IF EXISTS increment_community_member_count();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS peer_explanations CASCADE;
DROP TABLE IF EXISTS shared_pack_content CASCADE;
DROP TABLE IF EXISTS shared_study_packs CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS study_communities CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS shared_document_content CASCADE;
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS concept_explanations CASCADE;
DROP TABLE IF EXISTS vocabulary_terms CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Note: auth.users is managed by Supabase Auth and should not be dropped

