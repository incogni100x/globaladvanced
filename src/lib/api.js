import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Upload a file to Supabase Storage
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The file path in the bucket
 * @param {File|Blob|string} file - The file to upload (can be File, Blob, or base64 string)
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadFile(bucket, path, file) {
  let fileToUpload = file

  // Convert base64 to Blob if needed
  if (typeof file === 'string' && file.startsWith('data:')) {
    const base64Response = await fetch(file)
    fileToUpload = await base64Response.blob()
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileToUpload, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL (if bucket is public) or signed URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: urlData.publicUrl
  }
}

/**
 * Create a verification submission record
 * @param {Object} submission - The submission data
 * @returns {Promise<Object>}
 */
export async function createVerificationSubmission(submission) {
  const { data, error } = await supabase
    .from('verification_submissions')
    .insert([submission])
    .select()
    .single()

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`)
  }

  return data
}

/**
 * Send verification email via Supabase Edge Function
 * @param {Object} verificationData - The verification data including submission ID
 * @returns {Promise<Object>}
 */
export async function sendVerificationEmail(verificationData) {
  const { data, error } = await supabase.functions.invoke('send-verification-email', {
    body: verificationData
  })

  if (error) {
    throw new Error(error.message || 'Failed to send verification email')
  }

  return data
}

