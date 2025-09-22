import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  userId: string;
  userType: 'student' | 'teacher' | 'school_admin' | 'superadmin';
}

Deno.serve(async (req) => {
  console.log('🗑️ Delete user completely function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get current user from auth header for authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Get requesting user's profile
    const { data: requestingUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !requestingUserProfile) {
      throw new Error('Could not find requesting user profile');
    }

    // Parse request body
    const body: DeleteUserRequest = await req.json();
    const { userId, userType } = body;

    if (!userId || !userType) {
      throw new Error('userId and userType are required');
    }

    console.log(`🔍 Request to delete ${userType} user: ${userId}`);

    // Authorization check
    if (requestingUserProfile.role !== 'superadmin' && 
        requestingUserProfile.role !== 'school_admin') {
      throw new Error('Unauthorized: Only admins can delete users');
    }

    // Get user profile to verify school permission
    const { data: targetUserProfile } = await supabase
      .from('profiles')
      .select('school_id, full_name, email')
      .eq('user_id', userId)
      .single();

    // School admin can only delete users from their school
    if (requestingUserProfile.role === 'school_admin' && 
        targetUserProfile?.school_id !== requestingUserProfile.school_id) {
      throw new Error('Unauthorized: Can only delete users from your school');
    }

    console.log(`🧹 Starting complete deletion process for user: ${userId}`);

    // Step 1: Delete from specific user type tables
    let specificTableDeleted = false;

    if (userType === 'student') {
      // Delete student-specific data
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('user_id', userId);
      
      if (studentError && !studentError.message.includes('No rows found')) {
        console.error('❌ Error deleting from students table:', studentError);
      } else {
        console.log('✅ Deleted from students table');
        specificTableDeleted = true;
      }

      // Delete from class_students if exists
      const { error: classStudentsError } = await supabase
        .from('class_students')
        .delete()
        .eq('student_id', userId);
      
      if (classStudentsError && !classStudentsError.message.includes('No rows found')) {
        console.log('⚠️ Could not delete class enrollments:', classStudentsError);
      } else {
        console.log('✅ Deleted class enrollments');
      }
    }

    if (userType === 'teacher') {
      // Delete teacher-specific data
      const { error: teacherClassesError } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('teacher_id', userId);
      
      if (teacherClassesError && !teacherClassesError.message.includes('No rows found')) {
        console.log('⚠️ Could not delete teacher classes:', teacherClassesError);
      } else {
        console.log('✅ Deleted teacher classes');
        specificTableDeleted = true;
      }
    }

    // Step 2: Delete from enrollments table
    const { error: enrollmentsError } = await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', userId);
    
    if (enrollmentsError && !enrollmentsError.message.includes('No rows found')) {
      console.log('⚠️ Could not delete enrollments:', enrollmentsError);
    } else {
      console.log('✅ Deleted enrollments');
    }

    // Step 3: Delete from other related tables
    const relatedTables = [
      'grade10_mini_projects',
      'grade10_project_comments', 
      'grade10_project_files',
      'files'
    ];

    for (const table of relatedTables) {
      try {
        let query;
        if (table === 'grade10_mini_projects') {
          query = supabase.from(table).delete().eq('student_id', userId);
        } else if (table === 'files') {
          query = supabase.from(table).delete().eq('owner_user_id', userId);
        } else {
          query = supabase.from(table).delete().eq('user_id', userId);
        }

        const { error } = await query;
        
        if (error && !error.message.includes('No rows found')) {
          console.log(`⚠️ Could not delete from ${table}:`, error);
        } else {
          console.log(`✅ Deleted from ${table}`);
        }
      } catch (err) {
        console.log(`⚠️ Exception deleting from ${table}:`, err);
      }
    }

    // Step 4: Delete from profiles table
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileDeleteError) {
      console.error('❌ Error deleting profile:', profileDeleteError);
      throw new Error(`Failed to delete user profile: ${profileDeleteError.message}`);
    }
    console.log('✅ Deleted user profile');

    // Step 5: Delete from auth.users (this is the final step)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('❌ Error deleting from auth.users:', authDeleteError);
      throw new Error(`Failed to delete from authentication: ${authDeleteError.message}`);
    }
    console.log('✅ Deleted from auth.users');

    // Log the deletion in audit log
    await supabase
      .from('audit_log')
      .insert({
        actor_user_id: user.id,
        action: 'USER_COMPLETE_DELETION',
        entity: 'users',
        payload_json: {
          deleted_user_id: userId,
          user_type: userType,
          deleted_user_email: targetUserProfile?.email,
          deleted_user_name: targetUserProfile?.full_name,
          deletion_method: 'complete_deletion_function'
        }
      });

    console.log(`✅ Complete deletion successful for user: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${userId} has been completely deleted from all systems`,
        deletedUserId: userId,
        userType: userType
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Complete deletion function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Deletion failed',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});