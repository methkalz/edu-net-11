import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Video, 
  Image, 
  Play, 
  Code, 
  Clock, 
  TrendingUp, 
  Eye,
  Check,
  X,
  Info
} from 'lucide-react';
import { useSharedMediaLibrary, SharedMediaFile } from '@/hooks/useSharedMediaLibrary';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Lottie from 'lottie-react';

interface SharedMediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (mediaFile: SharedMediaFile) => void;
  mediaType?: 'video' | 'image' | 'lottie' | 'code' | 'all';
  multiple?: boolean;
  selectedFiles?: string[];
}

const SharedMediaPicker: React.FC<SharedMediaPickerProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  mediaType = 'all',
  multiple = false,
  selectedFiles = []
}) => {
  const {
    mediaFiles,
    loading,
    searchMedia,
    getMediaByType,
    getMostUsedMedia,
    getRecentMedia,
    getMediaUsageInfo
  } = useSharedMediaLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedItems, setSelectedItems] = useState<string[]>(selectedFiles);
  const [previewFile, setPreviewFile] = useState<SharedMediaFile | null>(null);
  const [usageInfo, setUsageInfo] = useState<any[]>([]);

  useEffect(() => {
    if (previewFile) {
      getMediaUsageInfo(previewFile.file_path).then(setUsageInfo);
    }
  }, [previewFile, getMediaUsageInfo]);

  const handleSearch = () => {
    searchMedia(searchTerm, mediaType === 'all' ? undefined : mediaType);
  };

  const handleSelectItem = (file: SharedMediaFile) => {
    if (multiple) {
      const newSelection = selectedItems.includes(file.id)
        ? selectedItems.filter(id => id !== file.id)
        : [...selectedItems, file.id];
      setSelectedItems(newSelection);
    } else {
      onSelectMedia(file);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    const selectedFiles = mediaFiles.filter(file => selectedItems.includes(file.id));
    selectedFiles.forEach(file => onSelectMedia(file));
    onClose();
  };

  const getFilteredFiles = () => {
    const filtered = mediaType === 'all' ? mediaFiles : getMediaByType(mediaType);
    
    switch (activeTab) {
      case 'popular':
        return getMostUsedMedia().filter(file => 
          mediaType === 'all' || file.media_type === mediaType
        );
      case 'recent':
        return getRecentMedia().filter(file => 
          mediaType === 'all' || file.media_type === mediaType
        );
      default:
        return filtered;
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'lottie':
        return <Play className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderMediaPreview = (file: SharedMediaFile) => {
    switch (file.media_type) {
      case 'image':
        return (
          <img
            src={file.file_path}
            alt={file.file_name}
            className="w-full h-32 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      case 'video':
        return (
          <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        );
      case 'lottie':
        if (file.metadata?.animation_data) {
          return (
            <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
              <div className="w-16 h-16">
                <Lottie
                  animationData={file.metadata.animation_data}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        );
      case 'code':
        return (
          <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
            <Code className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground ml-2">
              {file.metadata?.language}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              مكتبة الوسائط المشتركة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* شريط البحث */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="ابحث عن ملف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} size="default">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* التبويبات */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recent" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  الأحدث
                </TabsTrigger>
                <TabsTrigger value="popular" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  الأكثر استخداماً
                </TabsTrigger>
                <TabsTrigger value="all">
                  جميع الملفات
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-muted-foreground">جاري التحميل...</div>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getFilteredFiles().map((file) => (
                        <Card
                          key={file.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedItems.includes(file.id) 
                              ? 'ring-2 ring-primary' 
                              : ''
                          }`}
                          onClick={() => handleSelectItem(file)}
                        >
                          <CardContent className="p-4">
                            {/* معاينة الملف */}
                            <div className="mb-3">
                              {renderMediaPreview(file)}
                            </div>

                            {/* معلومات الملف */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  {getMediaIcon(file.media_type)}
                                  {file.media_type}
                                </Badge>
                                {selectedItems.includes(file.id) && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>

                              <h4 className="font-medium text-sm truncate" title={file.file_name}>
                                {file.file_name}
                              </h4>

                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>
                                  {format(new Date(file.created_at), 'dd/MM/yyyy', { locale: ar })}
                                </span>
                                {file.usage_count && file.usage_count > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {file.usage_count} استخدام
                                  </Badge>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFile(file);
                                }}
                              >
                                <Info className="h-3 w-3 ml-1" />
                                تفاصيل
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {getFilteredFiles().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد ملفات مطابقة
                      </div>
                    )}
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>

            {/* أزرار التحكم */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              {multiple && selectedItems.length > 0 && (
                <Button onClick={handleConfirmSelection}>
                  اختيار ({selectedItems.length})
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة تفاصيل الملف */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getMediaIcon(previewFile.media_type)}
                تفاصيل الملف
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>اسم الملف</Label>
                <p className="text-sm">{previewFile.file_name}</p>
              </div>

              <div>
                <Label>نوع الملف</Label>
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  {getMediaIcon(previewFile.media_type)}
                  {previewFile.media_type}
                </Badge>
              </div>

              <div>
                <Label>تاريخ الإنشاء</Label>
                <p className="text-sm">
                  {format(new Date(previewFile.created_at), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>

              {usageInfo.length > 0 && (
                <div>
                  <Label>مستخدم في الدروس</Label>
                  <ScrollArea className="h-32 mt-2">
                    <div className="space-y-2">
                      {usageInfo.map((usage, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded">
                          <div className="font-medium">{usage.lessonTitle}</div>
                          <div className="text-xs text-muted-foreground">
                            {usage.sectionTitle} / {usage.topicTitle}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewFile(null)}>
                  إغلاق
                </Button>
                <Button onClick={() => {
                  handleSelectItem(previewFile);
                  setPreviewFile(null);
                }}>
                  اختيار هذا الملف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SharedMediaPicker;