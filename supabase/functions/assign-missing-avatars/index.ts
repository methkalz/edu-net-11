import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Helper functions to get random avatars by role
    const getRandomAvatarByRole = (role: string) => {
      switch (role) {
        case 'student':
          const studentAvatars = [
            'avatars/student-boy-1.png',
            'avatars/student-boy-2.png', 
            'avatars/student-creative.png',
            'avatars/student-girl-1.png',
            'avatars/student-girl-2.png',
            'avatars/universal-default.png'
          ];
          return studentAvatars[Math.floor(Math.random() * studentAvatars.length)];
        
        case 'teacher':
          const teacherAvatars = [
            'avatars/teacher-female-1.png',
            'avatars/teacher-female-2.png',
            'avatars/teacher-male-1.png', 
            'avatars/teacher-male-2.png',
            'avatars/universal-default.png'
          ];
          return teacherAvatars[Math.floor(Math.random() * teacherAvatars.length)];
        
        case 'school_admin':
          const adminAvatars = [
            'avatars/admin-school-female.png',
            'avatars/admin-school-male.png',
            'avatars/admin-school-formal.png',
            'avatars/universal-default.png'
          ];
          return adminAvatars[Math.floor(Math.random() * adminAvatars.length)];
        
        case 'superadmin':
          const superAdminAvatars = [
            'avatars/superadmin-1.png',
            'avatars/superadmin-2.png',
            'avatars/universal-default.png'
          ];
          return superAdminAvatars[Math.floor(Math.random() * superAdminAvatars.length)];
        
        default:
          return 'avatars/universal-default.png';
      }
    };

    console.log('Starting avatar assignment process...');

    // Get all profiles that need avatar assignment (null, empty, or wrong paths)
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role, avatar_url, full_name')
      .or('avatar_url.is.null,avatar_url.eq.,avatar_url.like./avatars/%');

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      throw new Error(`Failed to fetch profiles: ${fetchError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} profiles needing avatar assignment`);

    let updatedCount = 0;
    let errors: string[] = [];

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        try {
          const randomAvatar = getRandomAvatarByRole(profile.role);
          
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ avatar_url: randomAvatar })
            .eq('user_id', profile.user_id);

          if (updateError) {
            console.error(`Error updating avatar for ${profile.full_name}:`, updateError);
            errors.push(`${profile.full_name}: ${updateError.message}`);
          } else {
            console.log(`Avatar assigned to ${profile.full_name} (${profile.role}): ${randomAvatar}`);
            updatedCount++;
          }
          
          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error: any) {
          console.error(`Unexpected error for ${profile.full_name}:`, error);
          errors.push(`${profile.full_name}: ${error.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Avatar assignment completed`,
        updated: updatedCount,
        total: profiles?.length || 0,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in assign-missing-avatars function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `خطأ في الخادم: ${error.message}` 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});