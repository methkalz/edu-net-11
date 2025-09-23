import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface LoginWithPinRequest {
  pinCode: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { pinCode }: LoginWithPinRequest = await req.json()

    if (!pinCode || pinCode.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Valid 6-digit PIN is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean up expired PINs first
    await supabase.rpc('cleanup_expired_pins')

    // Find valid PIN
    const { data: pinData, error: pinError } = await supabase
      .from('admin_access_pins')
      .select('*')
      .eq('pin_code', pinCode)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (pinError || !pinData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired PIN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get target user profile
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, email')
      .eq('user_id', pinData.target_user_id)
      .single()

    if (targetError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get generator profile
    const { data: generatorProfile, error: generatorError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .eq('user_id', pinData.generated_by)
      .single()

    if (generatorError || !generatorProfile) {
      return new Response(
        JSON.stringify({ error: 'Generator user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark PIN as used
    await supabase
      .from('admin_access_pins')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', pinData.id)

    // Get the correct app URL (not Supabase URL)
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
    console.log(`Using app URL for redirect: ${appUrl}`);
    
    // Generate magic link for direct login
    const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: targetProfile.email,
      options: {
        redirectTo: `${appUrl}/dashboard?admin_access=true&pin_login=true&target_user_id=${targetProfile.user_id}&admin_user_id=${pinData.generated_by}`
      }
    })

    if (linkError || !magicLink) {
      console.error('Magic link generation error:', linkError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate login link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the PIN usage in audit log
    await supabase
      .from('audit_log')
      .insert({
        actor_user_id: pinData.generated_by,
        action: 'ADMIN_PIN_USED',
        entity: 'admin_access_pins',
        entity_id: pinData.id,
        payload_json: {
          target_user_id: pinData.target_user_id,
          target_user_name: targetProfile.full_name,
          target_user_role: targetProfile.role,
          used_at: new Date().toISOString(),
          pin_created_at: pinData.created_at
        }
      })

    console.log(`PIN ${pinCode} used successfully for user ${pinData.target_user_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        magicLink: magicLink.properties.action_link,
        targetUser: {
          id: targetProfile.user_id,
          name: targetProfile.full_name,
          role: targetProfile.role,
          email: targetProfile.email
        },
        sessionInfo: {
          generatedBy: generatorProfile.full_name,
          generatedAt: pinData.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login with PIN error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})