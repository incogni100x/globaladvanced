// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  submissionId: string
  ssn: string
  email_reference?: string
  selfiePath: string
  idFrontPath: string
  idBackPath: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const { submissionId, ssn, email_reference, selfiePath, idFrontPath, idBackPath }: EmailRequest = await req.json()

    // Validate required fields
    if (!submissionId || !ssn || !selfiePath || !idFrontPath || !idBackPath) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the full submission data from database
    const { data: submission, error: dbError } = await supabaseClient
      .from('verification_submissions')
      .select('*, projects(admin_email, name)')
      .eq('id', submissionId)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Database error', message: dbError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get admin email from project configuration
    if (!submission.project_id) {
      return new Response(
        JSON.stringify({ error: 'Submission missing project_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get project admin email
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('admin_email, name')
      .eq('id', submission.project_id)
      .eq('active', true)
      .single()

    if (projectError || !project) {
      console.error('Project lookup error:', projectError)
      return new Response(
        JSON.stringify({ 
          error: 'Project not found or inactive', 
          message: `Project '${submission.project_id}' not found or inactive`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const ADMIN_EMAIL = project.admin_email
    const PROJECT_NAME = project.name || 'Verification System'

    // Generate signed URLs for the images (valid for 24 hours)
    const { data: selfieUrl } = await supabaseClient.storage
      .from('verification-documents')
      .createSignedUrl(selfiePath, 86400)

    const { data: idFrontUrl } = await supabaseClient.storage
      .from('verification-documents')
      .createSignedUrl(idFrontPath, 86400)

    const { data: idBackUrl } = await supabaseClient.storage
      .from('verification-documents')
      .createSignedUrl(idBackPath, 86400)

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
          .label { font-weight: bold; color: #2563eb; }
          .images { margin: 20px 0; }
          .image-section { margin: 15px 0; }
          .image-link { display: inline-block; margin: 10px 0; padding: 10px 15px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 New Identity Verification Submission</h2>
          </div>
          <div class="content">
            <div class="info-row">
              <span class="label">Submission ID:</span> ${submissionId}
            </div>
            <div class="info-row">
              <span class="label">SSN:</span> ${ssn}
            </div>
            ${email_reference ? `
            <div class="info-row">
              <span class="label">Email/Reference:</span> ${email_reference}
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Submitted At:</span> ${new Date(submission.created_at).toLocaleString()}
            </div>
            <div class="info-row">
              <span class="label">Status:</span> ${submission.status}
            </div>

            <div class="images">
              <h3>Verification Documents</h3>
              
              <div class="image-section">
                <p><strong>Selfie Photo:</strong></p>
                <a href="${selfieUrl?.signedUrl}" class="image-link" target="_blank">View Selfie →</a>
              </div>

              <div class="image-section">
                <p><strong>ID Card Front:</strong></p>
                <a href="${idFrontUrl?.signedUrl}" class="image-link" target="_blank">View ID Front →</a>
              </div>

              <div class="image-section">
                <p><strong>ID Card Back:</strong></p>
                <a href="${idBackUrl?.signedUrl}" class="image-link" target="_blank">View ID Back →</a>
              </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
              <p><strong>⚠️ Important:</strong> This verification link is valid for 24 hours. After 24 hours, kindly request another verification.</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from ${PROJECT_NAME}.</p>
            <p>Submission ID: ${submissionId}</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using Resend API
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    // Using verified domain: secure.globalpremiumfin.com
    // FROM email name is dynamic based on project
    const FROM_EMAIL = Deno.env.get('VERIFICATION_EMAIL_FROM') || `${PROJECT_NAME} <verify@secure.globalpremiumfin.com>`
    const SUBJECT = Deno.env.get('VERIFICATION_EMAIL_SUBJECT') || `New Identity Verification Submission - ${PROJECT_NAME}`

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    if (!ADMIN_EMAIL) {
      throw new Error(`Admin email not found for project: ${submission.project_id}`)
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: SUBJECT,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const emailResult = await resendResponse.json()

    // Update submission to mark email as sent
    await supabaseClient
      .from('verification_submissions')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        admin_email: ADMIN_EMAIL
      })
      .eq('id', submissionId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        emailId: emailResult.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send verification email',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

