# Deployment Guide

This guide will help you deploy the Advanced Verification application using Supabase.

## Prerequisites

- [Supabase Account](https://supabase.com/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Resend Account](https://resend.com/) for email sending

## Step 1: Set Up Supabase Project

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Note down your project URL and anon key from Project Settings → API

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 3: Set Up Database

1. Go to your Supabase project → SQL Editor
2. Copy the contents of `schema.sql` and run it
3. This will create:
   - `verification_submissions` table
   - Row Level Security policies
   - Indexes for performance

## Step 4: Set Up Storage

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named: `verification-documents`
3. Set the bucket to **Private** (not public)
4. Configure storage policies:

   **Insert Policy (for anonymous uploads):**
   - Policy name: `Allow anonymous uploads`
   - Allowed operation: INSERT
   - Target roles: `anon`
   - Policy definition: `true`

   **Select Policy (for service role):**
   - Policy name: `Service role can read`
   - Allowed operation: SELECT
   - Target roles: `service_role`
   - Policy definition: `true`

## Step 5: Get Resend API Key

1. Sign up at [Resend](https://resend.com)
2. Create an API key from the dashboard
3. Verify your domain (or use their test domain for development)

## Step 6: Deploy Edge Function

1. Link your project to Supabase CLI:
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. Set up Edge Function secrets:
   ```bash
   # Set Resend API Key
   supabase secrets set RESEND_API_KEY=re_your_resend_api_key
   
   # Set Admin Email (where notifications will be sent)
   supabase secrets set ADMIN_EMAIL=admin@yourdomain.com
   
   # Optional: Customize email settings
   supabase secrets set VERIFICATION_EMAIL_FROM="Verification <noreply@yourdomain.com>"
   supabase secrets set VERIFICATION_EMAIL_SUBJECT="New Identity Verification Submission"
   ```

3. Deploy the Edge Function:
   ```bash
   supabase functions deploy send-verification-email
   ```

4. Verify deployment:
   ```bash
   supabase functions list
   ```

## Step 7: Deploy Frontend

### Option A: Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Option B: Deploy to Netlify

1. Push your code to GitHub
2. Import your repository on [Netlify](https://netlify.com)
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Option C: Deploy to Supabase Storage (Static Hosting)

1. Build your project:
   ```bash
   npm run build
   ```

2. Upload to Supabase Storage bucket or use other hosting options

## Step 8: Test the Application

1. Open your deployed application
2. Fill in the verification form
3. Upload test images
4. Submit and check:
   - Database: New record in `verification_submissions`
   - Storage: Files uploaded to `verification-documents` bucket
   - Email: Notification sent to admin email

## Environment Variables Summary

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Function Secrets (set via Supabase CLI)
```bash
RESEND_API_KEY=re_xxxxx
ADMIN_EMAIL=admin@yourdomain.com
VERIFICATION_EMAIL_FROM="Verification <noreply@yourdomain.com>"
VERIFICATION_EMAIL_SUBJECT="New Identity Verification Submission"
```

## Troubleshooting

### Edge Function Logs
View logs in real-time:
```bash
supabase functions logs send-verification-email --follow
```

### Common Issues

**Error: "Missing Supabase environment variables"**
- Make sure you've set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file

**Error: "Upload failed"**
- Check that the `verification-documents` bucket exists
- Verify storage policies allow anonymous uploads

**Error: "Failed to send email"**
- Verify your Resend API key is correct
- Check Edge Function logs for detailed error messages
- Make sure your domain is verified in Resend (or use test domain)

**Error: "Database insert failed"**
- Run the schema.sql to ensure table exists
- Check Row Level Security policies

## Security Notes

1. **Never commit `.env` files** - They're in `.gitignore` by default
2. **Service Role Key** - Only use in Edge Functions, never expose to frontend
3. **Storage** - Keep bucket private, use signed URLs for access
4. **Email Links** - URLs expire after 24 hours for security

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. For local Edge Function testing:
   ```bash
   supabase start
   supabase functions serve send-verification-email
   ```

## Support

For issues, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)
- Edge Function logs in Supabase Dashboard

