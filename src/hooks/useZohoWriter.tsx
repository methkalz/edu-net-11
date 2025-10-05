import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ZOHO_CLIENT_ID = 'YOUR_ZOHO_CLIENT_ID'; // سيتم استبداله من البيئة
const ZOHO_REDIRECT_URI = `${window.location.origin}/zoho-callback`;

interface ZohoDocument {
  document_id: string;
  document_name: string;
  created_time: string;
  modified_time: string;
  document_url?: string;
}

export const useZohoWriter = () => {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [documents, setDocuments] = useState<ZohoDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check connection status
  const checkConnection = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('zoho_writer_integrations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setIsConnected(!error && !!data);
    } catch (error) {
      setIsConnected(false);
    }
  }, [user]);

  // Initiate OAuth connection
  const connectToZoho = useCallback(() => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsConnecting(true);

    // Zoho OAuth URL
    const authUrl = new URL('https://accounts.zoho.com/oauth/v2/auth');
    authUrl.searchParams.append('scope', 'ZohoWriter.documentEditor.ALL,ZohoWriter.documents.ALL');
    authUrl.searchParams.append('client_id', ZOHO_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', ZOHO_REDIRECT_URI);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', user.id);

    // Open in new window
    window.location.href = authUrl.toString();
  }, [user]);

  // Disconnect from Zoho
  const disconnectFromZoho = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('zoho_writer_integrations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      toast.success('تم قطع الاتصال بـ Zoho Writer بنجاح');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('فشل قطع الاتصال');
    }
  }, [user]);

  // List documents
  const listDocuments = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke('zoho-writer', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        if (response.error.message?.includes('NOT_CONNECTED')) {
          setIsConnected(false);
          toast.error('يجب الاتصال بـ Zoho Writer أولاً');
          return;
        }
        throw response.error;
      }

      setDocuments(response.data?.documents || []);
    } catch (error) {
      console.error('Error listing documents:', error);
      toast.error('فشل جلب المستندات');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create document
  const createDocument = useCallback(async (name: string, content?: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke('zoho-writer', {
        body: { 
          action: 'create',
          documentName: name,
          ...(content && { content })
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) throw response.error;

      toast.success('تم إنشاء المستند بنجاح');
      await listDocuments(); // Refresh list
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('فشل إنشاء المستند');
    } finally {
      setIsLoading(false);
    }
  }, [user, listDocuments]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke('zoho-writer', {
        body: { 
          action: 'delete',
          documentId
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) throw response.error;

      toast.success('تم حذف المستند بنجاح');
      await listDocuments(); // Refresh list
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('فشل حذف المستند');
    } finally {
      setIsLoading(false);
    }
  }, [user, listDocuments]);

  // Get document
  const getDocument = useCallback(async (documentId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke('zoho-writer', {
        body: { 
          action: 'get',
          documentId
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) throw response.error;

      return response.data;
    } catch (error) {
      console.error('Error getting document:', error);
      toast.error('فشل جلب المستند');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update document
  const updateDocument = useCallback(async (documentId: string, name?: string, content?: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke('zoho-writer', {
        body: { 
          action: 'update',
          documentId,
          ...(name && { documentName: name }),
          ...(content && { content })
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) throw response.error;

      toast.success('تم تحديث المستند بنجاح');
      await listDocuments(); // Refresh list
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('فشل تحديث المستند');
    } finally {
      setIsLoading(false);
    }
  }, [user, listDocuments]);

  return {
    isConnecting,
    isConnected,
    documents,
    isLoading,
    connectToZoho,
    disconnectFromZoho,
    checkConnection,
    listDocuments,
    createDocument,
    deleteDocument,
    getDocument,
    updateDocument,
  };
};