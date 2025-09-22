import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSchoolAdminRequest {
  email: string;
  password: string;
  full_name: string;
  school_name: string;
  city: string;
  package_id?: string;
  is_primary_admin?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Create School Admin Function Started ===');
    
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

    // Parse request body
    const { 
      email, 
      password, 
      full_name, 
      school_name, 
      city, 
      package_id,
      is_primary_admin = true 
    } = await req.json() as CreateSchoolAdminRequest;
    
    console.log(`Creating school admin: ${email} for school: ${school_name}`);

    // Step 1: Create the school first
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert([{
        name: school_name,
        city: city,
      }])
      .select()
      .single();

    if (schoolError) {
      console.error('School creation error:', schoolError);
      throw schoolError;
    }

    console.log(`School created successfully: ${schoolData.id}`);

    // Step 2: Create the admin user with complete metadata
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        role: 'school_admin',
        school_id: schoolData.id
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      // If user creation fails, delete the school
      await supabaseAdmin.from('schools').delete().eq('id', schoolData.id);
      throw authError;
    }

    if (!authUser.user) {
      console.error('No user object returned from auth creation');
      // If user creation fails, delete the school
      await supabaseAdmin.from('schools').delete().eq('id', schoolData.id);
      throw new Error('Failed to create admin user');
    }

    console.log(`Auth user created with school admin profile: ${authUser.user.id}`);

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 3: Update additional profile fields that trigger can't set
    if (is_primary_admin) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_primary_admin: true
        })
        .eq('user_id', authUser.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }
    }

    console.log('Profile setup completed successfully');

    // Step 4: Add package subscription if provided
    if (package_id) {
      const { error: packageError } = await supabaseAdmin
        .from('school_packages')
        .insert({
          school_id: schoolData.id,
          package_id: package_id,
          status: 'active',
          start_date: new Date().toISOString(),
        });

      if (packageError) {
        console.error('Package subscription error:', packageError);
        // Don't fail the entire operation for package errors
        console.log('Continuing without package subscription');
      } else {
        console.log('Package subscription created successfully');
      }
    }

    console.log('=== School Admin creation completed successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'School and admin created successfully',
        user_id: authUser.user.id,
        school_id: schoolData.id,
        school_name: schoolData.name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});