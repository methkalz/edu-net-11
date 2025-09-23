import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';
import { useStudentProgress } from './useStudentProgress';

export interface StudentGrade11Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  topics: StudentGrade11Topic[];
  progress?: {
    completed_lessons: number;
    total_lessons: number;
    progress_percentage: number;
  };
}

export interface StudentGrade11Topic {
  id: string;
  section_id: string;
  title: string;
  content?: string;
  order_index: number;
  created_at: string;
  lessons: StudentGrade11Lesson[];
  progress?: {
    completed_lessons: number;
    total_lessons: number;
    progress_percentage: number;
  };
}

export interface StudentGrade11Lesson {
  id: string;
  topic_id: string;
  title: string;
  content?: string;
  order_index: number;
  created_at: string;
  media: StudentGrade11LessonMedia[];
  progress?: {
    progress_percentage: number;
    points_earned: number;
    completed_at?: string;
    time_spent?: number;
  };
  is_unlocked?: boolean;
  estimated_duration?: number; // في الدقائق
}

export interface StudentGrade11LessonMedia {
  id: string;
  lesson_id: string;
  media_type: 'video' | 'lottie' | 'image' | 'code';
  file_path: string;
  file_name: string;
  metadata: Record<string, any>;
  order_index: number;
  created_at: string;
}

export const useStudentGrade11Content = () => {
  const [sections, setSections] = useState<StudentGrade11Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const { getProgress, updateProgress } = useStudentProgress();

  const fetchContentWithProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch sections with topics, lessons and media
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('grade11_sections')
        .select(`
          *,
          grade11_topics!inner (
            *,
            grade11_lessons!inner (
              *,
              grade11_lesson_media (*)
            )
          )
        `)
        .eq('grade11_topics.grade11_lessons.is_active', true)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      if (!sectionsData || sectionsData.length === 0) {
        setSections([]);
        return;
      }

      // Format sections and calculate progress
      const formattedSections = await Promise.all(
        sectionsData.map(async (section) => {
          const topics = await Promise.all(
            (section.grade11_topics || [])
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map(async (topic: any) => {
                const lessons = await Promise.all(
                  (topic.grade11_lessons || [])
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map(async (lesson: any) => {
                      // Get lesson progress
                      let progress = null;
                      if (userProfile?.user_id) {
                        progress = await getProgress(lesson.id, 'lesson');
                      }

                      return {
                        ...lesson,
                        media: (lesson.grade11_lesson_media || [])
                          .sort((a: any, b: any) => a.order_index - b.order_index),
                        progress,
                        is_unlocked: true, // سنحدد منطق فتح الدروس لاحقاً
                        estimated_duration: 15 // تقدير 15 دقيقة لكل درس
                      };
                    })
                );

                // Calculate topic progress
                const completedLessons = lessons.filter(l => l.progress?.progress_percentage >= 100).length;
                const topicProgress = {
                  completed_lessons: completedLessons,
                  total_lessons: lessons.length,
                  progress_percentage: lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0
                };

                return {
                  ...topic,
                  lessons,
                  progress: topicProgress
                };
              })
          );

          // Calculate section progress
          const allLessons = topics.flatMap(t => t.lessons);
          const completedLessons = allLessons.filter(l => l.progress?.progress_percentage >= 100).length;
          const sectionProgress = {
            completed_lessons: completedLessons,
            total_lessons: allLessons.length,
            progress_percentage: allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 0
          };

          return {
            ...section,
            topics,
            progress: sectionProgress
          };
        })
      );

      setSections(formattedSections);
    } catch (error) {
      logger.error('Error fetching Grade 11 content for student', error as Error);
      setError('حدث خطأ في تحميل محتوى الصف الحادي عشر');
      toast.error('حدث خطأ في تحميل المحتوى');
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async (lessonId: string, timeSpent: number = 0) => {
    try {
      if (!userProfile?.user_id) return;

      await updateProgress(lessonId, 'lesson', 100, timeSpent, 15);
      
      toast.success('تم إكمال الدرس بنجاح! +15 نقطة', {
        description: 'استمر في التعلم لكسب المزيد من النقاط'
      });

      // Refresh content to update progress
      fetchContentWithProgress();
    } catch (error) {
      toast.error('حدث خطأ في تسجيل إكمال الدرس');
    }
  };

  const updateLessonProgress = async (lessonId: string, progress: number, timeSpent: number = 0) => {
    try {
      if (!userProfile?.user_id) return;

      const points = progress >= 100 ? 15 : 0;
      await updateProgress(lessonId, 'lesson', progress, timeSpent, points);
      
      // Refresh content to update progress
      fetchContentWithProgress();
    } catch (error) {
      logger.error('Error updating lesson progress', error as Error);
    }
  };

  // Get statistics
  const getStatistics = () => {
    const allLessons = sections.flatMap(s => s.topics.flatMap(t => t.lessons));
    const completedLessons = allLessons.filter(l => l.progress?.progress_percentage >= 100);
    const inProgressLessons = allLessons.filter(l => l.progress && l.progress.progress_percentage > 0 && l.progress.progress_percentage < 100);
    const totalPoints = completedLessons.reduce((sum, lesson) => sum + (lesson.progress?.points_earned || 0), 0);
    const totalTime = allLessons.reduce((sum, lesson) => sum + (lesson.progress?.time_spent || 0), 0);

    return {
      totalSections: sections.length,
      totalTopics: sections.flatMap(s => s.topics).length,
      totalLessons: allLessons.length,
      completedLessons: completedLessons.length,
      inProgressLessons: inProgressLessons.length,
      totalPoints,
      totalTimeSpent: totalTime,
      overallProgress: allLessons.length > 0 ? Math.round((completedLessons.length / allLessons.length) * 100) : 0
    };
  };

  useEffect(() => {
    if (userProfile?.user_id) {
      fetchContentWithProgress();
    }
  }, [userProfile?.user_id]);

  return {
    sections,
    loading,
    error,
    fetchContentWithProgress,
    completeLesson,
    updateLessonProgress,
    getStatistics: getStatistics()
  };
};