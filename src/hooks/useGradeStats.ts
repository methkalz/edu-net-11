import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface GradeStats {
  grade10: {
    videos: number;
    documents: number;
    projects: number;
  };
  grade11: {
    sections: number;
    topics: number;
    lessons: number;
    documents: number;
    videos: number;
    games: number;
    exams: number;
  };
  grade12: {
    documents: number;
    videos: number;
  };
}

export const useGradeStats = () => {
  const [stats, setStats] = useState<GradeStats>({
    grade10: { videos: 0, documents: 0, projects: 0 },
    grade11: { sections: 0, topics: 0, lessons: 0, documents: 0, videos: 0, games: 0, exams: 0 },
    grade12: { documents: 0, videos: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // جلب إحصائيات الصف العاشر
        const [grade10VideosResult, grade10DocsResult, grade10ProjectsResult] = await Promise.all([
          supabase.from('grade10_videos').select('*', { count: 'exact', head: true }),
          supabase.from('grade10_documents').select('*', { count: 'exact', head: true }),
          supabase.from('grade10_mini_projects').select('*', { count: 'exact', head: true })
        ]);

        // جلب إحصائيات الصف الحادي عشر
        const [
          grade11SectionsResult,
          grade11TopicsResult,
          grade11LessonsResult,
          grade11DocsResult,
          grade11VideosResult,
          grade11GamesResult,
          grade11ExamsResult
        ] = await Promise.all([
          supabase.from('grade11_sections').select('*', { count: 'exact', head: true }),
          supabase.from('grade11_topics').select('*', { count: 'exact', head: true }),
          supabase.from('grade11_lessons').select('*', { count: 'exact', head: true }),
          supabase.from('grade11_documents').select('*', { count: 'exact', head: true }),
          supabase.from('grade11_videos').select('*', { count: 'exact', head: true }),
          supabase.from('games').select('*', { count: 'exact', head: true }).eq('grade_level', '11').eq('is_active', true),
          supabase.from('exam_templates').select('*', { count: 'exact', head: true }).eq('grade_level', '11')
        ]);

        // جلب إحصائيات الصف الثاني عشر
        const [grade12DocsResult, grade12VideosResult] = await Promise.all([
          supabase.from('grade12_documents').select('*', { count: 'exact', head: true }),
          supabase.from('grade12_videos').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          grade10: {
            videos: grade10VideosResult.count || 0,
            documents: grade10DocsResult.count || 0,
            projects: grade10ProjectsResult.count || 0
          },
          grade11: {
            sections: grade11SectionsResult.count || 0,
            topics: grade11TopicsResult.count || 0,
            lessons: grade11LessonsResult.count || 0,
            documents: grade11DocsResult.count || 0,
            videos: grade11VideosResult.count || 0,
            games: grade11GamesResult.count || 0,
            exams: grade11ExamsResult.count || 0
          },
          grade12: {
            documents: grade12DocsResult.count || 0,
            videos: grade12VideosResult.count || 0
          }
        });
      } catch (err) {
        logger.error('Error fetching grade stats', err as Error);
        setError('حدث خطأ في جلب الإحصائيات');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};