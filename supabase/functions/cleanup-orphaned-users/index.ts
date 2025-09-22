import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  dryRun?: boolean;
  confirmDelete?: boolean;
}

Deno.serve(async (req) => {
  console.log('🧹 Cleanup orphaned users function called');

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

    // Parse request body
    const body: CleanupRequest = await req.json();
    const { dryRun = false, confirmDelete = false } = body;

    console.log(`🔍 Starting cleanup - Dry run: ${dryRun}, Confirm delete: ${confirmDelete}`);

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      throw authError;
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth.users`);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`📊 Found ${profiles.length} profiles`);

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('user_id')
      .not('user_id', 'is', null);
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      throw studentsError;
    }

    console.log(`📊 Found ${students.length} students with user_id`);

    // Create sets of user IDs that have associated records
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const studentUserIds = new Set(students.map(s => s.user_id));
    const allLinkedUserIds = new Set([...profileUserIds, ...studentUserIds]);

    // Find orphaned users
    const orphanedUsers = authUsers.users.filter(user => 
      !allLinkedUserIds.has(user.id)
    );

    console.log(`🔍 Found ${orphanedUsers.length} orphaned users`);

    // Log orphaned users details
    orphanedUsers.forEach(user => {
      console.log(`👤 Orphaned user: ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`);
    });

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Dry run completed - no users deleted',
          orphanedUsersCount: orphanedUsers.length,
          orphanedUsers: orphanedUsers.map(u => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at
          }))
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!confirmDelete) {
      return new Response(
        JSON.stringify({
          error: 'Confirmation required',
          message: 'Set confirmDelete: true to proceed with deletion',
          orphanedUsersCount: orphanedUsers.length
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Delete orphaned users
    let deletedCount = 0;
    const errors: string[] = [];

    for (const user of orphanedUsers) {
      try {
        console.log(`🗑️ Deleting user: ${user.email} (${user.id})`);
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting user ${user.email}:`, deleteError);
          errors.push(`Failed to delete ${user.email}: ${deleteError.message}`);
        } else {
          console.log(`✅ Successfully deleted user: ${user.email}`);
          deletedCount++;
        }
      } catch (error) {
        console.error(`❌ Exception deleting user ${user.email}:`, error);
        errors.push(`Exception deleting ${user.email}: ${error.message}`);
      }
    }

    console.log(`✅ Cleanup completed - Deleted ${deletedCount} orphaned users`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted ${deletedCount} orphaned users`,
        deletedCount,
        totalOrphanedFound: orphanedUsers.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Cleanup function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});