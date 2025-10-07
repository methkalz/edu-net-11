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
      // Only send folderId if it's provided, otherwise Edge Function will use GOOGLE_FOLDER
      const { data, error } = await supabase.functions.invoke('create-google-doc', {
        body: {
          studentName,
          documentContent,
          ...(folderId && { folderId })
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
      // Only send folderId if it's provided, otherwise Edge Function will use GOOGLE_FOLDER
      const { data, error } = await supabase.functions.invoke('list-drive-files', {
        body: folderId ? { folderId } : {}
      });

      if (error) {
        console.error('Error listing files:', error);
        const errorMsg = error.message || 'فشل في جلب الملفات';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.success) {
        const errorMsg = data.error || 'حدث خطأ أثناء جلب الملفات';
        toast.error(errorMsg);
        throw { message: errorMsg, hint: (data as any)?.hint };
      }

      return (data as ListFilesResponse).files || [];
    } catch (error: any) {
      console.error('Error in listFiles:', error);
      if (!error.message) {
        toast.error('حدث خطأ غير متوقع');
        throw new Error('حدث خطأ غير متوقع');
      }
      throw error;
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
        const errorMsg = error.message || 'فشل في اختبار الاتصال';
        toast.error(errorMsg);
        return false;
      }

      if (!data.success) {
        const errorMsg = data.error || 'فشل الاتصال مع Google API';
        toast.error(errorMsg);
        if ((data as any)?.hint) {
          toast.error((data as any).hint, { duration: 6000 });
        }
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
