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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users without avatars
    const { data: usersWithoutAvatars, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role')
      .is('avatar_url', null)

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!usersWithoutAvatars || usersWithoutAvatars.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users found without avatars', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updatedCount = 0

    // Process each user
    for (const user of usersWithoutAvatars) {
      // Get appropriate avatars based on role
      let categoryFilter = 'universal'
      if (user.role === 'student') {
        categoryFilter = 'category.eq.student,category.eq.universal'
      } else if (user.role === 'teacher') {
        categoryFilter = 'category.eq.teacher,category.eq.universal'
      } else if (user.role === 'school_admin') {
        categoryFilter = 'category.eq.admin,category.eq.universal'
      } else if (user.role === 'superadmin') {
        categoryFilter = 'category.eq.superadmin,category.eq.universal'
      }

      const { data: avatars } = await supabaseAdmin
        .from('avatar_images')
        .select('image_path')
        .eq('is_active', true)
        .or(categoryFilter)

      const randomAvatar = avatars && avatars.length > 0 
        ? avatars[Math.floor(Math.random() * avatars.length)].image_path 
        : '/avatars/universal-default.png'

      // Update user with avatar
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ avatar_url: randomAvatar })
        .eq('user_id', user.user_id)

      if (!updateError) {
        updatedCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully assigned avatars to ${updatedCount} users`,
        updated: updatedCount,
        total: usersWithoutAvatars.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})