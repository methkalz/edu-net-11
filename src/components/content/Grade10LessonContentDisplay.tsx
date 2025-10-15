import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Image as ImageIcon, 
  Code, 
  Play,
  Maximize2,
  FileText
} from 'lucide-react';
import { Grade10LessonWithMedia, Grade10LessonMedia } from '@/hooks/useStudentGrade10Lessons';
import MediaFullscreenView from './MediaFullscreenView';
import Lottie from 'lottie-react';

interface Grade10LessonContentDisplayProps {
  lesson: Grade10LessonWithMedia;
  hideTitle?: boolean;
}

const Grade10LessonContentDisplay: React.FC<Grade10LessonContentDisplayProps> = ({ 
  lesson,
  hideTitle = false
}) => {
  const [previewMedia, setPreviewMedia] = useState<Grade10LessonMedia | null>(null);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'lottie': return <Play className="w-4 h-4" />;
      case 'code': return <Code className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getMediaTypeBadge = (type: string) => {
    const badges = {
      video: { label: 'فيديو', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
      image: { label: 'صورة', className: 'bg-green-500/10 text-green-700 border-green-200' },
      lottie: { label: 'رسوم متحركة', className: 'bg-purple-500/10 text-purple-700 border-purple-200' },
      code: { label: 'كود', className: 'bg-orange-500/10 text-orange-700 border-orange-200' },
      '3d_model': { label: 'نموذج 3D', className: 'bg-pink-500/10 text-pink-700 border-pink-200' }
    };
    
    const badge = badges[type as keyof typeof badges] || { label: type, className: 'bg-gray-500/10 text-gray-700 border-gray-200' };
    
    return (
      <Badge variant="outline" className={`${badge.className} gap-1.5`}>
        {getMediaIcon(type)}
        {badge.label}
      </Badge>
    );
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractGoogleDriveId = (url: string): string | null => {
    const patterns = [
      /\/file\/d\/([^\/]+)/,
      /id=([^&]+)/,
      /^([a-zA-Z0-9_-]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const renderEmbeddedMedia = (media: Grade10LessonMedia) => {
    const { media_type, file_path, file_name, metadata } = media;

    switch (media_type) {
      case 'video':
        const youtubeId = extractYouTubeId(file_path);
        if (youtubeId) {
          return (
            <div className="relative w-full rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={file_name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }

        const driveId = extractGoogleDriveId(file_path);
        if (driveId) {
          return (
            <div className="relative w-full rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://drive.google.com/file/d/${driveId}/preview`}
                title={file_name}
                allow="autoplay"
                allowFullScreen
              />
            </div>
          );
        }

        return (
              <video 
                controls 
                controlsList="nodownload"
                className="w-full rounded-xl shadow-lg"
                src={file_path}
                preload="metadata"
              >
                <source src={file_path} type="video/mp4" />
                <source src={file_path} type="video/webm" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
        );

      case 'image':
        return (
          <div className="relative group">
            <img 
              src={file_path} 
              alt={file_name}
              className="w-full rounded-xl shadow-lg object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setPreviewMedia(media)}
            >
              <Maximize2 className="w-4 h-4 ml-2" />
              عرض بملء الشاشة
            </Button>
          </div>
        );

      case 'lottie':
        try {
          const animationData = metadata?.lottie_data ? 
            (typeof metadata.lottie_data === 'string' ? JSON.parse(metadata.lottie_data) : metadata.lottie_data) :
            null;

          if (!animationData && file_path) {
            return (
              <div className="relative group">
                <Lottie
                  animationData={require(`@/assets/${file_path}`)}
                  loop={metadata?.loop !== false}
                  className="w-full max-h-[400px] rounded-xl"
                />
              </div>
            );
          }

          if (animationData) {
            return (
              <div className="relative group">
                <Lottie
                  animationData={animationData}
                  loop={metadata?.loop !== false}
                  className="w-full max-h-[400px] rounded-xl"
                />
              </div>
            );
          }
        } catch (error) {
          console.error('Error rendering Lottie:', error);
        }
        return (
          <div className="text-center p-8 bg-muted/30 rounded-xl">
            <Play className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">خطأ في تحميل الرسوم المتحركة</p>
          </div>
        );

      case 'code':
        const codeContent = metadata?.code || file_path;
        const language = metadata?.language || 'javascript';
        
        return (
          <div className="relative">
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="secondary" className="text-xs">
                {language}
              </Badge>
            </div>
            <pre className="bg-slate-950 text-slate-50 p-6 rounded-xl overflow-x-auto shadow-lg">
              <code className="text-sm font-mono">
                {codeContent}
              </code>
            </pre>
          </div>
        );

      default:
        return (
          <div className="text-center p-8 bg-muted/30 rounded-xl">
            <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">نوع الملف غير مدعوم</p>
          </div>
        );
    }
  };

  const renderCompactMedia = (media: Grade10LessonMedia) => {
    return (
      <Card 
        key={media.id} 
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
        onClick={() => setPreviewMedia(media)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 
              ${media.media_type === 'video' ? 'bg-blue-500/10' : 
                media.media_type === 'image' ? 'bg-green-500/10' : 
                media.media_type === 'lottie' ? 'bg-purple-500/10' : 
                'bg-orange-500/10'}`}
            >
              <div className={`
                ${media.media_type === 'video' ? 'text-blue-600' : 
                  media.media_type === 'image' ? 'text-green-600' : 
                  media.media_type === 'lottie' ? 'text-purple-600' : 
                  'text-orange-600'}`}
              >
                {getMediaIcon(media.media_type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{media.file_name}</p>
              {getMediaTypeBadge(media.media_type)}
            </div>
            <Maximize2 className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Separate media by type
  const embeddedMedia = lesson.media.filter(m => ['video', 'image', 'lottie', 'code'].includes(m.media_type));
  const otherMedia = lesson.media.filter(m => !['video', 'image', 'lottie', 'code'].includes(m.media_type));

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{lesson.title}</h2>
          {lesson.content && (
            <div 
              className="lesson-content text-xl text-foreground/90 leading-9 break-words max-w-full p-8 bg-gradient-to-r from-muted/30 to-muted/20 rounded-3xl border-2 border-border/30 shadow-sm prose prose-lg max-w-none [&_p]:min-h-[1.5em] [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          )}
        </div>
      )}

      {/* Embedded Media (Videos, Images, Lottie, Code) */}
      {embeddedMedia.length > 0 && (
        <div className="space-y-6">
          {embeddedMedia.map((media) => (
            <Card key={media.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{media.file_name}</CardTitle>
                  {getMediaTypeBadge(media.media_type)}
                </div>
              </CardHeader>
              <CardContent>
                {renderEmbeddedMedia(media)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Other Media (Compact View) */}
      {otherMedia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملفات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherMedia.map(renderCompactMedia)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Media Preview */}
      {previewMedia && (
        <MediaFullscreenView
          media={previewMedia as any}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
};

export default Grade10LessonContentDisplay;
