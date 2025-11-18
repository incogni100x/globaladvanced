# Storage Setup Guide

## Fix: Row Level Security Policy Error

If you're getting this error:
```
Upload failed: new row violates row-level security policy
```

Follow these steps:

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Name: `verification-documents`
5. **Public:** Leave it as **Private** (unchecked)
6. Click **Create bucket**

## Step 2: Set Up Storage Policies

You have two options:

### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Open the file `storage-policies.sql` from this repo
3. Copy and paste the contents
4. Click **Run**
5. Verify policies are created in **Storage > verification-documents > Policies**

### Option B: Using Storage UI

1. Go to **Storage > verification-documents > Policies**
2. Click **New Policy**

#### Policy 1: Allow Anonymous Uploads
- **Policy name:** `Allow anonymous uploads`
- **Allowed operation:** `INSERT`
- **Target roles:** `anon`
- **Policy definition:**
  ```sql
  bucket_id = 'verification-documents'
  ```

#### Policy 2: Allow Anonymous to View Uploads
- **Policy name:** `Allow anonymous to view own uploads`
- **Allowed operation:** `SELECT`
- **Target roles:** `anon`
- **Policy definition:**
  ```sql
  bucket_id = 'verification-documents'
  ```

#### Policy 3: Service Role Access
- **Policy name:** `Allow service role full access`
- **Allowed operation:** `ALL`
- **Target roles:** `service_role`
- **Policy definition (USING):**
  ```sql
  bucket_id = 'verification-documents'
  ```
- **Policy definition (WITH CHECK):**
  ```sql
  bucket_id = 'verification-documents'
  ```

## Step 3: Verify Setup

After setting up policies, try uploading again. The error should be resolved.

## Troubleshooting

### Still getting errors?

1. **Check bucket name:** Make sure it's exactly `verification-documents` (case-sensitive)
2. **Check bucket exists:** Go to Storage and verify the bucket is there
3. **Check policies:** Go to Storage > verification-documents > Policies and verify all 3 policies exist
4. **Check RLS:** Make sure Row Level Security is enabled (it should be by default)

### Common Issues

**Error: "bucket not found"**
- Create the bucket in Storage UI first

**Error: "permission denied"**
- Verify the INSERT policy for `anon` role exists
- Make sure the bucket name matches exactly

**Files upload but can't read them**
- Add the SELECT policy for `anon` role

