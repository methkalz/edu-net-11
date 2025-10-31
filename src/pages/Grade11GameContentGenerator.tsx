import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Play, FileText, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ModernHeader from '@/components/shared/ModernHeader';
import { useProfile } from '@/hooks/useProfile';

interface BatchInfo {
  batchNumber: number;
  sectionIds: string[];
  sectionNames: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cardsGenerated?: number;
  questionsGenerated?: number;
}

/**
 * صفحة توليد محتوى لعبة الصف الحادي عشر
 * تسمح للمدراء بتوليد بطاقات وأسئلة اللعبة باستخدام الذكاء الاصطناعي
 */
const Grade11GameContentGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // التحقق من صلاحيات الوصول
  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.role !== 'superadmin' && profile.role !== 'school_admin') {
        toast.error('غير مصرح لك بالوصول لهذه الصفحة');
        navigate('/dashboard');
      }
    }
  }, [profile, profileLoading, navigate]);

  // جلب الأقسام عند التحميل
  useEffect(() => {
    if (profile?.role === 'superadmin' || profile?.role === 'school_admin') {
      fetchSections();
    }
  }, [profile]);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('grade11_sections')
      .select('id, title, order_index')
      .order('order_index');

    if (error) {
      console.error('Error fetching sections:', error);
      toast.error('خطأ في جلب الأقسام');
      return;
    }

    setSections(data || []);
    
    // إنشاء الدفعات (3 دفعات: 5 أقسام، 7 أقسام، 5 أقسام)
    if (data && data.length > 0) {
      const batch1 = data.slice(0, 5);
      const batch2 = data.slice(5, 12);
      const batch3 = data.slice(12, 17);

      setBatches([
        {
          batchNumber: 1,
          sectionIds: batch1.map(s => s.id),
          sectionNames: batch1.map(s => s.title),
          status: 'pending'
        },
        {
          batchNumber: 2,
          sectionIds: batch2.map(s => s.id),
          sectionNames: batch2.map(s => s.title),
          status: 'pending'
        },
        {
          batchNumber: 3,
          sectionIds: batch3.map(s => s.id),
          sectionNames: batch3.map(s => s.title),
          status: 'pending'
        }
      ]);
    }
  };

  const generateBatch = async (batch: BatchInfo) => {
    try {
      setBatches(prev => prev.map(b => 
        b.batchNumber === batch.batchNumber 
          ? { ...b, status: 'processing' }
          : b
      ));

      const { data, error } = await supabase.functions.invoke('generate-grade11-game-content', {
        body: {
          sectionIds: batch.sectionIds,
          batchNumber: batch.batchNumber
        }
      });

      if (error) throw error;

      setBatches(prev => prev.map(b => 
        b.batchNumber === batch.batchNumber 
          ? { 
              ...b, 
              status: 'completed',
              cardsGenerated: data.data.cards,
              questionsGenerated: data.data.questions
            }
          : b
      ));

      toast.success(`تم إنشاء الدفعة ${batch.batchNumber} بنجاح!`);
    } catch (error) {
      console.error(`Error generating batch ${batch.batchNumber}:`, error);
      setBatches(prev => prev.map(b => 
        b.batchNumber === batch.batchNumber 
          ? { ...b, status: 'failed' }
          : b
      ));
      toast.error(`فشل في إنشاء الدفعة ${batch.batchNumber}`);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);

    for (let i = 0; i < batches.length; i++) {
      await generateBatch(batches[i]);
      setProgress(((i + 1) / batches.length) * 100);
      
      // انتظار قليل بين الدفعات
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
    toast.success('اكتملت عملية التوليد! 🎉');
  };

  const getBatchStatusIcon = (status: BatchInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getBatchStatusBadge = (status: BatchInfo['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    const labels = {
      pending: 'قيد الانتظار',
      processing: 'جاري المعالجة',
      completed: 'مكتمل',
      failed: 'فشل'
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  // عرض شاشة تحميل أثناء التحقق من الصلاحيات
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2 text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // منع الوصول لغير المصرح لهم
  if (!profile || (profile.role !== 'superadmin' && profile.role !== 'school_admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground mb-4">
              هذه الصفحة متاحة فقط للمشرفين
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50" dir="rtl">
      <ModernHeader 
        title="مولّد محتوى لعبة الصف الحادي عشر"
        showBackButton={true}
      />

      <div className="container mx-auto p-6 max-w-6xl">
        {/* بطاقة المعلومات */}
        <Card className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              نظام التوليد التلقائي للمحتوى
            </CardTitle>
            <CardDescription className="text-white/90">
              سيتم إنشاء 34 بطاقة و 340 سؤال للصف الحادي عشر باستخدام الذكاء الاصطناعي
            </CardDescription>
          </CardHeader>
        </Card>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{sections.length}</p>
                <p className="text-sm text-muted-foreground mt-1">عدد الأقسام</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">34</p>
                <p className="text-sm text-muted-foreground mt-1">بطاقة لعبة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-600">340</p>
                <p className="text-sm text-muted-foreground mt-1">سؤال تعليمي</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{batches.length}</p>
                <p className="text-sm text-muted-foreground mt-1">دفعات</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التقدم */}
        {isGenerating && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم الكلي</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* الدفعات */}
        <div className="space-y-4 mb-6">
          {batches.map((batch) => (
            <Card key={batch.batchNumber} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getBatchStatusIcon(batch.status)}
                    <div>
                      <CardTitle className="text-lg">
                        الدفعة {batch.batchNumber}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {batch.sectionIds.length} أقسام • 
                        {batch.sectionIds.length * 2} بطاقات • 
                        {batch.sectionIds.length * 20} سؤال
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getBatchStatusBadge(batch.status)}
                    {batch.status === 'pending' && !isGenerating && (
                      <Button
                        size="sm"
                        onClick={() => generateBatch(batch)}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        تشغيل
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {batch.status === 'completed' && batch.cardsGenerated && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>✅ {batch.cardsGenerated} بطاقة</span>
                    <span>✅ {batch.questionsGenerated} سؤال</span>
                  </div>
                )}
                <details className="mt-2">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    عرض الأقسام ({batch.sectionNames.length})
                  </summary>
                  <div className="mt-2 space-y-1">
                    {batch.sectionNames.map((name, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground pr-4">
                        • {name}
                      </p>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* زر البدء */}
        <Card>
          <CardContent className="pt-6">
            <Button
              size="lg"
              onClick={startGeneration}
              disabled={isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  بدء توليد المحتوى
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-3">
              ⚠️ سيستغرق التوليد حوالي 10-15 دقيقة. يرجى عدم إغلاق الصفحة.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Grade11GameContentGenerator;
