import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw, TrendingUp, BookOpen, Video, Gamepad2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PointsConfig {
  id: string;
  total_max_points: number;
  initial_points: number;
  lessons_percentage: number;
  videos_percentage: number;
  games_percentage: number;
  is_active: boolean;
}

export const Grade11PointsConfigPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [totalMaxPoints, setTotalMaxPoints] = useState(1000);
  const [initialPoints, setInitialPoints] = useState(100);
  const [lessonsPercentage, setLessonsPercentage] = useState(50);
  const [videosPercentage, setVideosPercentage] = useState(10);
  const [gamesPercentage, setGamesPercentage] = useState(30);

  // جلب الإعدادات الحالية
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['grade11-points-config-admin'],
    queryFn: async (): Promise<PointsConfig | null> => {
      const { data, error } = await supabase
        .from('grade11_points_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTotalMaxPoints(data.total_max_points);
        setInitialPoints(data.initial_points);
        setLessonsPercentage(data.lessons_percentage);
        setVideosPercentage(data.videos_percentage);
        setGamesPercentage(data.games_percentage);
      }

      return data;
    },
  });

  // جلب عدد المحتوى
  const { data: contentCounts } = useQuery({
    queryKey: ['grade11-content-counts-admin'],
    queryFn: async () => {
      const [lessonsResult, videosResult, gamesResult] = await Promise.all([
        supabase
          .from('grade11_lessons')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('grade11_videos')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('pair_matching_games')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
      ]);

      return {
        totalLessons: lessonsResult.count || 0,
        totalVideos: videosResult.count || 0,
        totalGames: gamesResult.count || 0,
      };
    },
  });

  // حساب النقاط الفعلية
  const lessonsPoints = Math.floor((lessonsPercentage * totalMaxPoints) / 100);
  const videosPoints = Math.floor((videosPercentage * totalMaxPoints) / 100);
  const gamesPoints = Math.floor((gamesPercentage * totalMaxPoints) / 100);
  const remainingPercentage = 100 - lessonsPercentage - videosPercentage - gamesPercentage - (initialPoints * 100 / totalMaxPoints);

  const pointsPerLesson =
    contentCounts && contentCounts.totalLessons > 0
      ? Math.floor(lessonsPoints / contentCounts.totalLessons)
      : 0;
  const pointsPerVideo =
    contentCounts && contentCounts.totalVideos > 0
      ? Math.floor(videosPoints / contentCounts.totalVideos)
      : 0;

  // حفظ الإعدادات
  const saveConfig = useMutation({
    mutationFn: async () => {
      // إلغاء تفعيل الإعدادات القديمة
      if (currentConfig) {
        await supabase
          .from('grade11_points_config')
          .update({ is_active: false })
          .eq('id', currentConfig.id);
      }

      // إضافة إعدادات جديدة
      const { data, error } = await supabase
        .from('grade11_points_config')
        .insert({
          total_max_points: totalMaxPoints,
          initial_points: initialPoints,
          lessons_percentage: lessonsPercentage,
          videos_percentage: videosPercentage,
          games_percentage: gamesPercentage,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade11-points-config-admin'] });
      queryClient.invalidateQueries({ queryKey: ['grade11-points-config'] });
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات توزيع النقاط',
      });
    },
    onError: (error) => {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    },
  });

  const handleReset = () => {
    setTotalMaxPoints(currentConfig?.total_max_points || 1000);
    setInitialPoints(currentConfig?.initial_points || 100);
    setLessonsPercentage(currentConfig?.lessons_percentage || 50);
    setVideosPercentage(currentConfig?.videos_percentage || 10);
    setGamesPercentage(currentConfig?.games_percentage || 30);
  };

  if (isLoading) {
    return <div className="text-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            إعدادات توزيع النقاط - الصف الحادي عشر
          </CardTitle>
          <CardDescription>
            تحكم في كيفية توزيع النقاط على المحتوى التعليمي والألعاب
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* النقاط الإجمالية والابتدائية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>الحد الأقصى للنقاط</Label>
              <Input
                type="number"
                value={totalMaxPoints}
                onChange={(e) => setTotalMaxPoints(Number(e.target.value))}
                min={100}
                max={10000}
              />
              <p className="text-sm text-muted-foreground">
                إجمالي النقاط التي يمكن للطالب الحصول عليها
              </p>
            </div>

            <div className="space-y-3">
              <Label>النقطة الابتدائية</Label>
              <Input
                type="number"
                value={initialPoints}
                onChange={(e) => setInitialPoints(Number(e.target.value))}
                min={0}
                max={totalMaxPoints}
              />
              <p className="text-sm text-muted-foreground">
                النقاط التي يحصل عليها الطالب عند التسجيل
              </p>
            </div>
          </div>

          {/* توزيع النقاط */}
          <div className="space-y-6">
            {/* الدروس */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  الدروس النظرية
                </Label>
                <span className="text-sm font-medium">
                  {lessonsPercentage}% ({lessonsPoints} نقطة)
                </span>
              </div>
              <Slider
                value={[lessonsPercentage]}
                onValueChange={([value]) => setLessonsPercentage(value)}
                min={0}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>عدد الدروس: {contentCounts?.totalLessons || 0}</span>
                <span>نقاط كل درس: {pointsPerLesson}</span>
              </div>
            </div>

            {/* الفيديوهات */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  الفيديوهات التعليمية
                </Label>
                <span className="text-sm font-medium">
                  {videosPercentage}% ({videosPoints} نقطة)
                </span>
              </div>
              <Slider
                value={[videosPercentage]}
                onValueChange={([value]) => setVideosPercentage(value)}
                min={0}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>عدد الفيديوهات: {contentCounts?.totalVideos || 0}</span>
                <span>نقاط كل فيديو: {pointsPerVideo}</span>
              </div>
            </div>

            {/* الألعاب */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4" />
                  الألعاب التعليمية
                </Label>
                <span className="text-sm font-medium">
                  {gamesPercentage}% ({gamesPoints} نقطة)
                </span>
              </div>
              <Slider
                value={[gamesPercentage]}
                onValueChange={([value]) => setGamesPercentage(value)}
                min={0}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>عدد الألعاب: {contentCounts?.totalGames || 0}</span>
                <span>نقاط كل لعبة: ~{Math.floor(gamesPoints / (contentCounts?.totalGames || 1))}</span>
              </div>
            </div>
          </div>

          {/* ملخص */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">ملخص التوزيع:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>النقطة الابتدائية:</div>
              <div className="font-medium">{initialPoints} نقطة ({(initialPoints * 100 / totalMaxPoints).toFixed(1)}%)</div>
              
              <div>الدروس:</div>
              <div className="font-medium">{lessonsPoints} نقطة ({lessonsPercentage}%)</div>
              
              <div>الفيديوهات:</div>
              <div className="font-medium">{videosPoints} نقطة ({videosPercentage}%)</div>
              
              <div>الألعاب:</div>
              <div className="font-medium">{gamesPoints} نقطة ({gamesPercentage}%)</div>
              
              <div className="font-semibold">المجموع:</div>
              <div className="font-semibold">
                {initialPoints + lessonsPoints + videosPoints + gamesPoints} / {totalMaxPoints} نقطة
              </div>
            </div>
            
            {Math.abs(remainingPercentage) > 0.5 && (
              <p className="text-xs text-destructive mt-2">
                تنبيه: الفرق في النسب = {remainingPercentage.toFixed(1)}%
              </p>
            )}
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-3">
            <Button
              onClick={() => saveConfig.mutate()}
              disabled={saveConfig.isPending || Math.abs(remainingPercentage) > 0.5}
              className="flex-1"
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ الإعدادات
            </Button>
            <Button onClick={handleReset} variant="outline">
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
