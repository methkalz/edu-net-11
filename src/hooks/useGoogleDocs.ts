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

  // إنشاء مستند جديد للطالب من القالب
  const createDocument = async (): Promise<{ docUrl: string; fileId: string } | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-document', {
        body: { useTemplate: true }
      });
      
      if (error) {
        console.error('Error creating document:', error);
        setTimeout(() => {
          toast.error('فشل إنشاء المستند', {
            description: error.message || 'حدث خطأ أثناء إنشاء المستند'
          });
        }, 0);
        return null;
      }

      if (!data?.success) {
        setTimeout(() => {
          toast.error('فشل إنشاء المستند', {
            description: data?.error || 'حدث خطأ غير متوقع'
          });
        }, 0);
        return null;
      }

      setTimeout(() => {
        toast.success('تم إنشاء المستند بنجاح!');
      }, 0);
      return { docUrl: data.docUrl, fileId: data.fileId };
    } catch (error) {
      console.error('Exception creating document:', error);
      setTimeout(() => {
        toast.error('فشل إنشاء المستند', {
          description: 'حدث خطأ غير متوقع'
        });
      }, 0);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // إنشاء مستند جديد فارغ للطالب
  const createBlankDocument = async (): Promise<{ docUrl: string; fileId: string } | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-document', {
        body: { useTemplate: false }
      });
      
      if (error) {
        console.error('Error creating blank document:', error);
        setTimeout(() => {
          toast.error('فشل إنشاء المستند الفارغ', {
            description: error.message || 'حدث خطأ أثناء إنشاء المستند'
          });
        }, 0);
        return null;
      }

      if (!data?.success) {
        setTimeout(() => {
          toast.error('فشل إنشاء المستند الفارغ', {
            description: data?.error || 'حدث خطأ غير متوقع'
          });
        }, 0);
        return null;
      }

      setTimeout(() => {
        toast.success('تم إنشاء المستند الفارغ بنجاح!');
      }, 0);
      return { docUrl: data.docUrl, fileId: data.fileId };
    } catch (error) {
      console.error('Exception creating blank document:', error);
      setTimeout(() => {
        toast.error('فشل إنشاء المستند الفارغ', {
          description: 'حدث خطأ غير متوقع'
        });
      }, 0);
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
        setTimeout(() => {
          toast.error('فشل جلب المستندات', {
            description: error.message || 'حدث خطأ أثناء جلب المستندات'
          });
        }, 0);
        return [];
      }

      if (!data?.success) {
        setTimeout(() => {
          toast.error('فشل جلب المستندات', {
            description: data?.error || 'حدث خطأ غير متوقع'
          });
        }, 0);
        return [];
      }

      return data.documents || [];
    } catch (error) {
      console.error('Exception fetching documents:', error);
      setTimeout(() => {
        toast.error('فشل جلب المستندات', {
          description: 'حدث خطأ غير متوقع'
        });
      }, 0);
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
        setTimeout(() => {
          toast.error('يجب تسجيل الدخول أولاً');
        }, 0);
        return [];
      }

      const { data, error } = await supabase
        .from('google_documents')
        .select('id, doc_url, title, created_at, updated_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my documents:', error);
        setTimeout(() => {
          toast.error('فشل جلب مستنداتك', {
            description: error.message
          });
        }, 0);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching my documents:', error);
      setTimeout(() => {
        toast.error('فشل جلب مستنداتك', {
          description: 'حدث خطأ غير متوقع'
        });
      }, 0);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createDocument,
    createBlankDocument,
    getTeacherDocuments,
    getMyDocuments,
  };
};
