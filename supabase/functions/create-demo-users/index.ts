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
    console.log('Starting demo users creation...');
    
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

    // Demo users data
    const demoUsers = [
      {
        email: 'superadmin@demo.com',
        password: 'Demo123!',
        full_name: 'مدير النظام الرئيسي',
        role: 'superadmin',
        school_id: null
      },
      {
        email: 'schooladmin@demo.com',
        password: 'Demo123!',
        full_name: 'مدير المدرسة التجريبية',
        role: 'school_admin',
        school_id: 'demo_school'
      },
      {
        email: 'teacher@demo.com',
        password: 'Demo123!',
        full_name: 'المعلم محمد أحمد',
        role: 'teacher',
        school_id: 'demo_school'
      },
      {
        email: 'student@demo.com',
        password: 'Demo123!',
        full_name: 'الطالب علي محمد',
        role: 'student',
        school_id: 'demo_school'
      },
      {
        email: 'parent@demo.com',
        password: 'Demo123!',
        full_name: 'ولي الأمر سارة أحمد',
        role: 'parent',
        school_id: 'demo_school'
      }
    ];

    console.log('Getting demo school...');
    // Get demo school ID
    const { data: demoSchool, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('name', 'Demo School')
      .single();

    if (schoolError) {
      console.error('Error getting demo school:', schoolError);
      throw new Error(`Demo School not found: ${schoolError.message}`);
    }

    if (!demoSchool) {
      throw new Error('Demo School not found in database');
    }

    console.log('Demo school found:', demoSchool.id);

    const results = [];
    let studentUserId = null;
    let parentUserId = null;

    console.log('Starting user creation loop...');
    // Create each user
    for (const userData of demoUsers) {
      console.log(`Processing user: ${userData.email}`);
      try {
        // Check if user already exists
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
          .from('profiles')
          .select('user_id, email')
          .eq('email', userData.email)
          .maybeSingle();

        if (profileCheckError) {
          console.error('Error checking existing profile:', profileCheckError);
        }

        if (existingProfile) {
          console.log(`User ${userData.email} already exists`);
          results.push({
            email: userData.email,
            status: 'already_exists',
            message: 'User already exists'
          });
          
          if (userData.role === 'student') studentUserId = existingProfile.user_id;
          if (userData.role === 'parent') parentUserId = existingProfile.user_id;
          continue;
        }

        console.log(`Creating auth user for ${userData.email}...`);
        // Create user in auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name
          }
        });

        if (authError) {
          console.error(`Auth error for ${userData.email}:`, authError);
          throw authError;
        }

        if (!authUser.user) {
          console.error('No user object returned from auth creation');
          throw new Error('Failed to create user');
        }

        console.log(`Auth user created: ${authUser.user.id}`);

        // Store user IDs for guardian relationship
        if (userData.role === 'student') studentUserId = authUser.user.id;
        if (userData.role === 'parent') parentUserId = authUser.user.id;

        console.log(`Updating profile for ${userData.email}...`);
        // Update profile with correct role and school
        const schoolId = userData.school_id === 'demo_school' ? demoSchool.id : null;
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: userData.role,
            school_id: schoolId,
            full_name: userData.full_name
          })
          .eq('user_id', authUser.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // Don't throw here, just log the error
        } else {
          console.log(`Profile updated successfully for ${userData.email}`);
        }

        results.push({
          email: userData.email,
          status: 'created',
          user_id: authUser.user.id,
          role: userData.role
        });

        console.log(`Created user: ${userData.email} with role: ${userData.role}`);

      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        results.push({
          email: userData.email,
          status: 'error',
          error: error.message
        });
      }
    }

    // Create guardian relationship
    if (parentUserId && studentUserId) {
      try {
        await supabaseAdmin
          .from('guardians')
          .insert({
            parent_user_id: parentUserId,
            student_user_id: studentUserId,
            relationship: 'parent'
          });
        console.log('Created guardian relationship');
      } catch (error) {
        console.error('Error creating guardian relationship:', error);
      }
    }

    // Create enrollments for teacher and student
    const { data: networkingCourse } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('title', 'Computer Networking')
      .single();

    if (networkingCourse) {
      const teacherResult = results.find(r => r.email === 'teacher@demo.com');
      const studentResult = results.find(r => r.email === 'student@demo.com');

      if (teacherResult && teacherResult.user_id) {
        try {
          await supabaseAdmin
            .from('enrollments')
            .insert({
              course_id: networkingCourse.id,
              user_id: teacherResult.user_id,
              role_in_course: 'teacher'
            });
        } catch (error) {
          console.error('Error enrolling teacher:', error);
        }
      }

      if (studentResult && studentResult.user_id) {
        try {
          await supabaseAdmin
            .from('enrollments')
            .insert({
              course_id: networkingCourse.id,
              user_id: studentResult.user_id,
              role_in_course: 'student'
            });
        } catch (error) {
          console.error('Error enrolling student:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo users creation completed',
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-demo-users function:', error);
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