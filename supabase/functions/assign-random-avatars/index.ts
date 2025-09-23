import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // دالة لاختيار أفاتار عشوائي حسب الدور
    const getRandomAvatarForRole = async (role: string): Promise<string> => {
      const { data: avatars, error } = await supabaseAdmin
        .from('avatar_images')
        .select('file_path')
        .eq('is_active', true)
        .or(`category.eq.${role},category.eq.universal`)
      
      if (error || !avatars || avatars.length === 0) {
        return '/avatars/universal-default.png'
      }
      
      // اختيار عشوائي
      const randomIndex = Math.floor(Math.random() * avatars.length)
      return avatars[randomIndex].file_path
    }

    // جلب المستخدمين الذين ليس لديهم أفاتار
    const { data: usersWithoutAvatars, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role')
      .or('avatar_url.is.null,avatar_url.eq./avatars/universal-default.png')
    
    if (fetchError) {
      throw fetchError
    }

    if (!usersWithoutAvatars || usersWithoutAvatars.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'جميع المستخدمين لديهم أفاتار بالفعل',
          updated_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // تحديث كل مستخدم بأفاتار عشوائي
    const updates = []
    for (const user of usersWithoutAvatars) {
      const randomAvatar = await getRandomAvatarForRole(user.role)
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ avatar_url: randomAvatar })
        .eq('user_id', user.user_id)
      
      if (!updateError) {
        updates.push({ user_id: user.user_id, role: user.role, new_avatar: randomAvatar })
      }
    }

    // تسجيل العملية في سجل التدقيق
    if (updates.length > 0) {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          action: 'BULK_AVATAR_ASSIGNMENT',
          table_name: 'profiles',
          payload_json: {
            updated_users: updates.length,
            operation: 'assign_random_avatars_bulk',
            timestamp: new Date().toISOString()
          }
        })
    }

    return new Response(
      JSON.stringify({ 
        message: `تم تحديث ${updates.length} مستخدم بأفاتار عشوائي`,
        updated_count: updates.length,
        updates: updates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error assigning random avatars:', error)
    return new Response(
      JSON.stringify({ error: 'فشل في تعيين الأفاتار العشوائية' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})