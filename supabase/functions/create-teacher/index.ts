import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateTeacherRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  classIds?: string[];
  sendWelcomeEmail?: boolean;
}

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

    // Get request body
    const { 
      email, 
      password, 
      fullName, 
      phone, 
      classIds = [], 
      sendWelcomeEmail = false 
    }: CreateTeacherRequest = await req.json();

    console.log('Creating teacher with email:', email);

    // Validate input
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني وكلمة المرور والاسم الكامل مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user's session to verify permissions and get school_id
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is school admin and get school_id
    const { data: currentUser, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !currentUser.user) {
      return new Response(
        JSON.stringify({ error: 'فشل في التحقق من الهوية' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user's profile to check role and school
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', currentUser.user.id)
      .single();

    if (profileError || !currentProfile) {
      return new Response(
        JSON.stringify({ error: 'لم يتم العثور على ملف المستخدم' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is school admin or superadmin
    if (!['school_admin', 'superadmin'].includes(currentProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح - يجب أن تكون مدير مدرسة' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate class IDs belong to the same school
    if (classIds.length > 0) {
      const { data: classesCheck, error: classError } = await supabaseAdmin
        .from('classes')
        .select('id, school_id')
        .in('id', classIds);

      if (classError || !classesCheck) {
        return new Response(
          JSON.stringify({ error: 'فشل في التحقق من الصفوف' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if all classes belong to the current school (unless superadmin)
      if (currentProfile.role !== 'superadmin') {
        const invalidClasses = classesCheck.filter(c => c.school_id !== currentProfile.school_id);
        if (invalidClasses.length > 0) {
          return new Response(
            JSON.stringify({ error: 'لا يمكن تعيين المعلم لصفوف من مدارس أخرى' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check if user already exists and handle different scenarios
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers.users?.find(u => u.email === email);
    
    let userId: string;
    let isExistingUser = false;
    
    if (existingAuthUser) {
      // Check if user has a profile or is orphaned
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('user_id, role, full_name')
        .eq('user_id', existingAuthUser.id)
        .single();

      if (!existingProfile) {
        // Orphaned user - delete and recreate
        console.log('Found orphaned user, deleting and recreating...');
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
        if (deleteError) {
          console.error('Error deleting orphaned user:', deleteError);
        }
      } else {
        // User exists with profile - check if we can convert role
        if (existingProfile.role === 'student') {
          console.log('Converting existing student to teacher...');
          
          // Update existing user's role to teacher
          const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({
              role: 'teacher',
              full_name: fullName,
              phone: phone || null,
              school_id: currentProfile.school_id
            })
            .eq('user_id', existingAuthUser.id);

          if (updateProfileError) {
            console.error('Error updating user role:', updateProfileError);
            return new Response(
              JSON.stringify({ error: 'فشل في تحديث دور المستخدم' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Update auth user metadata
          const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
            existingAuthUser.id,
            {
              email,
              password,
              user_metadata: {
                full_name: fullName,
                phone: phone || null,
                role: 'teacher',
                school_id: currentProfile.school_id
              }
            }
          );

          if (updateUserError) {
            console.error('Error updating auth user:', updateUserError);
          }

          userId = existingAuthUser.id;
          isExistingUser = true;
          console.log('Successfully converted user to teacher:', userId);
        } else {
          // User exists as teacher or admin - return detailed error
          console.error('User already exists with role:', existingProfile.role);
          return new Response(
            JSON.stringify({ 
              error: `المستخدم ${email} موجود مسبقاً بدور: ${existingProfile.role === 'teacher' ? 'معلم' : existingProfile.role}`,
              existingUser: {
                email: email,
                role: existingProfile.role,
                name: existingProfile.full_name
              }
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Create user in Supabase Auth only if not already existing
    let newUser = null;
    
    if (!isExistingUser) {
      const createResult = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: fullName,
          phone: phone || null,
          role: 'teacher',
          school_id: currentProfile.school_id
        }
      });

      if (createResult.error || !createResult.data.user) {
        console.error('Error creating user:', createResult.error);
        return new Response(
          JSON.stringify({ error: `فشل في إنشاء المستخدم: ${createResult.error?.message || 'خطأ غير معروف'}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      newUser = createResult.data;
      userId = newUser.user.id;
      console.log('User created successfully with teacher profile:', newUser.user.id);
    } else {
      console.log('Using existing user converted to teacher:', userId);
    }

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assign teacher to classes if provided
    if (classIds.length > 0) {
      const teacherClassAssignments = classIds.map(classId => ({
        teacher_id: userId,
        class_id: classId
      }));

      const { error: assignmentError } = await supabaseAdmin
        .from('teacher_classes')
        .insert(teacherClassAssignments);

      if (assignmentError) {
        console.error('Error assigning classes:', assignmentError);
        // Continue execution - class assignment failure shouldn't fail the entire operation
      } else {
        console.log('Teacher assigned to classes successfully');
      }
    }

    // Send welcome email if requested
    let emailSent = false;
    let emailError = null;
    
    if (sendWelcomeEmail) {
      try {
        const emailResponse = await supabaseAdmin.functions.invoke('send-email', {
          body: {
            studentEmail: email,
            studentName: fullName,
            username: email,
            password: password,
            userType: 'teacher'
          }
        });
        
        if (emailResponse.error) {
          throw new Error(emailResponse.error.message || 'فشل في إرسال البريد الإلكتروني');
        }
        
        if (emailResponse.data?.success) {
          emailSent = true;
          console.log('Welcome email sent successfully');
        } else {
          throw new Error(emailResponse.data?.message || 'فشل في إرسال البريد الإلكتروني');
        }
      } catch (error: any) {
        console.error('Error sending welcome email:', error);
        emailError = error.message;
        // Continue execution - email failure shouldn't fail the entire operation
      }
    }

    // Log the action for audit trail
    await supabaseAdmin
      .from('audit_log')
      .insert({
        actor_user_id: currentUser.user.id,
        action: 'CREATE_TEACHER',
        entity: 'profiles',
        entity_id: userId,
        payload_json: {
          teacher_email: email,
          teacher_name: fullName,
          school_id: currentProfile.school_id,
          assigned_classes: classIds.length,
          welcome_email_sent: sendWelcomeEmail,
          is_existing_user: isExistingUser,
          action_type: isExistingUser ? 'converted_to_teacher' : 'created_new_teacher'
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent: emailSent,
        emailError: emailError,
        isExistingUser: isExistingUser,
        teacher: {
          id: userId,
          email: email,
          fullName: fullName,
          phone: phone,
          assignedClasses: classIds.length
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in create-teacher function:', error);
    return new Response(
      JSON.stringify({ error: `خطأ في الخادم: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});