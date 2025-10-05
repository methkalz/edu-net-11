import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ProfessionalDocument {
  id: string;
  title: string;
  content: any;
  html_content?: string;
  plain_text?: string;
  word_count: number;
  page_count: number;
  owner_id: string;
  school_id?: string;
  status: 'draft' | 'published' | 'archived' | 'submitted';
  visibility: 'private' | 'school' | 'public';
  allow_comments: boolean;
  allow_suggestions: boolean;
  version_number: number;
  created_at: string;
  updated_at: string;
  last_saved_at: string;
  settings: {
    page_format: string;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    font_family: string;
    font_size: number;
  };
  metadata: any;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  author_id: string;
  content: string;
  comment_type: 'comment' | 'suggestion' | 'approval' | 'request_change';
  position_start?: number;
  position_end?: number;
  selected_text?: string;
  status: 'active' | 'resolved' | 'deleted';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  parent_comment_id?: string;
}

export interface DocumentActivity {
  id: string;
  document_id: string;
  user_id: string;
  activity_type: 'view' | 'edit' | 'comment' | 'save' | 'export' | 'share';
  action_details: any;
  created_at: string;
  user_agent?: string;
  ip_address?: string;
}

export const useProfessionalDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ProfessionalDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<ProfessionalDocument | null>(null);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [activities, setActivities] = useState<DocumentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب قائمة المستندات
  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('professional_documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setDocuments(data as ProfessionalDocument[] || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في جلب المستندات",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // جلب مستند واحد
  const fetchDocument = useCallback(async (documentId: string) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('professional_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;
      
      setCurrentDocument(data as ProfessionalDocument);
      
      // تسجيل نشاط المشاهدة
      await logActivity(documentId, 'view', {});
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في جلب المستند",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // إنشاء مستند جديد
  const createDocument = useCallback(async (title: string, initialContent?: any) => {
    if (!user) return null;
    
    setSaving(true);
    setError(null);
    
    try {
      const documentData = {
        title: title || 'مستند جديد',
        content: initialContent || { type: 'doc', content: [] },
        html_content: '',
        plain_text: '',
        owner_id: user.id,
        school_id: user.user_metadata?.school_id || null,
        status: 'draft' as const,
        visibility: 'private' as const,
        allow_comments: true,
        allow_suggestions: true,
        version_number: 1,
        settings: {
          page_format: 'A4',
          margins: {
            top: 72,
            bottom: 72,
            left: 72,
            right: 72
          },
          font_family: 'Cairo',
          font_size: 12
        },
        metadata: {}
      };

      const { data, error: createError } = await supabase
        .from('professional_documents')
        .insert([documentData])
        .select()
        .single();

      if (createError) throw createError;
      
      setCurrentDocument(data as ProfessionalDocument);
      await fetchDocuments(); // تحديث القائمة
      
      toast({
        title: "تم إنشاء المستند",
        description: `تم إنشاء مستند "${title}" بنجاح`,
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في إنشاء المستند",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, toast, fetchDocuments]);

  // حفظ مستند
  const saveDocument = useCallback(async (
    documentId: string, 
    content: any, 
    htmlContent?: string, 
    plainText?: string
  ) => {
    if (!user) return false;
    
    setSaving(true);
    setError(null);
    
    try {
      const updateData: any = {
        content,
        last_saved_at: new Date().toISOString(),
      };
      
      if (htmlContent) updateData.html_content = htmlContent;
      if (plainText) updateData.plain_text = plainText;

      const { data, error: saveError } = await supabase
        .from('professional_documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single();

      if (saveError) throw saveError;
      
      setCurrentDocument(data as ProfessionalDocument);
      
      // تسجيل نشاط الحفظ
      await logActivity(documentId, 'save', { auto_save: true });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في حفظ المستند",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, toast]);

  // حذف مستند
  const deleteDocument = useCallback(async (documentId: string) => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('professional_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;
      
      await fetchDocuments(); // تحديث القائمة
      
      if (currentDocument?.id === documentId) {
        setCurrentDocument(null);
      }
      
      toast({
        title: "تم حذف المستند",
        description: "تم حذف المستند بنجاح",
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في حذف المستند",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchDocuments, currentDocument]);

  // جلب التعليقات
  const fetchComments = useCallback(async (documentId: string) => {
    if (!user) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', documentId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      
      setComments(data as DocumentComment[] || []);
    } catch (err: any) {
      console.error('خطأ في جلب التعليقات:', err.message);
    }
  }, [user]);

  // إضافة تعليق
  const addComment = useCallback(async (
    documentId: string,
    content: string,
    commentType: DocumentComment['comment_type'] = 'comment',
    positionStart?: number,
    positionEnd?: number,
    selectedText?: string,
    parentCommentId?: string
  ) => {
    if (!user) return null;
    
    try {
      const commentData = {
        document_id: documentId,
        author_id: user.id,
        content,
        comment_type: commentType,
        position_start: positionStart,
        position_end: positionEnd,
        selected_text: selectedText,
        parent_comment_id: parentCommentId,
        status: 'active' as const
      };

      const { data, error: createError } = await supabase
        .from('document_comments')
        .insert([commentData])
        .select()
        .single();

      if (createError) throw createError;
      
      await fetchComments(documentId); // تحديث التعليقات
      
      // تسجيل نشاط التعليق
      await logActivity(documentId, 'comment', { comment_id: data.id });
      
      toast({
        title: "تم إضافة التعليق",
        description: "تم إضافة تعليقك بنجاح",
      });
      
      return data;
    } catch (err: any) {
      toast({
        title: "خطأ في إضافة التعليق",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast, fetchComments]);

  // تسجيل نشاط
  const logActivity = useCallback(async (
    documentId: string,
    activityType: DocumentActivity['activity_type'],
    actionDetails: any = {}
  ) => {
    if (!user) return;
    
    try {
      const activityData = {
        document_id: documentId,
        user_id: user.id,
        activity_type: activityType,
        action_details: actionDetails,
        user_agent: navigator.userAgent,
      };

      await supabase
        .from('document_activities')
        .insert([activityData]);
    } catch (err: any) {
      console.error('خطأ في تسجيل النشاط:', err.message);
    }
  }, [user]);

  // جلب النشاطات
  const fetchActivities = useCallback(async (documentId: string) => {
    if (!user) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('document_activities')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      setActivities(data as DocumentActivity[] || []);
    } catch (err: any) {
      console.error('خطأ في جلب النشاطات:', err.message);
    }
  }, [user]);

  // تأثير لجلب المستندات عند تحميل المكون
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  return {
    // البيانات
    documents,
    currentDocument,
    comments,
    activities,
    loading,
    saving,
    error,
    
    // الوظائف
    fetchDocuments,
    fetchDocument,
    createDocument,
    saveDocument,
    deleteDocument,
    fetchComments,
    addComment,
    fetchActivities,
    logActivity,
    
    // مساعدات
    setCurrentDocument,
    setError,
  };
};

export default useProfessionalDocuments;