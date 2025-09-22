import React, { useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useProfessionalDocuments } from '@/hooks/useProfessionalDocuments';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveSystemProps {
  documentId?: string;
  editor: Editor;
  content: any;
  onSave?: (content: any) => void;
  interval?: number; // بالميلي ثانية
  enabled?: boolean;
}

export const AutoSaveSystem: React.FC<AutoSaveSystemProps> = ({
  documentId,
  editor,
  content,
  onSave,
  interval = 5000, // حفظ كل 5 ثواني افتراضياً
  enabled = true
}) => {
  const { saveDocument } = useProfessionalDocuments();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef<any>(null);

  // دالة الحفظ
  const performAutoSave = useCallback(async () => {
    if (!enabled || !documentId || !content) return;

    // التحقق من وجود تغييرات
    const currentContent = JSON.stringify(content);
    const lastSavedContent = JSON.stringify(lastSavedContentRef.current);
    
    if (currentContent === lastSavedContent) {
      return; // لا توجد تغييرات
    }

    try {
      if (onSave) {
        await onSave(content);
      } else if (documentId) {
        const htmlContent = editor.getHTML();
        const plainText = editor.getText();
        await saveDocument(documentId, content, htmlContent, plainText);
      }
      
      lastSavedContentRef.current = content;
      
      // إشعار صامت للحفظ التلقائي
      console.log('Auto-saved document at:', new Date().toLocaleTimeString('ar'));
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // إشعار بالخطأ فقط
      toast({
        title: "خطأ في الحفظ التلقائي",
        description: "فشل في حفظ التغييرات تلقائياً",
        variant: "destructive",
      });
    }
  }, [enabled, documentId, content, onSave, editor, saveDocument, toast]);

  // إعداد الحفظ التلقائي
  useEffect(() => {
    if (!enabled) return;

    // مسح المؤقت السابق
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // إعداد مؤقت جديد
    timeoutRef.current = setTimeout(performAutoSave, interval);

    // تنظيف
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, interval, enabled, performAutoSave]);

  // حفظ عند إغلاق النافذة
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled && documentId && content) {
        performAutoSave();
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && enabled) {
        performAutoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, documentId, content, performAutoSave]);

  // تنظيف عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // هذا المكون لا يعرض أي UI
  return null;
};

export default AutoSaveSystem;