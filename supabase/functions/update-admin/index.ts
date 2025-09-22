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
    console.log('Starting admin update process...');
    
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

    // New admin user data
    const newAdminData = {
      email: 'admin@admin.com',
      password: 'admin112233',
      full_name: 'مدير النظام الرئيسي',
      role: 'superadmin'
    };

    console.log(`Processing new admin user: ${newAdminData.email}`);
    
    // Check if new admin already exists
    const { data: existingNewAdmin, error: newAdminCheckError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, role')
      .eq('email', newAdminData.email)
      .maybeSingle();

    if (newAdminCheckError) {
      console.error('Error checking existing new admin:', newAdminCheckError);
    }

    if (existingNewAdmin) {
      console.log(`New admin user already exists: ${newAdminData.email}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'New admin user already exists',
          user: {
            email: newAdminData.email,
            role: existingNewAdmin.role
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Create the new admin user
    console.log(`Creating new admin auth user: ${newAdminData.email}...`);
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newAdminData.email,
      password: newAdminData.password,
      email_confirm: true,
      user_metadata: {
        full_name: newAdminData.full_name
      }
    });

    if (authError) {
      console.error(`Auth error for ${newAdminData.email}:`, authError);
      throw authError;
    }

    if (!authUser.user) {
      console.error('No user object returned from auth creation');
      throw new Error('Failed to create new admin user');
    }

    console.log(`New admin auth user created: ${authUser.user.id}`);

    // Wait a moment for trigger to create profile, then update it to superadmin
    setTimeout(async () => {
      try {
        console.log(`Updating new admin profile for ${newAdminData.email}...`);
        
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'superadmin',
            full_name: newAdminData.full_name,
            school_id: null
          })
          .eq('user_id', authUser.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        } else {
          console.log(`New admin profile updated successfully for ${newAdminData.email}`);
        }
      } catch (error) {
        console.error('Error in delayed profile update:', error);
      }
    }, 1000);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'New admin user created successfully',
        user: {
          id: authUser.user.id,
          email: newAdminData.email,
          role: newAdminData.role,
          full_name: newAdminData.full_name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in update-admin function:', error);
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