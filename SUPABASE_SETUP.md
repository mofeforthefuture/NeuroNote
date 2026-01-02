# Supabase Setup & Troubleshooting

## Rate Limiting During Signup

If you see the error: **"For security purposes, you can only request this after X seconds"**

This is Supabase's built-in rate limiting to prevent abuse. Here's how to handle it:

### Solution 1: Wait and Retry
- Simply wait the specified number of seconds (usually 60 seconds)
- Then try signing up again

### Solution 2: Use Different Email (Testing)
- If testing, use a different email address
- Or wait for the rate limit to expire

### Solution 3: Disable Rate Limiting (Development Only)
⚠️ **Only for local development, never in production!**

1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Rate Limits" section
3. Temporarily increase or disable rate limits for testing
4. **Remember to re-enable before production!**

### Solution 4: Use Supabase CLI (Local Development)
For local development, you can use Supabase CLI which doesn't have the same rate limits:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# This gives you a local instance without rate limits
```

## Common Signup Issues

### 1. RLS Policy Error
**Error:** `new row violates row-level security policy`

**Solution:** Run the migration to add INSERT policy:
```sql
-- In Supabase SQL Editor
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

Or run: `database/migrations/004_add_user_profiles_insert_policy.sql`

### 2. Email Confirmation Required
If email confirmation is enabled in Supabase:
- Check your email inbox (and spam folder)
- Click the confirmation link
- Then sign in

To disable email confirmation for testing:
1. Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. **Re-enable before production!**

### 3. Profile Creation Fails
If user is created but profile fails:
- User can still sign in
- Profile can be created on first login
- Or manually via Supabase Dashboard

## Testing Signup Flow

### Recommended Testing Approach:
1. **Use unique emails** for each test: `test1@example.com`, `test2@example.com`
2. **Wait between attempts** if you hit rate limits
3. **Check Supabase Dashboard** → Authentication → Users to verify accounts
4. **Check Database** → `user_profiles` table to verify profiles

### Quick Test Script:
```javascript
// In browser console, test signup
async function testSignup(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  console.log('Result:', { data, error })
}

// Usage
testSignup('test@example.com', 'testpassword123')
```

## Production Considerations

1. **Keep rate limiting enabled** - It's a security feature
2. **Enable email confirmation** - Prevents fake accounts
3. **Monitor signup rates** - Check Supabase logs for abuse
4. **Set up proper error handling** - Show user-friendly messages
5. **Consider CAPTCHA** - For additional protection against bots

## Need Help?

- Check Supabase Dashboard → Logs for detailed errors
- Review browser console for client-side errors
- Check Network tab in DevTools for API responses
- Verify all environment variables are set correctly

