import React, { useState, useRef, useEffect } from 'react';
import { Play, Image, Video, FileText, Maximize2, Minimize2, ExternalLink, Code, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Lottie from 'lottie-react';
import { Grade11LessonWithMedia, Grade11LessonMedia } from '@/hooks/useGrade11Content';
import { useSharedLottieSettings } from '@/hooks/useSharedLottieSettings';
import { useAuth } from '@/hooks/useAuth';
import { useEditLottieMedia } from '@/hooks/useEditLottieMedia';
import { LottieEditForm } from './LottieEditForm';
import MediaPreview from './MediaPreview';
import CodeBlock from './CodeBlock';
import TypewriterCodeBlock from './TypewriterCodeBlock';
import { logger } from '@/lib/logger';

interface Grade11LessonContentDisplayProps {
  lesson: Grade11LessonWithMedia;
  defaultExpanded?: boolean;
  showControls?: boolean;
  hideHeader?: boolean; // New prop to hide lesson title and content
}

const Grade11LessonContentDisplay: React.FC<Grade11LessonContentDisplayProps> = ({
  lesson,
  defaultExpanded = false,
  showControls = true,
  hideHeader = false
}) => {
  const { userProfile } = useAuth();
  const { updateLottieMedia } = useEditLottieMedia();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [previewMedia, setPreviewMedia] = useState<any>(null);
  const [editingLottie, setEditingLottie] = useState<any>(null);
  const { lottieSettings } = useSharedLottieSettings();

  const handleUpdateLottieMedia = async (updates: Partial<Grade11LessonMedia>) => {
    if (!editingLottie) return;
    
    try {
      await updateLottieMedia({
        mediaId: editingLottie.id,
        updates
      });
      
      setEditingLottie(null);
    } catch (error) {
      logger.error('Error updating Lottie media', error as Error);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'lottie':
        return <Play className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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
        if (metadata.source_type === 'youtube' && metadata.youtube_id) {
          return (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <iframe
                src={`https://www.youtube.com/embed/${metadata.youtube_id}`}
                title={media.file_name}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
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
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={media.file_path}
              alt={media.file_name}
              className="w-full h-auto object-cover max-h-96"
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
              key={`typewriter-${media.id}-${Date.now()}`}
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
        className="flex items-center gap-2 p-2 bg-muted/50 rounded border cursor-pointer hover:bg-muted transition-colors"
        onClick={() => setPreviewMedia(media)}
      >
        {getMediaIcon(media.media_type)}
        <span className="text-xs font-medium truncate flex-1">{media.file_name}</span>
        <Badge variant="outline" className={`text-xs ${getMediaTypeBadge(media.media_type)}`}>
          {media.media_type}
        </Badge>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  // Sort media by order_index
  const sortedMedia = lesson.media?.sort((a, b) => a.order_index - b.order_index) || [];

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
    <div className="space-y-4 w-full max-w-none">
      {/* Lesson Content */}
      {!hideHeader && (
        <div className="prose prose-sm max-w-none w-full">
          <h6 className="font-medium text-sm mb-2">{lesson.title}</h6>
          {lesson.content && (
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words max-w-full">
              {lesson.content}
            </div>
          )}
        </div>
      )}

      {/* Media Controls */}
      {showControls && sortedMedia.length > 0 && (
        <div className="flex items-center gap-3 py-2 border-t border-b">
          <div className="flex items-center gap-2">
            <Switch
              id={`expand-${lesson.id}`}
              checked={isExpanded}
              onCheckedChange={setIsExpanded}
            />
            <Label htmlFor={`expand-${lesson.id}`} className="text-xs cursor-pointer">
              عرض الوسائط مدمجة
            </Label>
          </div>
          <Badge variant="secondary" className="text-xs">
            {sortedMedia.length} ملف وسائط
          </Badge>
        </div>
      )}

      {/* Media Display */}
      {sortedMedia.length > 0 && (
        <div className="space-y-3">
          {isExpanded ? (
            // Expanded view - embedded media
            <div className="space-y-4">
              {sortedMedia.map((media) => (
                <Card key={media.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-start gap-2 mb-3">
                      {getMediaIcon(media.media_type)}
                      <span className="text-sm font-medium">{media.file_name}</span>
                      <Badge variant="outline" className={`text-xs ${getMediaTypeBadge(media.media_type)}`}>
                        {media.media_type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewMedia(media)}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {renderEmbeddedMedia(media)}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Compact view - media list
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">الوسائط المرفقة:</div>
              {sortedMedia.map((media) => (
                <div key={media.id}>
                  {renderCompactMedia(media)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <MediaPreview
          media={previewMedia}
          onClose={() => setPreviewMedia(null)}
        />
      )}
      {/* معاينة الوسائط */}
      {previewMedia && (
        <MediaPreview 
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