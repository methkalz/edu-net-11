import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateStudentRequest {
  school_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  password?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const body: CreateStudentRequest = await req.json();
    const { school_id, full_name, email, phone, password } = body;

    console.log('Creating student with data:', { school_id, full_name, email, phone });

    let user_id = null;
    let student_id = null;
    
    // التحقق من وجود الطالب أولاً بالبريد الإلكتروني (عالمياً، ليس فقط في المدرسة)
    if (email) {
      const { data: existingStudent, error: checkError } = await supabaseAdmin
        .from('students')
        .select('id, user_id, full_name, school_id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing student:', checkError);
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (existingStudent) {
        console.log('Student already exists globally:', existingStudent);
        return new Response(
          JSON.stringify({ 
            error: `يوجد طالب بهذا البريد الإلكتروني مسبقاً: ${existingStudent.full_name}`,
            success: false,
            existingStudent: existingStudent
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          }
        );
      }

      // التحقق من وجود مستخدم في auth.users وتنظيف المعلقين
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingUsers.users?.find(u => u.email === email);
      
      if (existingAuthUser) {
        // Check if user has a profile or is orphaned
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('user_id', existingAuthUser.id)
          .single();

        if (!existingProfile) {
          // Orphaned user - delete them
          console.log('Found orphaned auth user, deleting...');
          
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
          if (deleteError) {
            console.error('Error deleting orphaned user:', deleteError);
          } else {
            console.log('Orphaned user deleted successfully');
          }
        } else {
          // User exists with profile - return error
          console.log('Auth user already exists with profile:', existingAuthUser.id);
          return new Response(
            JSON.stringify({ 
              error: 'يوجد مستخدم بهذا البريد الإلكتروني في النظام مسبقاً',
              success: false,
              authUserId: existingAuthUser.id
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 409,
            }
          );
        }
      }
    }
    
    // If we reach here, create a new student (no existing student found)
    
    // If email is provided and password is provided, create a user account
    if (email && password) {
      // At this point, any orphaned users should have been cleaned up above
      // Create new user account
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'student',
          full_name: full_name,
          school_id: school_id
        }
      });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        throw new Error(`فشل في إنشاء حساب المستخدم: ${createUserError.message}`);
      }

      user_id = newUser.user.id;
      console.log('Created new user account:', user_id);
    }

    // Only create new student if we don't already have one
    if (!student_id) {
      // Create student record in students table
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          school_id: school_id,
          full_name: full_name,
          username: email || null,
          email: email || null,
          phone: phone || null,
          user_id: user_id
        })
        .select()
        .single();

      if (studentError) {
        console.error('Error creating student:', studentError);
        throw new Error(`Failed to create student: ${studentError.message}`);
      }

      student_id = studentData.id;
      console.log('New student created successfully:', studentData);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        student_id: student_id,
        user_id: user_id,
        message: student_id ? 'تم إنشاء الطالب بنجاح' : 'تم إعادة تنشيط الطالب بنجاح'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-student function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});