import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PointsConfig {
  id: string;
  total_max_points: number;
  initial_points: number;
  lessons_percentage: number;
  videos_percentage: number;
  games_percentage: number;
  is_active: boolean;
  updated_at: string;
}

interface StudentPointsBreakdown {
  id: string;
  student_id: string;
  lessons_points: number;
  videos_points: number;
  games_points: number;
  initial_points: number;
  lessons_completed: number;
  videos_completed: number;
  updated_at: string;
}

interface ContentCounts {
  totalLessons: number;
  totalVideos: number;
  totalGames: number;
}

export const useGrade11PointsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // جلب إعدادات النقاط
  const { data: pointsConfig, isLoading: configLoading } = useQuery({
    queryKey: ['grade11-points-config'],
    queryFn: async (): Promise<PointsConfig | null> => {
      const { data, error } = await supabase
        .from('grade11_points_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // جلب تفصيل نقاط الطالب
  const { data: studentPoints, isLoading: pointsLoading } = useQuery({
    queryKey: ['grade11-student-points', user?.id],
    queryFn: async (): Promise<StudentPointsBreakdown | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('grade11_student_points_breakdown')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // جلب عدد المحتوى
  const { data: contentCounts } = useQuery({
    queryKey: ['grade11-content-counts'],
    queryFn: async (): Promise<ContentCounts> => {
      const [lessonsResult, videosResult, gamesResult] = await Promise.all([
        supabase
          .from('grade11_lessons')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('grade11_videos')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('pair_matching_games')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
      ]);

      return {
        totalLessons: lessonsResult.count || 0,
        totalVideos: videosResult.count || 0,
        totalGames: gamesResult.count || 0,
      };
    },
  });

  // حساب النقاط لكل درس
  const calculatePointsPerLesson = useCallback(() => {
    if (!pointsConfig || !contentCounts || contentCounts.totalLessons === 0) {
      return 0;
    }

    const lessonsMaxPoints = (pointsConfig.lessons_percentage * pointsConfig.total_max_points) / 100;
    return Math.floor(lessonsMaxPoints / contentCounts.totalLessons);
  }, [pointsConfig, contentCounts]);

  // حساب النقاط لكل فيديو
  const calculatePointsPerVideo = useCallback(() => {
    if (!pointsConfig || !contentCounts || contentCounts.totalVideos === 0) {
      return 0;
    }

    const videosMaxPoints = (pointsConfig.videos_percentage * pointsConfig.total_max_points) / 100;
    return Math.floor(videosMaxPoints / contentCounts.totalVideos);
  }, [pointsConfig, contentCounts]);

  // حساب الحد الأقصى لنقاط الألعاب
  const calculateMaxGamesPoints = useCallback(() => {
    if (!pointsConfig) return 0;
    return (pointsConfig.games_percentage * pointsConfig.total_max_points) / 100;
  }, [pointsConfig]);

  // حساب إجمالي النقاط
  const calculateTotalPoints = useCallback(() => {
    if (!studentPoints || !pointsConfig) return pointsConfig?.initial_points || 100;

    return (
      studentPoints.initial_points +
      studentPoints.lessons_points +
      studentPoints.videos_points +
      studentPoints.games_points
    );
  }, [studentPoints, pointsConfig]);

  // إنشاء سجل نقاط للطالب
  const createStudentPointsRecord = useMutation({
    mutationFn: async (studentId: string) => {
      if (!pointsConfig) {
        throw new Error('لم يتم العثور على إعدادات النقاط');
      }

      const { data, error } = await supabase
        .from('grade11_student_points_breakdown')
        .insert({
          student_id: studentId,
          initial_points: pointsConfig.initial_points,
          lessons_points: 0,
          videos_points: 0,
          games_points: 0,
          lessons_completed: 0,
          videos_completed: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade11-student-points'] });
    },
  });

  // تحديث نقاط الدروس
  const updateLessonPoints = useMutation({
    mutationFn: async ({ studentId, lessonId }: { studentId: string; lessonId: string }) => {
      // التحقق من وجود سجل للطالب
      let currentPoints = studentPoints;
      if (!currentPoints) {
        await createStudentPointsRecord.mutateAsync(studentId);
        const { data } = await supabase
          .from('grade11_student_points_breakdown')
          .select('*')
          .eq('student_id', studentId)
          .single();
        currentPoints = data;
      }

      if (!currentPoints) throw new Error('فشل في إنشاء سجل النقاط');

      const pointsPerLesson = calculatePointsPerLesson();
      const lessonsMaxPoints = pointsConfig
        ? (pointsConfig.lessons_percentage * pointsConfig.total_max_points) / 100
        : 500;

      const newLessonsPoints = Math.min(
        currentPoints.lessons_points + pointsPerLesson,
        lessonsMaxPoints
      );
      const newLessonsCompleted = currentPoints.lessons_completed + 1;

      const { data, error } = await supabase
        .from('grade11_student_points_breakdown')
        .update({
          lessons_points: newLessonsPoints,
          lessons_completed: newLessonsCompleted,
        })
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;

      // تحديث total_xp في grade11_player_profiles
      const totalPoints =
        currentPoints.initial_points +
        newLessonsPoints +
        currentPoints.videos_points +
        currentPoints.games_points;

      await supabase
        .from('grade11_player_profiles')
        .update({ total_xp: totalPoints })
        .eq('user_id', studentId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade11-student-points'] });
      queryClient.invalidateQueries({ queryKey: ['player-profile'] });
      toast({
        title: 'تم إضافة النقاط',
        description: `حصلت على ${calculatePointsPerLesson()} نقطة لإكمال الدرس`,
      });
    },
    onError: (error) => {
      console.error('خطأ في تحديث نقاط الدرس:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث النقاط',
        variant: 'destructive',
      });
    },
  });

  // تحديث نقاط الفيديوهات
  const updateVideoPoints = useMutation({
    mutationFn: async ({ studentId, videoId }: { studentId: string; videoId: string }) => {
      // التحقق من وجود سجل للطالب
      let currentPoints = studentPoints;
      if (!currentPoints) {
        await createStudentPointsRecord.mutateAsync(studentId);
        const { data } = await supabase
          .from('grade11_student_points_breakdown')
          .select('*')
          .eq('student_id', studentId)
          .single();
        currentPoints = data;
      }

      if (!currentPoints) throw new Error('فشل في إنشاء سجل النقاط');

      const pointsPerVideo = calculatePointsPerVideo();
      const videosMaxPoints = pointsConfig
        ? (pointsConfig.videos_percentage * pointsConfig.total_max_points) / 100
        : 100;

      const newVideosPoints = Math.min(
        currentPoints.videos_points + pointsPerVideo,
        videosMaxPoints
      );
      const newVideosCompleted = currentPoints.videos_completed + 1;

      const { data, error } = await supabase
        .from('grade11_student_points_breakdown')
        .update({
          videos_points: newVideosPoints,
          videos_completed: newVideosCompleted,
        })
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;

      // تحديث total_xp في grade11_player_profiles
      const totalPoints =
        currentPoints.initial_points +
        currentPoints.lessons_points +
        newVideosPoints +
        currentPoints.games_points;

      await supabase
        .from('grade11_player_profiles')
        .update({ total_xp: totalPoints })
        .eq('user_id', studentId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade11-student-points'] });
      queryClient.invalidateQueries({ queryKey: ['player-profile'] });
      toast({
        title: 'تم إضافة النقاط',
        description: `حصلت على ${calculatePointsPerVideo()} نقطة لمشاهدة الفيديو`,
      });
    },
    onError: (error) => {
      console.error('خطأ في تحديث نقاط الفيديو:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث النقاط',
        variant: 'destructive',
      });
    },
  });

  // تحديث نقاط الألعاب
  const updateGamePoints = useMutation({
    mutationFn: async ({ studentId, points }: { studentId: string; points: number }) => {
      // التحقق من وجود سجل للطالب
      let currentPoints = studentPoints;
      if (!currentPoints) {
        await createStudentPointsRecord.mutateAsync(studentId);
        const { data } = await supabase
          .from('grade11_student_points_breakdown')
          .select('*')
          .eq('student_id', studentId)
          .single();
        currentPoints = data;
      }

      if (!currentPoints) throw new Error('فشل في إنشاء سجل النقاط');

      const gamesMaxPoints = calculateMaxGamesPoints();
      const newGamesPoints = Math.min(currentPoints.games_points + points, gamesMaxPoints);

      const { data, error } = await supabase
        .from('grade11_student_points_breakdown')
        .update({
          games_points: newGamesPoints,
        })
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;

      // تحديث total_xp في grade11_player_profiles
      const totalPoints =
        currentPoints.initial_points +
        currentPoints.lessons_points +
        currentPoints.videos_points +
        newGamesPoints;

      await supabase
        .from('grade11_player_profiles')
        .update({ total_xp: totalPoints })
        .eq('user_id', studentId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade11-student-points'] });
      queryClient.invalidateQueries({ queryKey: ['player-profile'] });
    },
  });

  return {
    pointsConfig,
    studentPoints,
    contentCounts,
    loading: configLoading || pointsLoading || loading,
    calculatePointsPerLesson,
    calculatePointsPerVideo,
    calculateMaxGamesPoints,
    calculateTotalPoints,
    updateLessonPoints: updateLessonPoints.mutate,
    updateVideoPoints: updateVideoPoints.mutate,
    updateGamePoints: updateGamePoints.mutate,
    createStudentPointsRecord: createStudentPointsRecord.mutate,
  };
};
