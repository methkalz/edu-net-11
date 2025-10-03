import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleDocument {
  document_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  doc_url: string;
  doc_title: string;
  created_at: string;
  last_accessed_at: string | null;
}

interface MyDocument {
  id: string;
  doc_url: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useGoogleDocs = () => {
  const [isLoading, setIsLoading] = useState(false);

  // إنشاء مستند جديد للطالب
  const createDocument = async (): Promise<{ docUrl: string; fileId: string } | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-document');
      
      if (error) {
        console.error('Error creating document:', error);
        toast.error('فشل إنشاء المستند', {
          description: error.message || 'حدث خطأ أثناء إنشاء المستند'
        });
        return null;
      }

      if (!data?.success) {
        toast.error('فشل إنشاء المستند', {
          description: data?.error || 'حدث خطأ غير متوقع'
        });
        return null;
      }

      toast.success('تم إنشاء المستند بنجاح!');
      return { docUrl: data.docUrl, fileId: data.fileId };
    } catch (error) {
      console.error('Exception creating document:', error);
      toast.error('فشل إنشاء المستند', {
        description: 'حدث خطأ غير متوقع'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // جلب مستندات الطلاب للمعلم
  const getTeacherDocuments = async (): Promise<GoogleDocument[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-student-documents');
      
      if (error) {
        console.error('Error fetching documents:', error);
        toast.error('فشل جلب المستندات', {
          description: error.message || 'حدث خطأ أثناء جلب المستندات'
        });
        return [];
      }

      if (!data?.success) {
        toast.error('فشل جلب المستندات', {
          description: data?.error || 'حدث خطأ غير متوقع'
        });
        return [];
      }

      return data.documents || [];
    } catch (error) {
      console.error('Exception fetching documents:', error);
      toast.error('فشل جلب المستندات', {
        description: 'حدث خطأ غير متوقع'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // جلب مستندات الطالب الخاصة به
  const getMyDocuments = async (): Promise<MyDocument[]> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return [];
      }

      const { data, error } = await supabase
        .from('google_documents')
        .select('id, doc_url, title, created_at, updated_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my documents:', error);
        toast.error('فشل جلب مستنداتك', {
          description: error.message
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching my documents:', error);
      toast.error('فشل جلب مستنداتك', {
        description: 'حدث خطأ غير متوقع'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createDocument,
    getTeacherDocuments,
    getMyDocuments,
  };
};
