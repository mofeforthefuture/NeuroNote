# Troubleshooting Guide

## "Failed to fetch" Error

If you're getting a "Failed to fetch" error when trying to sign up or sign in, follow these steps:

### 1. Restart Your Dev Server

**Important:** Vite only loads `.env` files when the dev server starts. After creating or modifying `.env`, you must restart:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Verify Environment Variables

Check that your `.env` file exists in the project root and contains:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** 
- The URL should start with `https://`
- No trailing slashes
- Keys should be complete (not truncated)

### 3. Check Supabase Project Status

1. Go to your Supabase Dashboard
2. Check if your project is **active** (not paused)
3. Verify the project URL matches your `.env` file

### 4. Test Connection in Browser Console

Open your browser's developer console and run:

```javascript
testSupabase()
```

This will test the connection and show detailed error messages.

### 5. Check Browser Console for CORS Errors

If you see CORS errors:
- Make sure your Supabase URL is correct
- Check if your project allows requests from your domain
- In Supabase Dashboard → Settings → API, verify the URL

### 6. Verify Supabase Auth is Enabled

1. Go to Supabase Dashboard → Authentication → Settings
2. Ensure "Enable email signup" is turned ON
3. Check "Site URL" is set correctly

### 7. Common Issues

#### Issue: Environment variables not loading
**Solution:** 
- Make sure file is named `.env` (not `.env.local` or `.env.development`)
- Restart dev server
- Check file is in project root (same level as `package.json`)

#### Issue: Wrong Supabase URL format
**Solution:**
- URL should be: `https://[project-ref].supabase.co`
- No trailing slash
- No `/rest/v1` or other paths

#### Issue: Anon key is wrong
**Solution:**
- Get the key from: Supabase Dashboard → Settings → API
- Use the "anon" or "public" key (not service_role key for client)
- Key should start with `eyJ...` (JWT format)

### 8. Network Issues

If you're behind a firewall or proxy:
- Check if Supabase domains are accessible
- Try accessing `https://[your-project].supabase.co` directly in browser
- Check for corporate firewalls blocking requests

### 9. Check Browser Network Tab

1. Open DevTools → Network tab
2. Try to sign up
3. Look for failed requests
4. Check the request URL and status code
5. Check response for error details

### 10. Verify Database Schema

Make sure you've run the database migrations:
- `database/migrations/001_drop_all_tables.sql`
- `database/migrations/002_create_schema.sql`
- `database/migrations/003_create_functions_and_triggers.sql`

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check Supabase Dashboard → Logs for server-side errors
3. Verify your Supabase project is not paused or deleted
4. Try creating a new Supabase project and updating your `.env`

