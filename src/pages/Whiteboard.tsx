import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tldraw, Editor, TLRecord } from 'tldraw';
import 'tldraw/tldraw.css';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppHeader from '@/components/shared/AppHeader';
import { Save, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WhiteboardPage = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const editorRef = useRef<Editor | null>(null);
  const [title, setTitle] = useState('لوح جديد');
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // التحقق من الصلاحيات
    if (userProfile?.role !== 'teacher' && 
        userProfile?.role !== 'school_admin' && 
        userProfile?.role !== 'superadmin') {
      toast({
        title: "غير مصرح",
        description: "هذه الميزة متاحة للمعلمين فقط",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [user, userProfile, navigate, toast]);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !editorRef.current || saving) return;

    setSaving(true);
    try {
      const editor = editorRef.current;
      const records = editor.store.allRecords() as TLRecord[];
      
      // تحويل البيانات إلى JSON عادي
      const canvasData = JSON.parse(JSON.stringify({
        records: records,
        schema: editor.store.schema.serialize()
      }));

      const whiteboardData = {
        user_id: user.id,
        school_id: userProfile?.school_id || null,
        title,
        canvas_data: canvasData,
        updated_at: new Date().toISOString()
      };

      if (whiteboardId) {
        // تحديث موجود
        const { error } = await supabase
          .from('whiteboards')
          .update(whiteboardData)
          .eq('id', whiteboardId);

        if (error) throw error;
        
        toast({
          title: "تم الحفظ",
          description: "تم حفظ اللوح الرقمي بنجاح"
        });
      } else {
        // إنشاء جديد
        const { data, error } = await supabase
          .from('whiteboards')
          .insert([whiteboardData])
          .select()
          .single();

        if (error) throw error;
        
        setWhiteboardId(data.id);
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء اللوح الرقمي بنجاح"
        });
      }
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ اللوح الرقمي",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [user, userProfile, title, whiteboardId, toast]);

  const handleExport = useCallback(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const records = editor.store.allRecords();
    const dataStr = JSON.stringify(records, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.tldraw`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم التصدير",
      description: "تم تصدير اللوح الرقمي بنجاح"
    });
  }, [title, toast]);

  // حفظ تلقائي كل 30 ثانية
  useEffect(() => {
    if (!whiteboardId) return;

    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [whiteboardId, handleSave]);

  return (
    <div className="h-screen flex flex-col" dir="rtl">
      <AppHeader 
        title="اللوح الرقمي" 
        showBackButton={true} 
        showLogout={false}
      />
      
      <div className="bg-background border-b px-4 py-3 flex items-center gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان اللوح"
          className="max-w-xs"
        />
        
        <div className="flex gap-2 mr-auto">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ
          </Button>
          
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
};

export default WhiteboardPage;