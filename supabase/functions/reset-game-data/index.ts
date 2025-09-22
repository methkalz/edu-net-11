import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId, lessonId, gameId, adminId } = await req.json();

    console.log('🎮 Reset game data request:', { action, userId, lessonId, gameId, adminId });

    // التحقق من صلاحيات المدير
    const { data: adminProfile, error: adminError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .single();

    if (adminError || adminProfile?.role !== 'superadmin') {
      console.error('❌ Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only super admins can reset game data' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let result: any = {};

    switch (action) {
      case 'reset_user':
        if (!userId) {
          throw new Error('User ID is required for user reset');
        }
        result = await resetUserGameData(supabaseClient, userId, gameId, adminId);
        break;

      case 'reset_lesson':
        if (!lessonId) {
          throw new Error('Lesson ID is required for lesson reset');
        }
        result = await resetLessonData(supabaseClient, lessonId, gameId, adminId);
        break;

      case 'reset_game':
        if (!gameId) {
          throw new Error('Game ID is required for game reset');
        }
        result = await resetGameData(supabaseClient, gameId, adminId);
        break;

      case 'reset_all':
        result = await resetAllGameData(supabaseClient, adminId);
        break;

      default:
        throw new Error('Invalid action specified');
    }

    console.log('✅ Game data reset completed:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Game data reset completed successfully',
        ...result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in reset-game-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to reset game data'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function resetUserGameData(supabaseClient: any, userId: string, gameId: string | null, adminId: string) {
  console.log(`🎯 Resetting Pair Matching game data for user: ${userId}${gameId ? ` in game: ${gameId}` : ' (all games)'}`);

  const affectedTables: string[] = [];

  // حذف سجلات التقدم للاعب في ألعاب المطابقة
  let progressQuery = supabaseClient
    .from('player_game_progress')
    .delete()
    .eq('player_id', userId);

  if (gameId) {
    progressQuery = progressQuery.eq('game_id', gameId);
  }

  const { error: progressError } = await progressQuery;

  if (progressError) {
    console.error('Error deleting player game progress:', progressError);
    throw new Error(`Failed to delete player game progress: ${progressError.message}`);
  }
  affectedTables.push('player_game_progress');

  // حذف جلسات ألعاب المطابقة للمستخدم
  let sessionsQuery = supabaseClient
    .from('pair_matching_sessions')
    .delete()
    .eq('player_id', userId);

  if (gameId) {
    sessionsQuery = sessionsQuery.eq('game_id', gameId);
  }

  const { error: sessionsError } = await sessionsQuery;

  if (sessionsError) {
    console.error('Error deleting pair matching sessions:', sessionsError);
    // لا نوقف العملية إذا فشل حذف الجلسات
  } else {
    affectedTables.push('pair_matching_sessions');
  }

  // حذف نتائج ألعاب المطابقة للمستخدم
  let resultsQuery = supabaseClient
    .from('pair_matching_results')
    .delete()
    .eq('player_id', userId);

  if (gameId) {
    resultsQuery = resultsQuery.eq('game_id', gameId);
  }

  const { error: resultsError } = await resultsQuery;

  if (resultsError) {
    console.error('Error deleting pair matching results:', resultsError);
    // لا نوقف العملية إذا فشل حذف النتائج
  } else {
    affectedTables.push('pair_matching_results');
  }

  console.log(`✅ Pair Matching game data reset completed for user: ${userId}`);

  // تسجيل العملية في سجل المراجعة
  await supabaseClient
    .from('audit_log')
    .insert({
      actor_user_id: adminId,
      action: 'RESET_USER_GAME_DATA',
      entity: 'game_data',
      entity_id: userId,
        payload_json: {
        action: 'reset_user_game_data',
        target_user_id: userId,
        game_id: gameId,
        reset_time: new Date().toISOString(),
        tables_affected: affectedTables
      }
    });

  return { 
    message: `Game data reset completed for user ${userId}${gameId ? ` in game ${gameId}` : ' (all games)'}`,
    affectedTables,
    gameId: gameId
  };
}

async function resetLessonData(supabaseClient: any, lessonId: string, gameId: string | null, adminId: string) {
  console.log(`📚 Resetting game data for lesson: ${lessonId}${gameId ? ` in game: ${gameId}` : ' (all games)'}`);

  // حذف سجلات التقدم للدرس
  const { error: progressError } = await supabaseClient
    .from('grade11_game_progress')
    .delete()
    .eq('lesson_id', lessonId);

  if (progressError) {
    console.error('Error deleting lesson progress:', progressError);
    throw new Error(`Failed to delete lesson progress: ${progressError.message}`);
  }

  // حذف الأسئلة المولدة للدرس
  const { error: questionsError } = await supabaseClient
    .from('grade11_generated_questions')
    .delete()
    .eq('lesson_id', lessonId);

  if (questionsError) {
    console.error('Error deleting generated questions:', questionsError);
    // لا نوقف العملية إذا فشل حذف الأسئلة المولدة
  }

  // تسجيل العملية في سجل المراجعة
  await supabaseClient
    .from('audit_log')
    .insert({
      actor_user_id: adminId,
      action: 'RESET_LESSON_GAME_DATA',
      entity: 'game_data',
      entity_id: lessonId,
        payload_json: {
        action: 'reset_lesson_game_data',
        lesson_id: lessonId,
        game_id: gameId,
        reset_time: new Date().toISOString(),
        tables_affected: ['grade11_game_progress', 'grade11_generated_questions']
      }
    });

  return { 
    message: `Game data reset completed for lesson ${lessonId}${gameId ? ` in game ${gameId}` : ' (all games)'}`,
    affectedTables: ['grade11_game_progress', 'grade11_generated_questions'],
    gameId: gameId
  };
}

async function resetAllGameData(supabaseClient: any, adminId: string) {
  console.log('🚨 Resetting ALL Pair Matching game data - DANGER ZONE');

  const affectedTables: string[] = [];
  const errors: string[] = [];

  // حذف جميع سجلات تقدم اللاعبين
  try {
    const { error: progressError } = await supabaseClient
      .from('player_game_progress')
      .delete()
      .neq('player_id', '00000000-0000-0000-0000-000000000000'); // حذف جميع السجلات

    if (progressError) {
      errors.push(`Player progress deletion failed: ${progressError.message}`);
    } else {
      affectedTables.push('player_game_progress');
    }
  } catch (error) {
    errors.push(`Player progress deletion error: ${error.message}`);
  }

  // حذف جميع جلسات ألعاب المطابقة
  try {
    const { error: sessionsError } = await supabaseClient
      .from('pair_matching_sessions')
      .delete()
      .neq('player_id', '00000000-0000-0000-0000-000000000000'); // حذف جميع السجلات

    if (sessionsError) {
      errors.push(`Pair matching sessions deletion failed: ${sessionsError.message}`);
    } else {
      affectedTables.push('pair_matching_sessions');
    }
  } catch (error) {
    errors.push(`Pair matching sessions deletion error: ${error.message}`);
  }

  // حذف جميع نتائج ألعاب المطابقة
  try {
    const { error: resultsError } = await supabaseClient
      .from('pair_matching_results')
      .delete()
      .neq('player_id', '00000000-0000-0000-0000-000000000000'); // حذف جميع السجلات

    if (resultsError) {
      errors.push(`Pair matching results deletion failed: ${resultsError.message}`);
    } else {
      affectedTables.push('pair_matching_results');
    }
  } catch (error) {
    errors.push(`Pair matching results deletion error: ${error.message}`);
  }

  // تسجيل العملية في سجل المراجعة
  await supabaseClient
    .from('audit_log')
    .insert({
      actor_user_id: adminId,
      action: 'RESET_ALL_GAME_DATA',
      entity: 'game_data',
      payload_json: {
        action: 'reset_all_game_data',
        reset_time: new Date().toISOString(),
        affected_tables: affectedTables,
        errors: errors,
        warning: 'COMPLETE_SYSTEM_RESET'
      }
    });

  if (errors.length > 0) {
    console.error('⚠️ Some deletions failed:', errors);
    throw new Error(`Partial reset completed with errors: ${errors.join(', ')}`);
  }

  return { 
    message: 'All game data has been completely reset',
    affectedTables,
    warning: 'This was a complete system reset - all game progress has been lost'
  };
}

async function resetGameData(supabaseClient: any, gameId: string, adminId: string) {
  console.log(`🎯 Resetting data for specific game: ${gameId}`);

  const affectedTables: string[] = [];
  const errors: string[] = [];

  // Delete game data for specific game - currently deletes all records
  // TODO: When game_id is properly linked to all tables, filter by game_id
  
  try {
    // Delete progress data
    console.log('🎯 Deleting game progress for specific game...');
    const { error: progressError, count: progressCount } = await supabaseClient
      .from('grade11_game_progress')
      .delete({ count: 'exact' })
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (progressError) {
      console.error('❌ Error deleting progress:', progressError);
      throw progressError;
    }
    console.log(`✅ Game progress deleted. Records: ${progressCount}`);
    affectedTables.push('grade11_game_progress');
    
    // Delete achievements
    console.log('🏆 Deleting game achievements for specific game...');
    const { error: achievementsError, count: achievementsCount } = await supabaseClient
      .from('grade11_game_achievements')
      .delete({ count: 'exact' })
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (achievementsError) {
      console.error('❌ Error deleting achievements:', achievementsError);
      throw achievementsError;
    }
    console.log(`✅ Game achievements deleted. Records: ${achievementsCount}`);
    affectedTables.push('grade11_game_achievements');
    
    // Delete player profiles (coins, levels, experience) - CRITICAL
    console.log('🏆 Deleting player profiles for specific game...');
    const { error: profilesError, count: profilesCount } = await supabaseClient
      .from('grade11_player_profiles')
      .delete({ count: 'exact' })
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (profilesError) {
      console.error('❌ CRITICAL ERROR deleting player profiles:', profilesError);
      throw profilesError;
    }
    console.log(`✅ Player profiles deleted. Records: ${profilesCount}`);
    affectedTables.push('grade11_player_profiles');
    
    // Delete lesson rewards
    console.log('🎁 Deleting lesson rewards for specific game...');
    const { error: rewardsError, count: rewardsCount } = await supabaseClient
      .from('grade11_lesson_rewards')
      .delete({ count: 'exact' })
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (rewardsError) {
      console.error('❌ Error deleting lesson rewards:', rewardsError);
      throw rewardsError;
    }
    console.log(`✅ Lesson rewards deleted. Records: ${rewardsCount}`);
    affectedTables.push('grade11_lesson_rewards');

    // Delete lesson completion caps
    console.log('🔒 Deleting lesson completion caps for specific game...');
    const { error: capsError, count: capsCount } = await supabaseClient
      .from('grade11_lesson_completion_caps')
      .delete({ count: 'exact' })
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (capsError) {
      console.error('❌ Error deleting lesson completion caps:', capsError);
      throw capsError;
    }
    console.log(`✅ Lesson completion caps deleted. Records: ${capsCount}`);
    affectedTables.push('grade11_lesson_completion_caps');

  // تسجيل العملية في سجل المراجعة
  await supabaseClient
    .from('audit_log')
    .insert({
      actor_user_id: adminId,
      action: 'RESET_GAME_DATA',
      entity: 'game_data',
      entity_id: gameId,
      payload_json: {
        action: 'reset_game_data',
        game_id: gameId,
        reset_time: new Date().toISOString(),
        affected_tables: affectedTables,
        warning: 'SPECIFIC_GAME_RESET'
      }
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR during game data reset:', error);
    throw error;
  }

  return { 
    message: `Game data has been completely reset for game ${gameId}`,
    affectedTables,
    gameId,
    warning: 'This was a complete game reset - all progress for the specified game has been lost'
  };
}