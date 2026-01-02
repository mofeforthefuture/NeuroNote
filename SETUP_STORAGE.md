# Supabase Storage Setup Guide

## Create Storage Bucket for Documents

To enable PDF uploads, you need to create a storage bucket in Supabase.

### Step 1: Create the Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure:
   - **Name**: `documents`
   - **Public bucket**: ❌ **Unchecked** (private - users can only access their own files)
   - **File size limit**: 50 MB (or your preferred limit)
   - **Allowed MIME types**: `application/pdf` (optional, for extra security)

5. Click **Create bucket**

### Step 2: Set Up RLS Policies

After creating the bucket, set up Row Level Security policies:

1. Go to **Storage** → **Policies** tab
2. Select the `documents` bucket
3. Click **New Policy**

#### Policy 1: Users can upload their own files

```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Users can read their own files

```sql
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Users can delete their own files

```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 3: Verify Setup

Test the setup by:

1. Uploading a PDF through your app
2. Checking Storage → `documents` bucket to see the file
3. Verifying the file path follows: `{user_id}/{filename}`

## File Path Structure

Files are stored with this structure:
```
documents/
  {user_id}/
    {timestamp}-{random}.pdf
```

This ensures:
- Users can only access their own files (RLS enforced)
- Files are organized by user
- Unique filenames prevent conflicts

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket name is exactly `documents` (lowercase)
- Check that the bucket exists in Storage

### Error: "Permission denied"
- Verify RLS policies are set up correctly
- Check that the user is authenticated
- Ensure file path matches user ID

### Error: "File too large"
- Check bucket file size limit
- Verify file is under 50MB (or your configured limit)

## Security Notes

- **Never make the bucket public** - PDFs contain user data
- **RLS policies are essential** - Without them, users could access each other's files
- **File paths include user ID** - This ensures proper access control

