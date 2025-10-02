import React, { useState, useRef, useEffect } from 'react';
import { Play, Image, Video, FileText, Maximize2, Minimize2, ExternalLink, Code, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Lottie from 'lottie-react';
import { Grade11LessonWithMedia, Grade11LessonMedia } from '@/hooks/useGrade11Content';
import { useSharedLottieSettings } from '@/hooks/useSharedLottieSettings';
import { useAuth } from '@/hooks/useAuth';
import { useEditLottieMedia } from '@/hooks/useEditLottieMedia';
import { LottieEditForm } from './LottieEditForm';
import MediaFullscreenView from './MediaFullscreenView';
import CodeBlock from './CodeBlock';
import TypewriterCodeBlock from './TypewriterCodeBlock';
import { logger } from '@/lib/logger';

interface Grade11LessonContentDisplayProps {
  lesson: Grade11LessonWithMedia;
  hideTitle?: boolean; // New prop to hide lesson title only
  onUpdateMedia?: (mediaId: string, updates: Partial<Grade11LessonMedia>) => Promise<void>;
}

const Grade11LessonContentDisplay: React.FC<Grade11LessonContentDisplayProps> = ({
  lesson,
  hideTitle = false,
  onUpdateMedia
}) => {
  const { userProfile } = useAuth();
  const { updateLottieMedia } = useEditLottieMedia();
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  const [editingLottie, setEditingLottie] = useState<any>(null);
  const { lottieSettings } = useSharedLottieSettings();

  // تحديث previewMedia عند تحديث lesson.media
  useEffect(() => {
    if (previewMedia && lesson.media) {
      const updatedMedia = lesson.media.find(m => m.id === previewMedia.id);
      if (updatedMedia && JSON.stringify(updatedMedia.metadata) !== JSON.stringify(previewMedia.metadata)) {
        console.log('Updating preview media with new data:', updatedMedia);
        setPreviewMedia(updatedMedia);
      }
    }
  }, [lesson.media, previewMedia]);

  const handleUpdateLottieMedia = async (updates: Partial<Grade11LessonMedia>) => {
    if (!editingLottie) return;
    
    try {
      // Use the hook's updateLottieMedia which handles DB update
      await updateLottieMedia({
        mediaId: editingLottie.id,
        updates
      });
      
      // Then call the parent's onUpdateMedia to refresh the UI
      if (onUpdateMedia) {
        await onUpdateMedia(editingLottie.id, updates);
      }
      
      setEditingLottie(null);
    } catch (error) {
      logger.error('Error updating Lottie media', error as Error);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="h-6 w-6 text-primary" />;
      case 'lottie':
        return <Play className="h-6 w-6 text-primary" />;
      case 'image':
        return <Image className="h-6 w-6 text-primary" />;
      case 'code':
        return <Code className="h-6 w-6 text-primary" />;
      default:
        return <FileText className="h-6 w-6 text-primary" />;
    }
  };

  const getMediaTypeBadge = (type: string) => {
    const colors = {
      video: 'bg-red-100 text-red-700 border-red-200',
      image: 'bg-green-100 text-green-700 border-green-200',
      lottie: 'bg-purple-100 text-purple-700 border-purple-200',
      code: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const renderEmbeddedMedia = (media: any) => {
    const metadata = media.metadata || {};

    switch (media.media_type) {
      case 'video':
        if (metadata.source_type === 'youtube') {
          // Extract YouTube ID from various possible formats
          let youtubeId = metadata.youtube_id;
          
          if (!youtubeId && metadata.video_url) {
            // Extract from video_url (e.g., "https://www.youtube.com/embed/vX_1Yit53Lc")
            const urlMatch = metadata.video_url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (urlMatch) youtubeId = urlMatch[1];
          }
          
          if (!youtubeId && metadata.file_path) {
            // Extract from file_path
            const pathMatch = metadata.file_path.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (pathMatch) youtubeId = pathMatch[1];
          }
          
          if (youtubeId) {
            const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
            
            return (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900" style={{ minHeight: '400px' }}>
                <iframe
                  src={embedUrl}
                  title={media.file_name}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
        } else if (metadata.source_type === 'google_drive' && metadata.drive_id) {
          return (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <iframe
                src={`https://drive.google.com/file/d/${metadata.drive_id}/preview`}
                title={media.file_name}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay"
              />
            </div>
          );
        } else if (metadata.source_type === 'upload' || metadata.source_type === 'url') {
          return (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <video
                src={media.file_path}
                title={media.file_name}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
            </div>
          );
        }
        break;

      case 'image':
        return (
          <div className="relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px] max-h-[500px]">
            <img
              src={media.file_path}
              alt={media.file_name}
              className="w-full h-auto object-contain max-h-[500px]"
              loading="lazy"
            />
          </div>
        );

      case 'lottie':
        console.log('=== LOTTIE DEBUG ===');
        console.log('Media metadata:', metadata);
        console.log('Lottie settings:', lottieSettings);
        
        try {
          let animationData = null;
          
          // Try different ways to get animation data
          if (metadata.animation_data) {
            console.log('Using metadata.animation_data');
            animationData = typeof metadata.animation_data === 'string' 
              ? JSON.parse(metadata.animation_data) 
              : metadata.animation_data;
          } else if (metadata.lottie_data) {
            console.log('Using metadata.lottie_data');
            animationData = typeof metadata.lottie_data === 'string' 
              ? JSON.parse(metadata.lottie_data) 
              : metadata.lottie_data;
          } else if (media.file_path && media.file_path.includes('.json')) {
            console.log('Lottie file path detected, but no animation data in metadata');
            return (
              <div className="relative rounded-lg bg-amber-50 p-4 text-center">
                <Play className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm text-amber-700">يتطلب تحميل ملف اللوتي من الرابط</p>
              </div>
            );
          }

          console.log('Final animation data:', animationData);
          
          if (!animationData || Object.keys(animationData).length === 0) {
            throw new Error('No valid animation data found');
          }

          // Use metadata speed as single source of truth, fallback to 1
          const speedSetting = typeof metadata.speed === 'number' ? metadata.speed : 1;
          const loopSetting = typeof metadata.loop === 'boolean' ? metadata.loop : (lottieSettings?.loop !== undefined ? lottieSettings.loop : true);
          
          console.log('Speed sources - metadata.speed:', metadata.speed, 'final speedSetting:', speedSetting);
          console.log('Loop setting:', loopSetting);

          return <LottieDisplay 
            animationData={animationData}
            loop={loopSetting}
            speed={speedSetting}
          />;
        } catch (error) {
          console.error('Lottie parsing error:', error);
          logger.error('Error loading Lottie animation', error as Error);
          return (
            <div className="relative rounded-lg bg-red-50 border border-red-200 p-4 text-center">
              <Play className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm text-red-600">خطأ في تحميل الرسوم المتحركة</p>
              <p className="text-xs text-red-500 mt-1">تحقق من صحة ملف اللوتي</p>
            </div>
          );
        }

      case 'code':
        // Handle both nested and non-nested metadata structures
        let codeMetadata = metadata || {};
        
        // Check if metadata is double-nested (metadata.metadata.code)
        if (codeMetadata.metadata && !codeMetadata.code) {
          logger.debug('Found nested metadata structure, extracting...');
          codeMetadata = codeMetadata.metadata;
        }
        
        const codeTitle = codeMetadata.title || media.file_name;
        logger.debug('Code block metadata', { metadata: codeMetadata });
        logger.debug('Code content analysis', { 
          hasCode: !!codeMetadata.code, 
          codeLength: codeMetadata.code?.length || 0,
          codePreview: codeMetadata.code?.slice(0, 50) + '...' || 'No code found'
        });
        
        // Check if we have actual code content
        if (!codeMetadata.code || codeMetadata.code.trim() === '') {
          logger.warn('No code content found in metadata', { metadata: codeMetadata });
          return (
            <div className="space-y-3">
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Code className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm text-yellow-700">لا يوجد محتوى كود للعرض</p>
              </div>
            </div>
          );
        }
        
        // Always use typewriter for preview if available, fallback to regular code block
        const shouldUseTypewriter = codeMetadata.enableTypewriter !== false;
        
        // Create a unique key based on metadata to force re-render on changes
        const metadataKey = JSON.stringify({
          theme: codeMetadata.theme,
          language: codeMetadata.language,
          showLineNumbers: codeMetadata.showLineNumbers,
          typewriterSpeed: codeMetadata.typewriterSpeed,
          code: codeMetadata.code?.substring(0, 50) // Use first 50 chars as part of key
        });
        
        if (shouldUseTypewriter) {
          logger.debug('Rendering TypewriterCodeBlock', {
            autoStart: true,
            autoRestart: codeMetadata.autoRestart !== false,
            loop: codeMetadata.loop !== false,
            speed: codeMetadata.typewriterSpeed || 50,
            codeLength: codeMetadata.code.length
          });
          
          return (
            <TypewriterCodeBlock
              key={`typewriter-${media.id}-${metadataKey}`}
              code={codeMetadata.code}
              language={codeMetadata.language || 'plaintext'}
              fileName={codeTitle}
              showLineNumbers={codeMetadata.showLineNumbers}
              theme={codeMetadata.theme || 'dark'}
              speed={codeMetadata.typewriterSpeed || 50}
              autoStart={true}
              autoRestart={true}
              loop={true}
              pauseDuration={4000}
            />
          );
        } else {
          return (
            <CodeBlock
              key={`code-${media.id}-${metadataKey}`}
              code={codeMetadata.code}
              language={codeMetadata.language || 'plaintext'}
              fileName={codeTitle}
              showLineNumbers={codeMetadata.showLineNumbers}
              theme={codeMetadata.theme || 'dark'}
            />
          );
        }

      default:
        return null;
    }
  };

  const renderCompactMedia = (media: any) => {
    return (
      <div 
        className="flex items-center gap-4 p-6 bg-gradient-to-r from-muted/30 to-muted/20 rounded-2xl border-2 border-border/30 cursor-pointer hover:from-muted/50 hover:to-muted/30 transition-all duration-300 shadow-sm hover:shadow-md"
        onClick={() => setPreviewMedia(media)}
      >
        <div className="p-3 bg-primary/10 rounded-2xl">
          {getMediaIcon(media.media_type)}
        </div>
        <span className="text-lg font-bold truncate flex-1 text-foreground">{media.file_name}</span>
        <Badge variant="outline" className={`text-base px-4 py-2 font-semibold ${getMediaTypeBadge(media.media_type)}`}>
          {media.media_type}
        </Badge>
        <Button variant="ghost" size="default" className="h-10 w-10 p-0 rounded-xl">
          <ExternalLink className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  // Sort media by order_index and separate videos from other media
  const sortedMedia = lesson.media?.sort((a, b) => a.order_index - b.order_index) || [];
  const videoMedia = sortedMedia.filter(m => m.media_type === 'video');
  const otherMedia = sortedMedia.filter(m => m.media_type !== 'video');

  // Lottie Display Component with speed control
  const LottieDisplay = ({ animationData, loop, speed }: { animationData: any, loop: boolean, speed: number }) => {
    const lottieRef = useRef<any>(null);
    
    useEffect(() => {
      if (lottieRef.current && speed !== undefined) {
        console.log('Applying speed to Lottie:', speed);
        lottieRef.current.setSpeed(speed);
      }
    }, [speed]);

    return (
      <div className="relative rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl min-h-[200px] max-h-[600px] flex items-center justify-center">
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={loop}
            autoplay={true}
            style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid meet'
            }}
            onLoadedData={() => {
              console.log('Lottie loaded successfully');
              if (lottieRef.current && speed !== 1) {
                console.log('Setting speed on load:', speed);
                lottieRef.current.setSpeed(speed);
              }
            }}
            onError={(error) => console.error('Lottie error:', error)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full max-w-none">
      {/* Lesson Content */}
      <div className="prose max-w-none w-full">
        {!hideTitle && (
          <h4 className="font-bold text-2xl mb-6 text-foreground leading-relaxed">{lesson.title}</h4>
        )}
        {lesson.content && (
          <div 
            className="text-xl text-foreground/90 leading-9 break-words max-w-full p-8 bg-gradient-to-r from-muted/30 to-muted/20 rounded-3xl border-2 border-border/30 shadow-sm prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        )}
      </div>

      {/* Videos - Always displayed directly under content */}
      {videoMedia.length > 0 && (
        <div className="space-y-8">
          <div className="text-lg font-bold text-primary mb-4">
            🎥 مقاطع الفيديو ({videoMedia.length})
          </div>
          {videoMedia.map((media) => (
            <Card key={media.id} className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-start gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    {getMediaIcon(media.media_type)}
                  </div>
                  <span className="text-xl font-bold flex-1 text-foreground">{media.file_name}</span>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setPreviewMedia(media)}
                    className="h-10 w-10 p-0 rounded-xl"
                    title="عرض بملء الشاشة"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                </div>
                <div className="rounded-2xl overflow-hidden border border-border/30 bg-gray-900">
                  {renderEmbeddedMedia(media)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Other Media Display (images, lottie, code) - Always displayed */}
      {otherMedia.length > 0 && (
        <div className="space-y-8">
          {otherMedia.map((media) => (
            <Card key={media.id} className="overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-start gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    {getMediaIcon(media.media_type)}
                  </div>
                  <span className="text-xl font-bold flex-1 text-foreground">{media.file_name}</span>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setPreviewMedia(media)}
                    className="h-10 w-10 p-0 rounded-xl"
                    title="عرض بملء الشاشة"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                </div>
                <div className="rounded-2xl overflow-hidden border border-border/30">
                  {renderEmbeddedMedia(media)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Media Fullscreen View */}
      {previewMedia && (
        <MediaFullscreenView
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
        />
      )}

      {/* نموذج تعديل اللوتي */}
      {editingLottie && (
        <LottieEditForm
          media={editingLottie}
          isOpen={true}
          onClose={() => setEditingLottie(null)}
          onUpdate={handleUpdateLottieMedia}
        />
      )}
    </div>
  );
};

export default Grade11LessonContentDisplay;