import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Video, Gamepad2, Star } from 'lucide-react';
import { useGrade11PointsManager } from '@/hooks/useGrade11PointsManager';

export const PointsBreakdownCard = () => {
  const {
    pointsConfig,
    studentPoints,
    calculateTotalPoints,
    calculatePointsPerLesson,
    calculatePointsPerVideo,
    loading,
  } = useGrade11PointsManager();

  if (loading || !pointsConfig) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  const totalPoints = calculateTotalPoints();
  const progressPercentage = (totalPoints / pointsConfig.total_max_points) * 100;

  const lessonsMaxPoints = (pointsConfig.lessons_percentage * pointsConfig.total_max_points) / 100;
  const videosMaxPoints = (pointsConfig.videos_percentage * pointsConfig.total_max_points) / 100;
  const gamesMaxPoints = (pointsConfig.games_percentage * pointsConfig.total_max_points) / 100;

  const lessonsProgress = studentPoints
    ? (studentPoints.lessons_points / lessonsMaxPoints) * 100
    : 0;
  const videosProgress = studentPoints
    ? (studentPoints.videos_points / videosMaxPoints) * 100
    : 0;
  const gamesProgress = studentPoints ? (studentPoints.games_points / gamesMaxPoints) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-primary" />
          تفصيل النقاط
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* إجمالي النقاط */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">إجمالي النقاط</span>
            <span className="text-2xl font-bold text-primary">
              {totalPoints.toLocaleString()} / {pointsConfig.total_max_points.toLocaleString()}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {progressPercentage.toFixed(1)}% من الهدف
          </p>
        </div>

        {/* النقطة الابتدائية */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">النقطة الابتدائية</p>
              <p className="text-xs text-muted-foreground">مكافأة التسجيل</p>
            </div>
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">{pointsConfig.initial_points}</p>
            <p className="text-xs text-muted-foreground">نقطة</p>
          </div>
        </div>

        {/* الدروس */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">الدروس النظرية</p>
                <p className="text-xs text-muted-foreground">
                  {studentPoints?.lessons_completed || 0} درس مكتمل
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">
                {studentPoints?.lessons_points || 0} / {Math.floor(lessonsMaxPoints)}
              </p>
              <p className="text-xs text-muted-foreground">
                {calculatePointsPerLesson()} نقطة/درس
              </p>
            </div>
          </div>
          <Progress value={lessonsProgress} className="h-2" />
        </div>

        {/* الفيديوهات */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">الفيديوهات التعليمية</p>
                <p className="text-xs text-muted-foreground">
                  {studentPoints?.videos_completed || 0} فيديو مكتمل
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">
                {studentPoints?.videos_points || 0} / {Math.floor(videosMaxPoints)}
              </p>
              <p className="text-xs text-muted-foreground">
                {calculatePointsPerVideo()} نقطة/فيديو
              </p>
            </div>
          </div>
          <Progress value={videosProgress} className="h-2" />
        </div>

        {/* الألعاب */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">الألعاب التعليمية</p>
                <p className="text-xs text-muted-foreground">التقدم في الألعاب</p>
              </div>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">
                {studentPoints?.games_points || 0} / {Math.floor(gamesMaxPoints)}
              </p>
              <p className="text-xs text-muted-foreground">نقاط الألعاب</p>
            </div>
          </div>
          <Progress value={gamesProgress} className="h-2" />
        </div>

        {/* ملاحظة */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground text-center">
          استمر في التعلم والتفاعل لكسب المزيد من النقاط! 🎯
        </div>
      </CardContent>
    </Card>
  );
};
