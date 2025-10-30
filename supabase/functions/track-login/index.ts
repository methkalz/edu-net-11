import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // استخدام service role key للتحديث الآمن
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()

    if (!user_id) {
      console.error('Missing user_id parameter')
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Tracking login for user:', user_id)

    const now = new Date().toISOString()

    // جلب login_count الحالي
    const { data: profile, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('login_count')
      .eq('user_id', user_id)
      .single()

    if (fetchError) {
      console.error('Error fetching profile:', fetchError)
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newLoginCount = (profile?.login_count || 0) + 1
    console.log('Updating login count to:', newLoginCount)

    // تحديث بيانات تسجيل الدخول
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        last_login_at: now,
        login_count: newLoginCount
      })
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Login tracked successfully for user:', user_id)

    return new Response(
      JSON.stringify({ 
        success: true,
        login_count: newLoginCount,
        last_login_at: now
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
