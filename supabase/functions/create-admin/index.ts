import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    console.log('Starting admin user creation...');
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }
    
    console.log('Environment variables validated');

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Admin user data
    const adminData = {
      email: 'admin@admin.com',
      password: 'admin112233',
      full_name: 'مدير النظام الرئيسي',
      role: 'superadmin'
    };

    console.log(`Processing admin user: ${adminData.email}`);
    
    // Check if admin user already exists in profiles
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, role')
      .eq('email', adminData.email)
      .maybeSingle();

    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError);
    }

    if (existingProfile) {
      console.log(`Admin user already exists with role: ${existingProfile.role}`);
      
      // Update existing profile to ensure it has superadmin role
      if (existingProfile.role !== 'superadmin') {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'superadmin',
            full_name: adminData.full_name,
            school_id: null
          })
          .eq('user_id', existingProfile.user_id);

        if (updateError) {
          console.error('Error updating existing profile:', updateError);
          throw updateError;
        }
        
        console.log('Updated existing profile to superadmin');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin user already exists and has been updated to superadmin role',
          user: {
            id: existingProfile.user_id,
            email: adminData.email,
            role: 'superadmin',
            full_name: adminData.full_name
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Creating admin auth user for ${adminData.email}...`);
    
    // Create admin user in auth (this will also trigger profile creation via trigger)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: {
        full_name: adminData.full_name
      }
    });

    if (authError) {
      console.error(`Auth error for ${adminData.email}:`, authError);
      throw authError;
    }

    if (!authUser.user) {
      console.error('No user object returned from auth creation');
      throw new Error('Failed to create admin user');
    }

    console.log(`Admin auth user created: ${authUser.user.id}`);

    // Wait a moment for trigger to create profile, then update it to superadmin
    setTimeout(async () => {
      try {
        console.log(`Updating admin profile for ${adminData.email}...`);
        
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'superadmin',
            full_name: adminData.full_name,
            school_id: null
          })
          .eq('user_id', authUser.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        } else {
          console.log(`Admin profile updated successfully for ${adminData.email}`);
        }
      } catch (error) {
        console.error('Error in delayed profile update:', error);
      }
    }, 1000);

    console.log(`Updating admin profile for ${adminData.email}...`);
    
    // Update profile with superadmin role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: adminData.role,
        full_name: adminData.full_name,
        school_id: null // Superadmin doesn't belong to any specific school
      })
      .eq('user_id', authUser.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    console.log(`Admin profile updated successfully for ${adminData.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: authUser.user.id,
          email: adminData.email,
          role: adminData.role,
          full_name: adminData.full_name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-admin function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});