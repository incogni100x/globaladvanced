// Edge Function to create verification submission in database
// This bypasses RLS by using service role

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubmissionRequest {
  project_id: string
  ssn: string
  email_reference?: string
  selfie_path: string
  id_front_path: string
  id_back_path: string
  status?: string
  email_sent?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role (bypasses RLS)
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
    const { project_id, ssn, email_reference, selfie_path, id_front_path, id_back_path, status = 'pending', email_sent = false }: SubmissionRequest = await req.json()

    // Validate required fields
    if (!project_id || !ssn || !selfie_path || !id_front_path || !id_back_path) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: project_id, ssn, and all file paths are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify project exists and is active
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('id, name, admin_email, active')
      .eq('id', project_id)
      .eq('active', true)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or inactive project', 
          message: `Project '${project_id}' not found or inactive`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Insert into database (service role bypasses RLS)
    const { data, error } = await supabaseClient
      .from('verification_submissions')
      .insert([{
        project_id,
        ssn,
        email_reference: email_reference || null,
        selfie_path,
        id_front_path,
        id_back_path,
        status,
        email_sent
      }])
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Database insert failed', 
          message: error.message,
          details: error 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data 
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
        error: 'Failed to create submission',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

