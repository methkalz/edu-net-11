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

interface FolderInfo {
  id: string;
  name: string;
  capabilities?: {
    canAddChildren: boolean;
    canEdit: boolean;
  };
  permissions?: any[];
}

interface ListFilesResponse {
  files: DriveFile[];
  folderInfo?: FolderInfo;
  serviceAccount?: string;
}

interface TestConnectionResponse {
  success: boolean;
  message?: string;
  serviceAccount?: string;
  workspaceSupport?: boolean;
  scopes?: string[];
  error?: string;
}

export interface CreateFolderParams {
  folderName: string;
  parentFolderId?: string;
}

export interface CreateFolderResponse {
  success: boolean;
  folderId?: string;
  folderName?: string;
  webViewLink?: string;
  message?: string;
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
      // جلب معلومات الطالب الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase.functions.invoke('create-google-doc', {
        body: {
          studentName,
          documentContent,
          student_id: student?.id,
          grade_level: '12',
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

      toast.success('تم إنشاء المستند بنجاح ✅', {
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

  const listFiles = async (folderId?: string, includeAllFiles: boolean = true): Promise<DriveFile[] | ListFilesResponse> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-drive-files', {
        body: { 
          ...(folderId && { folderId }),
          includeAllFiles 
        }
      });

      if (error) {
        console.error('Error listing files:', error);
        throw new Error(error.message || 'فشل في جلب الملفات من Google Drive');
      }

      if (!data) {
        return [];
      }

      // Return the full response object if it has folderInfo
      if (typeof data === 'object' && 'files' in data) {
        return data as ListFilesResponse;
      }

      // Otherwise return as array for backwards compatibility
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in listFiles:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (): Promise<TestConnectionResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-google-connection');

      if (error) {
        console.error('Connection test error:', error);
        throw new Error(error.message || 'فشل اختبار الاتصال');
      }

      if (!data) {
        throw new Error('لم يتم استلام رد من الخادم');
      }

      const response = data as TestConnectionResponse;
      
      if (!response.success) {
        throw new Error(response.error || 'فشل اختبار الاتصال');
      }

      console.log('Connection test successful:', response);
      return response;
    } catch (error) {
      console.error('Error in testConnection:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = async (params: CreateFolderParams): Promise<CreateFolderResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-drive-folder', {
        body: params
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('تم إنشاء المجلد بنجاح', {
          description: `المجلد: ${data.folderName}`
        });
        return data;
      } else {
        throw new Error(data?.error || 'فشل إنشاء المجلد');
      }
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error('فشل إنشاء المجلد', {
        description: error.message || 'حدث خطأ غير متوقع'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDocument,
    listFiles,
    testConnection,
    createFolder,
    isLoading
  };
};
