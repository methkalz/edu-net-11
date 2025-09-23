import React, { memo } from 'react';
import { Play, Clock, FileText, Video, Image, Code, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grade11LessonWithMedia } from '@/hooks/useGrade11Content';

interface MinimalistLessonCardProps {
  lesson: Grade11LessonWithMedia;
  lessonIndex: number;
  onLessonClick: (lesson: Grade11LessonWithMedia) => void;
  isCompleted?: boolean;
  progress?: number;
}

const MinimalistLessonCard = memo<MinimalistLessonCardProps>(({ 
  lesson, 
  lessonIndex, 
  onLessonClick,
  isCompleted = false,
  progress = 0
}) => {
  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'lottie':
        return <Play className="h-5 w-5 text-purple-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-green-500" />;
      case 'code':
        return <Code className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const mediaCount = lesson.media?.length || 0;
  const hasContent = lesson.content && lesson.content.trim().length > 0;

  return (
    <div 
      onClick={() => onLessonClick(lesson)}
      className="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* شريط التقدم */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* رقم الدرس */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
            isCompleted 
              ? 'bg-green-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}>
            {isCompleted ? '✓' : lessonIndex + 1}
          </div>

          {/* محتوى الدرس */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
              {lesson.title}
            </h3>

            {/* معلومات الدرس */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span className="text-base font-medium">15 دقيقة</span>
              </div>
              
              {hasContent && (
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-base font-medium">نص تعليمي</span>
                </div>
              )}

              {mediaCount > 0 && (
                <Badge variant="outline" className="text-sm font-medium">
                  {mediaCount} وسيطة
                </Badge>
              )}
            </div>

            {/* أنواع الوسائط */}
            {lesson.media && lesson.media.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium text-gray-500">الوسائط:</span>
                <div className="flex items-center gap-2">
                  {lesson.media.slice(0, 4).map((media, index) => (
                    <div 
                      key={media.id} 
                      className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      title={media.file_name}
                    >
                      {getMediaIcon(media.media_type)}
                    </div>
                  ))}
                  {lesson.media.length > 4 && (
                    <div className="p-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                      +{lesson.media.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* حالة الإكمال */}
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">تم إكمال الدرس</span>
              </div>
            )}
          </div>

          {/* زر البدء */}
          <div className="flex-shrink-0">
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onLessonClick(lesson);
              }}
            >
              {isCompleted ? 'مراجعة' : 'ابدأ الدرس'}
              <ChevronRight className="h-6 w-6 mr-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* تأثير الهوفر */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
});

MinimalistLessonCard.displayName = 'MinimalistLessonCard';

export default MinimalistLessonCard;