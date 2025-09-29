import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Tldraw, Editor, createTLStore, loadSnapshot, getSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppHeader from '@/components/shared/AppHeader';
import { Save, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { throttle } from 'lodash';

const WhiteboardPage = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editorRef = useRef<Editor | null>(null);
  const [title, setTitle] = useState('لوح جديد');
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // إنشاء store مخصص
  const store = useMemo(() => createTLStore(), []);

  // التحقق من الصلاحيات
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

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

  // تحميل اللوح من URL parameter أو إنشاء جديد
  useEffect(() => {
    const loadWhiteboard = async () => {
      const id = searchParams.get('id');
      
      if (id) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('whiteboards')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data) {
            setWhiteboardId(data.id);
            setTitle(data.title);

            // تحميل البيانات في store
            if (data.canvas_data) {
              loadSnapshot(store, data.canvas_data as any);
            }
          }
        } catch (error) {
          console.error('Error loading whiteboard:', error);
          toast({
            title: "خطأ في التحميل",
            description: "حدث خطأ أثناء تحميل اللوح الرقمي",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    if (user) {
      loadWhiteboard();
    }
  }, [searchParams, user, toast, store]);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    
    // إذا كان هناك بيانات محملة، نطبقها
    const id = searchParams.get('id');
    if (id && whiteboardId) {
      // البيانات تم تحميلها بالفعل في useEffect
    }
  }, [searchParams, whiteboardId]);

  const handleSave = useCallback(async () => {
    if (!user || saving) return;

    setSaving(true);
    try {
      // استخدام getSnapshot بدلاً من allRecords للحصول على البيانات بشكل صحيح
      const snapshot = getSnapshot(store);
      
      // تحويل snapshot إلى JSON لحفظه في Supabase
      const canvasData = JSON.parse(JSON.stringify(snapshot));

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
        
        setLastSaved(new Date());
      } else {
        // إنشاء جديد
        const { data, error } = await supabase
          .from('whiteboards')
          .insert([whiteboardData])
          .select()
          .single();

        if (error) throw error;
        
        setWhiteboardId(data.id);
        setLastSaved(new Date());
        
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
  }, [user, userProfile, title, whiteboardId, toast, store]);

  const handleExport = useCallback(() => {
    const snapshot = getSnapshot(store);
    const dataStr = JSON.stringify(snapshot, null, 2);
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
  }, [title, toast, store]);

  // حفظ تلقائي عند التغيير (مع throttle)
  const throttledSave = useMemo(
    () => throttle(() => {
      if (whiteboardId && autoSaveEnabled) {
        handleSave();
      }
    }, 5000),
    [whiteboardId, autoSaveEnabled, handleSave]
  );

  // الاستماع لتغييرات store
  useEffect(() => {
    if (!whiteboardId || !autoSaveEnabled) return;

    const unsubscribe = store.listen(() => {
      throttledSave();
    }, { scope: 'document' });

    return () => {
      unsubscribe();
      throttledSave.cancel();
    };
  }, [store, whiteboardId, autoSaveEnabled, throttledSave]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col" dir="rtl">
        <AppHeader 
          title="اللوح الرقمي" 
          showBackButton={true} 
          showLogout={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">جاري تحميل اللوح الرقمي...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* UI العلوي مع RTL */}
      <div dir="rtl">
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
          
          <div className="flex items-center gap-2 mr-auto">
            {lastSaved && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            
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
      </div>

      {/* Canvas مع LTR لإصلاح مشكلة المحاذاة */}
      <div dir="ltr" className="flex-1 overflow-hidden relative">
        <Tldraw 
          store={store}
          onMount={handleMount}
        />
      </div>
    </div>
  );
};

export default WhiteboardPage;