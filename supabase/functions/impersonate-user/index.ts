import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ImpersonateRequest {
  targetUserId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1) Verify caller via JWT — never trust adminUserId from the body
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const adminUserId = claimsData.claims.sub as string

    const { targetUserId }: ImpersonateRequest = await req.json()
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing targetUserId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2) Verify caller is superadmin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminUserId)
      .single()

    if (adminError || !adminProfile || adminProfile.role !== 'superadmin') {
      // Audit unauthorized attempt
      await supabase.from('audit_log').insert({
        actor_user_id: adminUserId,
        action: 'USER_IMPERSONATION_DENIED',
        entity: 'profiles',
        entity_id: targetUserId,
        payload_json: { reason: 'caller_not_superadmin', attempted_at: new Date().toISOString() }
      })
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3) Get target user
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

    // 4) Block impersonating other superadmins (privilege isolation)
    if (targetUser.role === 'superadmin' && targetUser.user_id !== adminUserId) {
      await supabase.from('audit_log').insert({
        actor_user_id: adminUserId,
        action: 'USER_IMPERSONATION_DENIED',
        entity: 'profiles',
        entity_id: targetUserId,
        payload_json: { reason: 'cannot_impersonate_superadmin', attempted_at: new Date().toISOString() }
      })
      return new Response(
        JSON.stringify({ error: 'Cannot impersonate another superadmin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5) Generate magic link
    const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard?admin_access=true&impersonated=true&target_user_id=${targetUserId}&admin_user_id=${adminUserId}`
      }
    })

    if (linkError || !magicLink) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate login link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6) Audit success
    await supabase.from('audit_log').insert({
      actor_user_id: adminUserId,
      action: 'USER_IMPERSONATION_STARTED',
      entity: 'profiles',
      entity_id: targetUserId,
      payload_json: {
        target_user: targetUser.full_name,
        target_email: targetUser.email,
        target_role: targetUser.role,
        impersonation_started: new Date().toISOString()
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
