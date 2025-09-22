import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Image, 
  Play, 
  Upload, 
  Trash2, 
  Eye,
  Move,
  FileVideo,
  Youtube,
  Globe,
  HardDrive,
  Code,
  Settings
} from 'lucide-react';
import { Grade11LessonMedia } from '@/hooks/useGrade11Content';
import { useAuth } from '@/hooks/useAuth';
import { useEditLottieMedia } from '@/hooks/useEditLottieMedia';
import LessonVideoForm from './LessonVideoForm';
import LessonImageForm from './LessonImageForm';
import LessonLottieForm from './LessonLottieForm';
import LessonCodeForm from './LessonCodeForm';
import { LottieEditForm } from './LottieEditForm';
import MediaPreview from './MediaPreview';
import { logger } from '@/lib/logger';

interface Grade11LessonMediaManagerProps {
  lessonId?: string;
  media: Grade11LessonMedia[];
  onAddMedia?: (mediaData: Omit<Grade11LessonMedia, 'id' | 'created_at'>) => Promise<any>;
  onDeleteMedia?: (mediaId: string) => Promise<void>;
  onUpdateMedia?: (mediaId: string, updates: Partial<Grade11LessonMedia>) => Promise<void>;
}

const Grade11LessonMediaManager: React.FC<Grade11LessonMediaManagerProps> = ({
  lessonId,
  media,
  onAddMedia,
  onDeleteMedia,
  onUpdateMedia
}) => {
  const { userProfile } = useAuth();
  
  // Create callback to refresh data after Lottie update
  const handleDataRefresh = () => {
    console.log('Triggering data refresh after Lottie update');
    if (onUpdateMedia) {
      // This will trigger fetchSections in the parent component
      onUpdateMedia('', {}).catch(err => console.log('Refresh triggered'));
    }
  };
  
  const { updateLottieMedia } = useEditLottieMedia(handleDataRefresh);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState(false);
  const [showLottieForm, setShowLottieForm] = useState(false);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<Grade11LessonMedia | null>(null);
  const [editingLottie, setEditingLottie] = useState<Grade11LessonMedia | null>(null);

  const canEditLottie = userProfile?.role === 'superadmin';

  const getMediaIcon = (type: string, sourceType?: string) => {
    if (type === 'video') {
      if (sourceType === 'youtube') return <Youtube className="h-4 w-4" />;
      if (sourceType === 'google_drive') return <HardDrive className="h-4 w-4" />;
      if (sourceType === 'url') return <Globe className="h-4 w-4" />;
      return <FileVideo className="h-4 w-4" />;
    }
    if (type === 'image') return <Image className="h-4 w-4" />;
    if (type === 'lottie') return <Play className="h-4 w-4" />;
    if (type === 'code') return <Code className="h-4 w-4" />;
    return <Upload className="h-4 w-4" />;
  };

  const getMediaTypeBadge = (type: string) => {
    const typeMap = {
      video: { label: 'فيديو', color: 'bg-blue-100 text-blue-800' },
      image: { label: 'صورة', color: 'bg-green-100 text-green-800' },
      lottie: { label: 'لوتي', color: 'bg-purple-100 text-purple-800' },
      code: { label: 'كود', color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = typeMap[type as keyof typeof typeMap] || { label: type, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const handleUpdateLottieMedia = async (updates: Partial<Grade11LessonMedia>) => {
    if (!editingLottie) return;
    
    try {
      console.log('Starting Lottie media update process...');
      
      // Update in database first
      await updateLottieMedia({
        mediaId: editingLottie.id,
        updates
      });
      
      console.log('Lottie media updated in database, closing edit form');
      setEditingLottie(null);
      
    } catch (error) {
      logger.error('Error updating Lottie media', error as Error);
      console.error('Update failed:', error);
    }
  };

  const handleAddMedia = async (mediaData: any, type: 'video' | 'image' | 'lottie' | 'code') => {
    if (!lessonId || !onAddMedia) return;

    try {
      // تحسين معالجة file_path حسب نوع الوسائط
      let filePath = '';
      if (type === 'code') {
        filePath = mediaData.file_path;
      } else {
        filePath = mediaData.file_path || mediaData.video_url || mediaData.image_url;
      }

      // التحقق من وجود file_path صالح
      if (!filePath || filePath.trim() === '') {
        logger.error('File path is required');
        return;
      }

      const newMedia: Omit<Grade11LessonMedia, 'id' | 'created_at'> = {
        lesson_id: lessonId,
        media_type: type,
        file_path: filePath,
        file_name: mediaData.title || mediaData.file_name || 'بدون اسم',
        metadata: {
          ...mediaData,
          source_type: mediaData.source_type || 'upload'
        },
        order_index: media.length
      };

      await onAddMedia(newMedia);
      
      // إغلاق النماذج فقط عند نجاح العملية
      setShowVideoForm(false);
      setShowImageForm(false);
      setShowLottieForm(false);
      setShowCodeForm(false);
      
    } catch (error) {
      logger.error('Error adding media', error as Error);
    }
  };

  return (
    <div className="space-y-6">
      {/* أزرار إضافة الوسائط */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            إضافة وسائط جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowVideoForm(true)}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Video className="h-6 w-6" />
              <span className="text-sm">فيديو</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowImageForm(true)}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Image className="h-6 w-6" />
              <span className="text-sm">صورة</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowLottieForm(true)}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Play className="h-6 w-6" />
              <span className="text-sm">لوتي</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowCodeForm(true)}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Code className="h-6 w-6" />
              <span className="text-sm">كود</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الوسائط الموجودة */}
      {media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              الوسائط المضافة ({media.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {media.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* أيقونة الوسائط */}
                  <div className="flex-shrink-0">
                    {getMediaIcon(item.media_type, item.metadata?.source_type)}
                  </div>

                  {/* معلومات الوسائط */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {item.file_name}
                      </h4>
                      {getMediaTypeBadge(item.media_type)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>ترتيب: {item.order_index + 1}</span>
                      {item.metadata?.duration && (
                        <span>المدة: {item.metadata.duration}</span>
                      )}
                      {item.metadata?.source_type && (
                        <span>المصدر: {item.metadata.source_type}</span>
                      )}
                    </div>
                  </div>

                   {/* أزرار التحكم */}
                   <div className="flex gap-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setPreviewMedia(item)}
                     >
                       <Eye className="h-4 w-4" />
                     </Button>
                     
                     {/* زر تعديل إعدادات اللوتي - ظاهر فقط للسوبر آدمن */}
                     {item.media_type === 'lottie' && canEditLottie && (
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setEditingLottie(item)}
                         className="text-muted-foreground hover:text-foreground"
                       >
                         <Settings className="h-4 w-4" />
                       </Button>
                     )}
                     
                     <Button
                       variant="ghost"
                       size="sm"
                       className="text-muted-foreground hover:text-foreground"
                     >
                       <Move className="h-4 w-4" />
                     </Button>
                     
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => onDeleteMedia && onDeleteMedia(item.id)}
                       className="text-destructive hover:text-destructive"
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* النماذج المنبثقة */}
      {showVideoForm && (
        <LessonVideoForm
          onSave={(data) => handleAddMedia(data, 'video')}
          onCancel={() => setShowVideoForm(false)}
        />
      )}

      {showImageForm && (
        <LessonImageForm
          onSave={(data) => handleAddMedia(data, 'image')}
          onCancel={() => setShowImageForm(false)}
        />
      )}

      {showLottieForm && (
        <LessonLottieForm
          onSave={(data) => handleAddMedia(data, 'lottie')}
          onCancel={() => setShowLottieForm(false)}
        />
      )}

      {showCodeForm && (
        <LessonCodeForm
          isOpen={showCodeForm}
          onClose={() => setShowCodeForm(false)}
          onSubmit={(data) => handleAddMedia(data, 'code')}
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

export default Grade11LessonMediaManager;