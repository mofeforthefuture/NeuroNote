# Credit Distribution Scripts

## Quick Reference

### Give All Users 1000 Credits

```bash
psql -h your-host -U your-user -d your-database -f database/give_all_users_credits.sql
```

### Give Credits to Specific User

Edit `give_specific_user_credits.sql` and run:
```bash
psql -h your-host -U your-user -d your-database -f database/give_specific_user_credits.sql
```

## Scripts

### 1. `give_all_users_credits.sql`

**Purpose:** Adds 1000 credits to ALL users in the system.

**What it does:**
- Loops through all users in `auth.users`
- Ensures each user has a `user_credits` record
- Adds 1000 credits to their balance
- Updates `lifetime_earned` counter
- Creates a transaction record for audit trail
- Shows summary statistics after completion

**Usage:**
```bash
psql -h your-host -U your-user -d your-database -f database/give_all_users_credits.sql
```

**Output:**
- Shows how many users were updated
- Shows total credits distributed
- Displays summary statistics (total credits, average, min, max)

**Safety:**
- Uses transactions (safe to run)
- Creates proper audit trail
- Can be run multiple times (will add credits each time)

### 2. `give_specific_user_credits.sql`

**Purpose:** Give credits to a specific user by email or user ID.

**Usage Options:**

**Option 1: By Email**
1. Open the script
2. Find the line: `WHERE email = 'user@example.com';`
3. Replace `'user@example.com'` with the actual email
4. Run the script

**Option 2: By User ID (UUID)**
1. Open the script
2. Uncomment the second DO block (Option 2)
3. Replace the UUID: `v_user_id UUID := '00000000-0000-0000-0000-000000000000';`
4. Run the script

## Customizing Credit Amount

To change the credit amount, edit the variable in the script:

```sql
v_credits_to_add INTEGER := 1000; -- Change this number
```

## Verification

After running a script, verify the credits were added:

```sql
-- Check specific user
SELECT 
  u.email,
  uc.balance,
  uc.lifetime_earned
FROM auth.users u
JOIN user_credits uc ON uc.user_id = u.id
WHERE u.email = 'user@example.com';

-- Check all users
SELECT 
  COUNT(*) as total_users,
  SUM(balance) as total_credits,
  AVG(balance) as avg_credits
FROM user_credits;

-- Check recent transactions
SELECT 
  ct.user_id,
  u.email,
  ct.amount,
  ct.description,
  ct.created_at
FROM credit_transactions ct
JOIN auth.users u ON u.id = ct.user_id
WHERE ct.transaction_type = 'bonus'
ORDER BY ct.created_at DESC
LIMIT 10;
```

## Safety Notes

1. **Backup First:** Always backup your database before running bulk operations
2. **Test First:** Test on a single user before running on all users
3. **Audit Trail:** All credit grants create transaction records
4. **Idempotent:** Scripts can be run multiple times (will add credits each time)

## Examples

### Give 500 credits to all users

Edit `give_all_users_credits.sql`:
```sql
v_credits_to_add INTEGER := 500; -- Changed from 1000
```

### Give 2000 credits to a specific user

Edit `give_specific_user_credits.sql`:
```sql
v_credits_to_add INTEGER := 2000; -- Changed from 1000
WHERE email = 'premium@example.com';
```

## Troubleshooting

### Error: "relation user_credits does not exist"

Run migration 005 first:
```bash
psql -f database/migrations/005_create_credits_system.sql
```

### Error: "permission denied"

Make sure your database user has:
- UPDATE permissions on `user_credits`
- INSERT permissions on `credit_transactions`
- SELECT permissions on `auth.users`

### Credits not showing up

1. Check if transaction was created:
```sql
SELECT * FROM credit_transactions 
WHERE transaction_type = 'bonus' 
ORDER BY created_at DESC LIMIT 5;
```

2. Check user balance:
```sql
SELECT * FROM user_credits WHERE user_id = 'user-uuid-here';
```

3. Refresh the app - credits should update automatically

