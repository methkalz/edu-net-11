import { supabase } from '@/integrations/supabase/client';

/**
 * Script لترحيل البيانات الحالية إلى نظام النقاط الجديد
 * يجب تشغيل هذا Script من قبل السوبر أدمن مرة واحدة فقط
 */
export const migrateStudentPointsData = async () => {
  try {
    console.log('بدء ترحيل بيانات النقاط...');

    // 1. جلب إعدادات النقاط
    const { data: config, error: configError } = await supabase
      .from('grade11_points_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (configError || !config) {
      throw new Error('فشل في جلب إعدادات النقاط');
    }

    console.log('إعدادات النقاط:', config);

    // 2. جلب جميع اللاعبين في الصف الحادي عشر
    const { data: players, error: playersError } = await supabase
      .from('grade11_player_profiles')
      .select('user_id, total_xp');

    if (playersError) {
      throw new Error('فشل في جلب اللاعبين');
    }

    console.log(`عدد اللاعبين: ${players?.length || 0}`);

    // 3. جلب أعداد المحتوى
    const [lessonsResult, videosResult] = await Promise.all([
      supabase
        .from('grade11_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('grade11_videos')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);

    const totalLessons = lessonsResult.count || 267;
    const totalVideos = videosResult.count || 5;

    const pointsPerLesson = Math.floor(
      ((config.lessons_percentage * config.total_max_points) / 100) / totalLessons
    );
    const pointsPerVideo = Math.floor(
      ((config.videos_percentage * config.total_max_points) / 100) / totalVideos
    );

    console.log(`نقاط كل درس: ${pointsPerLesson}`);
    console.log(`نقاط كل فيديو: ${pointsPerVideo}`);

    // 4. معالجة كل لاعب
    let successCount = 0;
    let errorCount = 0;

    for (const player of players || []) {
      try {
        // التحقق من وجود سجل points breakdown
        const { data: existingBreakdown } = await supabase
          .from('grade11_student_points_breakdown')
          .select('id')
          .eq('student_id', player.user_id)
          .maybeSingle();

        if (existingBreakdown) {
          console.log(`سجل النقاط موجود مسبقاً للطالب: ${player.user_id}`);
          continue;
        }

        // جلب تقدم الطالب في الدروس من student_progress
        const { data: lessonProgress, error: lessonError } = await supabase
          .from('student_progress')
          .select('content_id')
          .eq('student_id', player.user_id)
          .eq('content_type', 'lesson')
          .eq('progress_percentage', 100);

        if (lessonError) {
          console.error('خطأ في جلب تقدم الدروس:', lessonError);
        }

        const completedLessonsCount = lessonProgress?.length || 0;
        const lessonsPoints = Math.min(
          completedLessonsCount * pointsPerLesson,
          (config.lessons_percentage * config.total_max_points) / 100
        );

        // جلب تقدم الطالب في الفيديوهات
        const { data: videoProgress, error: videoError } = await supabase
          .from('student_progress')
          .select('content_id')
          .eq('student_id', player.user_id)
          .eq('content_type', 'video')
          .eq('progress_percentage', 100);

        if (videoError) {
          console.error('خطأ في جلب تقدم الفيديوهات:', videoError);
        }

        const completedVideosCount = videoProgress?.length || 0;
        const videosPoints = Math.min(
          completedVideosCount * pointsPerVideo,
          (config.videos_percentage * config.total_max_points) / 100
        );

        // حساب نقاط الألعاب من الـ total_xp الحالي
        const currentTotalXP = player.total_xp || 0;
        const calculatedContentPoints = config.initial_points + lessonsPoints + videosPoints;
        const gamesPoints = Math.max(0, currentTotalXP - calculatedContentPoints);

        // إنشاء سجل breakdown
        const { error: insertError } = await supabase
          .from('grade11_student_points_breakdown')
          .insert({
            student_id: player.user_id,
            initial_points: config.initial_points,
            lessons_points: Math.floor(lessonsPoints),
            videos_points: Math.floor(videosPoints),
            games_points: Math.floor(gamesPoints),
            lessons_completed: completedLessonsCount,
            videos_completed: completedVideosCount,
          });

        if (insertError) {
          throw insertError;
        }

        // تحديث total_xp في player_profiles
        const newTotalXP =
          config.initial_points +
          Math.floor(lessonsPoints) +
          Math.floor(videosPoints) +
          Math.floor(gamesPoints);

        await supabase
          .from('grade11_player_profiles')
          .update({ total_xp: newTotalXP })
          .eq('user_id', player.user_id);

        successCount++;
        console.log(`تم ترحيل بيانات الطالب: ${player.user_id}`);
      } catch (error) {
        errorCount++;
        console.error(`خطأ في ترحيل بيانات الطالب ${player.user_id}:`, error);
      }
    }

    console.log(`اكتمل الترحيل. نجح: ${successCount}, فشل: ${errorCount}`);

    return {
      success: true,
      successCount,
      errorCount,
      message: `تم ترحيل ${successCount} طالب بنجاح. فشل ${errorCount} طالب.`,
    };
  } catch (error) {
    console.error('خطأ في ترحيل البيانات:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    };
  }
};
