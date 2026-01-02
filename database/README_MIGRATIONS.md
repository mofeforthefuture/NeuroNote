# Database Migrations

## Migration Order

Migrations must be run in this exact order:

1. `001_drop_all_tables.sql` - Drops all existing tables (use with caution!)
2. `002_create_schema.sql` - Creates core database schema
3. `003_create_functions_and_triggers.sql` - Adds database functions and triggers
4. `004_add_user_profiles_insert_policy.sql` - Adds RLS policy for user profiles
5. `005_create_credits_system.sql` - Creates credits system (REQUIRED before 006)
6. `006_add_token_tracking.sql` - Adds token tracking (requires 005)

## Quick Start

### Option 1: Run All Migrations (Recommended)

```bash
cd database
./run_migrations.sh
```

### Option 2: Run Manually

```bash
# Set your database connection
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or use individual parameters
export PGPASSWORD=your_password

# Run migrations in order
psql -h your_host -U your_user -d your_database -f migrations/001_drop_all_tables.sql
psql -h your_host -U your_user -d your_database -f migrations/002_create_schema.sql
psql -h your_host -U your_user -d your_database -f migrations/003_create_functions_and_triggers.sql
psql -h your_host -U your_user -d your_database -f migrations/004_add_user_profiles_insert_policy.sql
psql -h your_host -U your_user -d your_database -f migrations/005_create_credits_system.sql
psql -h your_host -U your_user -d your_database -f migrations/006_add_token_tracking.sql
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (copy and paste the contents)

## Important Notes

### Migration 005 is Required Before 006

The token tracking migration (006) depends on the credits system migration (005). If you get an error:

```
ERROR: relation "document_processing_jobs" does not exist
```

**Solution:** Run migration 005 first, then run 006.

### Checking Migration Status

To see which tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

To check if a specific table exists:

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'document_processing_jobs'
);
```

## Troubleshooting

### Error: Table already exists

If you get "table already exists" errors:
- The migration has already been run
- You can skip that migration or drop the table first (use with caution!)

### Error: Function already exists

If you get "function already exists" errors:
- Drop the function first: `DROP FUNCTION IF EXISTS function_name;`
- Or modify the migration to use `CREATE OR REPLACE FUNCTION`

### Error: Permission denied

Make sure your database user has:
- CREATE TABLE permissions
- CREATE FUNCTION permissions
- ALTER TABLE permissions

## Verifying Migrations

After running all migrations, verify:

```sql
-- Check credits tables
SELECT 'user_credits' as table_name, COUNT(*) as row_count FROM user_credits
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM credit_transactions
UNION ALL
SELECT 'credit_packages', COUNT(*) FROM credit_packages
UNION ALL
SELECT 'document_processing_jobs', COUNT(*) FROM document_processing_jobs
UNION ALL
SELECT 'ai_operation_tokens', COUNT(*) FROM ai_operation_tokens;
```

All tables should exist (even if row_count is 0).

