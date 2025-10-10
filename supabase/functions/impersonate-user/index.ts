import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ImpersonateRequest {
  targetUserId: string
  adminUserId: string
  returnToAdmin?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { targetUserId, adminUserId, returnToAdmin }: ImpersonateRequest = await req.json()

    if (!targetUserId || !adminUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get target user details
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, role')
      .eq('user_id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If not returning to admin, verify admin permissions
    if (!returnToAdmin) {
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', adminUserId)
        .single()

      if (adminError || !adminProfile || adminProfile.role !== 'superadmin') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate redirect URL based on returnToAdmin flag
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const redirectUrl = returnToAdmin 
      ? `${origin}/dashboard`
      : `${origin}/dashboard?admin_access=true&admin_id=${adminUserId}&user_id=${targetUserId}`

    // Generate magic link for the target user
    const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email,
      options: {
        redirectTo: redirectUrl
      }
    })

    if (linkError || !magicLink) {
      console.error('Magic link error:', linkError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate login link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    // Log impersonation action
    const auditAction = returnToAdmin ? 'USER_IMPERSONATION_ENDED' : 'USER_IMPERSONATION_STARTED'
    await supabase
      .from('audit_log')
      .insert({
        actor_user_id: adminUserId,
        action: auditAction,
        entity: 'profiles',
        entity_id: targetUserId,
        payload_json: {
          target_user: targetUser.full_name,
          target_email: targetUser.email,
          target_role: targetUser.role,
          return_to_admin: returnToAdmin || false,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        magicLink: magicLink.properties.action_link,
        targetUser: {
          id: targetUser.user_id,
          name: targetUser.full_name,
          email: targetUser.email,
          role: targetUser.role
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Impersonation error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})