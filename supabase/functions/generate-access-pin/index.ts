import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface GeneratePinRequest {
  targetUserId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Check if user is superadmin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only superadmins can generate access PINs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { targetUserId }: GeneratePinRequest = await req.json()

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Target user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify target user exists
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role')
      .eq('user_id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate 6-digit PIN
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Set expiration time (15 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Clean up expired PINs first
    await supabase.rpc('cleanup_expired_pins')

    // Insert new PIN
    const { data: pinData, error: pinError } = await supabase
      .from('admin_access_pins')
      .insert({
        target_user_id: targetUserId,
        generated_by: user.id,
        pin_code: pinCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (pinError) {
      console.error('PIN generation error:', pinError)
      throw new Error('Failed to generate PIN')
    }

    // Log the PIN generation in audit log
    await supabase
      .from('audit_log')
      .insert({
        actor_user_id: user.id,
        action: 'ADMIN_PIN_GENERATED',
        entity: 'admin_access_pins',
        entity_id: pinData.id,
        payload_json: {
          target_user_id: targetUserId,
          target_user_name: targetUser.full_name,
          target_user_role: targetUser.role,
          expires_at: expiresAt.toISOString(),
          generated_at: new Date().toISOString()
        }
      })

    console.log(`PIN generated for user ${targetUserId} by superadmin ${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        pin: pinCode,
        expiresAt: expiresAt.toISOString(),
        targetUser: {
          id: targetUser.user_id,
          name: targetUser.full_name,
          role: targetUser.role
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Generate PIN error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})