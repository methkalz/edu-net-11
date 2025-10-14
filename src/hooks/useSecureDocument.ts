import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSecureDocument = () => {
  // فتح المستند بشكل آمن عبر Edge Function
  const openDocument = async (studentId?: string, documentId?: string) => {
    try {
      toast.loading('جاري فتح المستند...', { id: 'open-doc' });

      const { data, error } = await supabase.functions.invoke('get-student-document', {
        body: {
          student_id: studentId,
          document_id: documentId
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success || !data.url) {
        throw new Error('فشل في الحصول على رابط المستند');
      }

      // فتح المستند في نافذة جديدة
      window.open(data.url, '_blank');

      toast.success('تم فتح المستند بنجاح', { id: 'open-doc' });

      return data;
    } catch (error: any) {
      console.error('Error opening document:', error);
      toast.error(error.message || 'فشل في فتح المستند', { id: 'open-doc' });
      return null;
    }
  };

  // إنشاء مستند جديد
  const createDocument = async (
    studentName: string,
    documentContent: string = '',
    gradeLevel: string = '12'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // جلب معلومات الطالب
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) {
        throw new Error('لم يتم العثور على معلومات الطالب');
      }

      toast.loading('جاري إنشاء المستند...', { id: 'create-doc' });

      const { data, error } = await supabase.functions.invoke('create-google-doc', {
        body: {
          studentName,
          documentContent,
          student_id: student.id,
          grade_level: gradeLevel
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في إنشاء المستند');
      }

      toast.success('تم إنشاء المستند بنجاح', { id: 'create-doc' });

      // فتح المستند الجديد
      if (data.documentUrl) {
        setTimeout(() => {
          window.open(data.documentUrl, '_blank');
        }, 500);
      }

      return data;
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast.error(error.message || 'فشل في إنشاء المستند', { id: 'create-doc' });
      return null;
    }
  };

  return {
    openDocument,
    createDocument
  };
};
