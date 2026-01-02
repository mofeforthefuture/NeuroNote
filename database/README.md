# Database Setup Guide

This directory contains SQL migration scripts to set up the NeuroNote database schema.

## Prerequisites

- Supabase project (PostgreSQL database)
- Access to Supabase SQL Editor or `psql` client

## Quick Start: Reset and Setup Database

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run Migration Scripts in Order**
   - Open `001_drop_all_tables.sql`
   - Copy and paste into SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - Repeat for `002_create_schema.sql`
   - Repeat for `003_create_functions_and_triggers.sql`
   - **If you already ran 002 before**: Run `004_add_user_profiles_insert_policy.sql` to fix signup

### Option 2: Using psql Command Line

```bash
# Set your Supabase connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations in order
psql $DATABASE_URL -f migrations/001_drop_all_tables.sql
psql $DATABASE_URL -f migrations/002_create_schema.sql
psql $DATABASE_URL -f migrations/003_create_functions_and_triggers.sql
```

### Option 3: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
# npm install -g supabase

# Link to your project
supabase link --project-ref [YOUR-PROJECT-REF]

# Run migrations
supabase db reset
# Or apply migrations manually:
supabase db push
```

## Migration Scripts

### 001_drop_all_tables.sql
**Purpose**: Safely drops all existing tables, triggers, and functions
- Drops in correct order to handle foreign key constraints
- Preserves `auth.users` (managed by Supabase Auth)
- Safe to run multiple times (uses `IF EXISTS`)

### 002_create_schema.sql
**Purpose**: Creates all database tables, indexes, and RLS policies
- Creates 12 core tables (Phase 1)
- Sets up Row Level Security (RLS) policies
- Creates necessary indexes for performance

### 003_create_functions_and_triggers.sql
**Purpose**: Creates database functions and triggers
- Auto-updates `updated_at` timestamps
- Increments shared content usage counts
- Sets up community member count triggers (for Phase 2)

### 004_add_user_profiles_insert_policy.sql
**Purpose**: Adds missing INSERT policy for user_profiles
- Allows users to create their own profile during signup
- Fixes "row-level security policy" error during registration
- **Run this if you get RLS errors during signup**

## What Gets Created

### Core Tables (Phase 1)
1. `user_profiles` - Extended user information
2. `shared_document_content` - Deduplication storage
3. `documents` - PDF uploads and metadata
4. `topics` - Identified concepts from documents
5. `flashcards` - Study cards with spaced repetition
6. `exam_questions` - Practice questions
7. `vocabulary_terms` - Key terms with definitions
8. `concept_explanations` - ELI5 → Advanced explanations
9. `user_progress` - Learning progress tracking
10. `user_notes` - Personal notes per topic
11. `subscriptions` - Subscription and billing info
12. `payments` - Payment transaction history

### Security
- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Shared content is read-only for authenticated users

### Performance
- Indexes on all foreign keys
- Full-text search indexes on topics and vocabulary
- Composite indexes for common query patterns

## Verification

After running migrations, verify the setup:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Troubleshooting

### Error: "relation already exists"
- Run `001_drop_all_tables.sql` first to clear existing schema

### Error: "permission denied"
- Ensure you're using the service role key or have proper permissions
- Check that RLS policies are correctly set up

### Error: "function does not exist"
- Ensure `003_create_functions_and_triggers.sql` ran successfully
- Check that functions were created: `\df` in psql

## Next Steps

1. **Set up Storage Buckets** (in Supabase Dashboard):
   - Create `documents` bucket
   - Set RLS policies for private access

2. **Configure Authentication**:
   - Set up email/password auth in Supabase
   - Configure OAuth providers if needed

3. **Test the Schema**:
   - Create a test user
   - Upload a test document
   - Verify RLS policies work correctly

## Notes

- **Never drop `auth.users`** - This is managed by Supabase Auth
- **Backup before dropping** - The drop script removes all data
- **Phase 2 tables** (community features) are documented but not created yet
- **Storage buckets** need to be created separately in Supabase Dashboard

