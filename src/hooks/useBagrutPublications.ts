// إدارة نشر امتحانات البجروت (طبقة المعلم)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface BagrutPublicationRow {
  id: string;
  exam_id: string;
  teacher_id: string;
  class_id: string;
  school_id: string | null;
  available_from: string;
  available_until: string;
  max_attempts: number;
  show_answers_to_students: boolean;
  allow_review_after_submit: boolean;
  is_active: boolean;
  notes: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface BagrutPublicationInput {
  exam_id: string;
  class_id: string;
  available_from: string; // ISO
  available_until: string; // ISO
  max_attempts: number;
  show_answers_to_students: boolean;
  allow_review_after_submit: boolean;
  notes?: string | null;
  is_active?: boolean;
}

export interface TeacherEligibleClass {
  class_id: string;
  class_label: string;
  grade_code: string;
  grade_label: string;
  students_count: number;
}

/**
 * صفوف المعلم المؤهلة لنشر امتحان (صفوفه التي مستواها ضمن available_for_grades للامتحان).
 */
export function useTeacherEligibleClasses(examId?: string, availableForGrades?: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teacher-eligible-classes', user?.id, examId, availableForGrades],
    enabled: !!user?.id && !!examId,
    queryFn: async (): Promise<TeacherEligibleClass[]> => {
      // 1) صفوف المعلم
      const { data: tc, error: tcErr } = await supabase
        .from('teacher_classes')
        .select(`
          class_id,
          classes!inner(
            id,
            class_name_id,
            grade_level_id,
            class_names!inner(label),
            grade_levels!inner(code, label)
          )
        `)
        .eq('teacher_id', user!.id);
      if (tcErr) throw tcErr;

      const rows = (tc || []).map((r: any) => ({
        class_id: r.class_id as string,
        class_label: (r.classes?.class_names?.label as string) || 'صف',
        grade_code: (r.classes?.grade_levels?.code as string) || '',
        grade_label: (r.classes?.grade_levels?.label as string) || '',
      }));

      // 2) فلترة حسب available_for_grades للامتحان
      const allowedGrades = (availableForGrades || []).map(String);
      const eligible = allowedGrades.length
        ? rows.filter(r => allowedGrades.includes(r.grade_code))
        : rows;

      if (eligible.length === 0) return [];

      // 3) أعداد الطلاب لكل صف
      const classIds = eligible.map(e => e.class_id);
      const { data: cs } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds);

      const counts = new Map<string, number>();
      (cs || []).forEach((r: any) => counts.set(r.class_id, (counts.get(r.class_id) || 0) + 1));

      return eligible.map(e => ({
        ...e,
        students_count: counts.get(e.class_id) || 0,
      }));
    },
  });
}

/**
 * نشرات المعلم لامتحان معيّن.
 */
export function useExamPublications(examId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bagrut-publications', examId, user?.id],
    enabled: !!examId && !!user?.id,
    queryFn: async (): Promise<BagrutPublicationRow[]> => {
      const { data, error } = await supabase
        .from('bagrut_exam_publications')
        .select('*')
        .eq('exam_id', examId!)
        .eq('teacher_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BagrutPublicationRow[];
    },
  });
}

/**
 * كل نشرات المعلم (لوحة التحكم / تبويب النشرات النشطة).
 */
export function useAllTeacherPublications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bagrut-publications-all', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bagrut_exam_publications')
        .select(`
          *,
          bagrut_exams!inner(id, title, subject, exam_year, exam_season, total_points, duration_minutes),
          classes!inner(id, class_names!inner(label), grade_levels!inner(code, label))
        `)
        .eq('teacher_id', user!.id)
        .order('available_from', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * إنشاء/تعديل/حذف نشر.
 */
export function useBagrutPublicationMutations(examId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['bagrut-publications', examId] });
    qc.invalidateQueries({ queryKey: ['bagrut-publications-all'] });
    qc.invalidateQueries({ queryKey: ['teacher-bagrut-stats'] });
  };

  const create = useMutation({
    mutationFn: async (payload: BagrutPublicationInput & { teacher_id: string }) => {
      const { data, error } = await supabase
        .from('bagrut_exam_publications')
        .insert({
          exam_id: payload.exam_id,
          teacher_id: payload.teacher_id,
          class_id: payload.class_id,
          available_from: payload.available_from,
          available_until: payload.available_until,
          max_attempts: payload.max_attempts,
          show_answers_to_students: payload.show_answers_to_students,
          allow_review_after_submit: payload.allow_review_after_submit,
          is_active: payload.is_active ?? true,
          notes: payload.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('تم نشر الامتحان للصف'); invalidate(); },
    onError: (e: any) => toast.error(e?.message || 'فشل نشر الامتحان لهذا الصف'),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BagrutPublicationInput> & { is_active?: boolean } }) => {
      const { data, error } = await supabase
        .from('bagrut_exam_publications')
        .update(patch as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('تم تحديث النشر'); invalidate(); },
    onError: (e: any) => toast.error(e?.message || 'فشل تحديث النشر'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // فحص وجود محاولات
      const { count } = await supabase
        .from('bagrut_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('publication_id', id);
      if ((count || 0) > 0) {
        throw new Error('لا يمكن حذف النشر لوجود محاولات طلاب — يمكنك إيقافه بدلاً من ذلك.');
      }
      const { error } = await supabase.from('bagrut_exam_publications').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => { toast.success('تم حذف النشر'); invalidate(); },
    onError: (e: any) => toast.error(e?.message || 'فشل حذف النشر'),
  });

  return { create, update, remove };
}
