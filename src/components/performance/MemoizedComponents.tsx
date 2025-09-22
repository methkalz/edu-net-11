import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// مكونات محسّنة مع React.memo للأداء الأفضل

interface MemoizedStatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  color?: string;
  loading?: boolean;
}

export const MemoizedStatsCard = memo<MemoizedStatsCardProps>(({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = 'stable', 
  color = 'primary',
  loading = false
}) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-8 w-8 bg-muted rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted rounded mb-2" />
          <div className="h-4 w-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const getIconColor = () => {
    const colorMap: Record<string, string> = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      orange: 'text-orange-500',
      purple: 'text-purple-500',
      green: 'text-green-500',
      blue: 'text-blue-500'
    };
    return colorMap[color] || 'text-primary';
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Icon className={`h-8 w-8 ${getIconColor()}`} />
          {change !== undefined && (
            <Badge variant={changeType === 'increase' ? 'default' : 'secondary'}>
              {change > 0 ? '+' : ''}{change}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">
          {value.toLocaleString('ar-SA')}
        </div>
        <p className="text-muted-foreground text-sm">{title}</p>
      </CardContent>
    </Card>
  );
});

MemoizedStatsCard.displayName = 'MemoizedStatsCard';

interface MemoizedProgressCardProps {
  title: string;
  current: number;
  total: number;
  percentage: number;
  description?: string;
}

export const MemoizedProgressCard = memo<MemoizedProgressCardProps>(({ 
  title, 
  current, 
  total, 
  percentage,
  description
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>{current} من {total}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="w-full" />
      </div>
    </CardContent>
  </Card>
));

MemoizedProgressCard.displayName = 'MemoizedProgressCard';

interface MemoizedActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const MemoizedActionButton = memo<MemoizedActionButtonProps>(({ 
  onClick, 
  children, 
  variant = 'default',
  disabled = false,
  loading = false,
  className = ''
}) => (
  <Button 
    onClick={onClick}
    variant={variant}
    disabled={disabled || loading}
    className={className}
  >
    {loading ? (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        جاري التحميل...
      </div>
    ) : (
      children
    )}
  </Button>
));

MemoizedActionButton.displayName = 'MemoizedActionButton';

interface MemoizedLessonCardProps {
  lesson: {
    id: string;
    title: string;
    section_title: string;
    difficulty_level?: string;
    points?: number;
  };
  progress?: {
    score: number;
    max_score: number;
    completed_at: string;
  } | null;
  isUnlocked: boolean;
  onSelect: (lessonId: string) => void;
}

export const MemoizedLessonCard = memo<MemoizedLessonCardProps>(({ 
  lesson, 
  progress, 
  isUnlocked, 
  onSelect 
}) => {
  const isCompleted = !!progress?.completed_at;
  const percentage = progress 
    ? Math.round((progress.score / progress.max_score) * 100) 
    : 0;

  return (
    <Card 
      className={`transition-all cursor-pointer hover:shadow-lg ${
        isUnlocked ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
      }`}
      onClick={() => isUnlocked && onSelect(lesson.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg line-clamp-2">{lesson.title}</CardTitle>
          {isCompleted && (
            <Badge variant="default" className="bg-green-500">
              مكتمل
            </Badge>
          )}
          {!isUnlocked && (
            <Badge variant="outline">
              مقفل
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{lesson.section_title}</p>
      </CardHeader>
      
      {isCompleted && progress && (
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>النتيجة: {progress.score}/{progress.max_score}</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="w-full" />
          </div>
        </CardContent>
      )}
    </Card>
  );
});

MemoizedLessonCard.displayName = 'MemoizedLessonCard';