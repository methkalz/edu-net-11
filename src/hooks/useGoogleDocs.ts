import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateDocumentParams {
  studentName: string;
  documentContent?: string;
  folderId?: string;
}

interface CreateDocumentResponse {
  success: boolean;
  documentId?: string;
  documentUrl?: string;
  title?: string;
  error?: string;
}

interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

interface ListFilesResponse {
  success: boolean;
  files?: DriveFile[];
  error?: string;
}

interface TestConnectionResponse {
  success: boolean;
  message?: string;
  details?: {
    serviceAccount: string;
    projectId: string;
    driveUser: string;
  };
  error?: string;
}

export const useGoogleDocs = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createDocument = async ({
    studentName,
    documentContent = '',
    folderId
  }: CreateDocumentParams): Promise<CreateDocumentResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-google-doc', {
        body: {
          studentName,
          documentContent,
          folderId
        }
      });

      if (error) {
        console.error('Error creating document:', error);
        toast.error('فشل إنشاء المستند', {
          description: error.message || 'حدث خطأ أثناء إنشاء المستند'
        });
        return null;
      }

      if (!data.success) {
        toast.error('فشل إنشاء المستند', {
          description: data.error || 'حدث خطأ غير متوقع'
        });
        return null;
      }

      toast.success('تم إنشاء المستند بنجاح', {
        description: `تم إنشاء مستند ${studentName}`
      });

      return data as CreateDocumentResponse;
    } catch (error: any) {
      console.error('Error in createDocument:', error);
      toast.error('فشل إنشاء المستند', {
        description: error.message || 'حدث خطأ غير متوقع'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const listFiles = async (folderId?: string): Promise<DriveFile[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-drive-files', {
        body: { folderId }
      });

      if (error) {
        console.error('Error listing files:', error);
        toast.error('فشل جلب الملفات', {
          description: error.message || 'حدث خطأ أثناء جلب الملفات'
        });
        return [];
      }

      if (!data.success) {
        toast.error('فشل جلب الملفات', {
          description: data.error || 'حدث خطأ غير متوقع'
        });
        return [];
      }

      return (data as ListFilesResponse).files || [];
    } catch (error: any) {
      console.error('Error in listFiles:', error);
      toast.error('فشل جلب الملفات', {
        description: error.message || 'حدث خطأ غير متوقع'
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-google-connection');

      if (error) {
        console.error('Error testing connection:', error);
        toast.error('فشل اختبار الاتصال', {
          description: error.message || 'حدث خطأ أثناء اختبار الاتصال'
        });
        return false;
      }

      if (!data.success) {
        toast.error('فشل اختبار الاتصال', {
          description: data.error || 'حدث خطأ غير متوقع'
        });
        return false;
      }

      const response = data as TestConnectionResponse;
      toast.success(response.message || 'تم الاتصال بنجاح', {
        description: response.details 
          ? `Service Account: ${response.details.serviceAccount}`
          : undefined
      });

      return true;
    } catch (error: any) {
      console.error('Error in testConnection:', error);
      toast.error('فشل اختبار الاتصال', {
        description: error.message || 'حدث خطأ غير متوقع'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDocument,
    listFiles,
    testConnection,
    isLoading
  };
};
