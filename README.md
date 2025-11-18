# Advanced Verification System

A modern identity verification application built with Vite, Tailwind CSS, and Supabase.

## Features

- ✅ **Modern UI** - Clean, responsive design with Tailwind CSS
- 📸 **Camera Support** - Take selfies and ID photos directly from the browser
- 📁 **File Upload** - Upload photos from your device
- ☁️ **Supabase Storage** - Secure cloud storage for verification documents
- 📧 **Email Notifications** - Automatic email alerts via Resend
- 🔒 **Secure** - Row Level Security and private storage buckets
- 🚀 **Edge Functions** - Serverless functions deployed on Supabase

## Tech Stack

- **Frontend**: Vite, Vanilla JavaScript, Tailwind CSS
- **Backend**: Supabase (Database, Storage, Edge Functions)
- **Email**: Resend
- **Styling**: Tailwind CSS, IBM Plex Sans font

## Project Structure

```
advancedverification/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client & helpers
│   ├── input.css                # Tailwind CSS entry point
│   └── main.js                  # Main application logic
├── supabase/
│   └── functions/
│       └── send-verification-email/
│           └── index.ts         # Edge function for emails
├── index.html                   # Main HTML file
├── schema.sql                   # Database schema
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind configuration
├── vite.config.js               # Vite configuration
├── .env.example                 # Environment variables template
├── DEPLOYMENT.md                # Detailed deployment guide
└── README.md                    # This file
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick steps:
1. Create Supabase project
2. Run `schema.sql` in SQL Editor
3. Create `verification-documents` storage bucket
4. Deploy Edge Function: `supabase functions deploy send-verification-email`
5. Deploy frontend to Vercel/Netlify

## Database Schema

The application uses a single table `verification_submissions`:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| id_number | VARCHAR(100) | User's ID number |
| selfie_path | TEXT | Path to selfie in storage |
| id_front_path | TEXT | Path to ID front in storage |
| id_back_path | TEXT | Path to ID back in storage |
| status | VARCHAR(50) | pending/reviewing/approved/rejected |
| email_sent | BOOLEAN | Email notification status |
| email_sent_at | TIMESTAMP | When email was sent |
| admin_email | VARCHAR(255) | Admin email address |
| metadata | JSONB | Additional metadata |
| review_notes | TEXT | Admin review notes |
| reviewed_by | VARCHAR(255) | Reviewer name |
| reviewed_at | TIMESTAMP | Review timestamp |

## How It Works

1. **User submits form** with ID number and 3 photos (selfie, ID front, ID back)
2. **Images uploaded** to Supabase Storage in `verification-documents` bucket
3. **Database record created** in `verification_submissions` table
4. **Edge Function triggered** to send email notification
5. **Admin receives email** with signed URLs to view documents
6. **Admin can review** and update status in Supabase Dashboard

## API Reference

### Supabase Client (`src/lib/supabase.js`)

#### `uploadFile(bucket, path, file)`
Upload a file to Supabase Storage.

**Parameters:**
- `bucket` (string): Storage bucket name
- `path` (string): File path in bucket
- `file` (File|Blob|string): File to upload (base64 supported)

**Returns:** `Promise<{path, url}>`

#### `createVerificationSubmission(submission)`
Create a new verification submission in the database.

**Parameters:**
- `submission` (object): Submission data

**Returns:** `Promise<Object>`

#### `sendVerificationEmail(verificationData)`
Send verification email via Edge Function.

**Parameters:**
- `verificationData` (object): Submission details

**Returns:** `Promise<Object>`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

### Frontend (`.env`)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Edge Function (Supabase Secrets)
- `RESEND_API_KEY` - Resend API key
- `ADMIN_EMAIL` - Email address for notifications
- `VERIFICATION_EMAIL_FROM` - From email address
- `VERIFICATION_EMAIL_SUBJECT` - Email subject line

Set Edge Function secrets:
```bash
supabase secrets set RESEND_API_KEY=your_key
supabase secrets set ADMIN_EMAIL=admin@example.com
```

## Security

- ✅ Row Level Security (RLS) enabled on database
- ✅ Private storage bucket with signed URLs
- ✅ Service role key only in Edge Functions
- ✅ Environment variables not committed to repo
- ✅ Signed URLs expire after 24 hours

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers with camera support

## License

MIT

## Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md)
- Review Supabase logs
- Check browser console for errors

---

Built with ❤️ using Vite, Supabase, and Tailwind CSS

