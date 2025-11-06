import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Link as LinkIcon, Library, Music, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AudioPlayer } from '@/components/ui/audio-player';

interface LessonAudioFormProps {
  onSave: (audioData: {
    media_title: string;
    media_url: string;
    media_source: 'upload' | 'url' | 'library';
    description?: string;
    metadata?: {
      duration?: number;
      file_size?: number;
      format?: string;
    };
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    media_title: string;
    media_url: string;
    media_source: 'upload' | 'url' | 'library';
    description?: string;
    metadata?: any;
  };
}

export const LessonAudioForm = ({ onSave, onCancel, initialData }: LessonAudioFormProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.media_title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [audioUrl, setAudioUrl] = useState(initialData?.media_url || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.media_url || '');
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'library'>('upload');
  const [duration, setDuration] = useState<number | undefined>(
    initialData?.metadata?.duration
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار ملف صوتي',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // حساب المدة تلقائياً
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(Math.round(audio.duration));
    });

    // تعيين العنوان تلقائياً من اسم الملف إذا كان فارغاً
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUrlInput = (url: string) => {
    setAudioUrl(url);
    setPreviewUrl(url);

    // محاولة حساب المدة
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(Math.round(audio.duration));
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `lesson-audio/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('grade11-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('grade11-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'خطأ',
        description: 'يجب إدخال عنوان الملف الصوتي',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let finalUrl = audioUrl;

      // رفع الملف إذا تم اختياره
      if (activeTab === 'upload' && selectedFile) {
        finalUrl = await uploadFile(selectedFile);
      }

      if (!finalUrl) {
        toast({
          title: 'خطأ',
          description: 'يجب اختيار ملف أو إدخال رابط',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      await onSave({
        media_title: title,
        media_url: finalUrl,
        media_source: activeTab,
        description: description || undefined,
        metadata: {
          duration,
          file_size: selectedFile?.size,
          format: selectedFile?.type,
        },
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم حفظ الملف الصوتي',
      });
    } catch (error) {
      console.error('Error saving audio:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الملف الصوتي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4 border-2 border-orange-200 bg-orange-50/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Music className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">
            {initialData ? 'تعديل ملف صوتي' : 'إضافة ملف صوتي'}
          </h3>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              رفع ملف
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              رابط خارجي
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              المكتبة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <Label>اختر ملف صوتي</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                الصيغ المدعومة: MP3, WAV, OGG, M4A
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div>
              <Label>رابط الملف الصوتي</Label>
              <Input
                type="url"
                placeholder="https://example.com/audio.mp3"
                value={audioUrl}
                onChange={(e) => handleUrlInput(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                يمكنك إدخال رابط من SoundCloud, Google Drive, أو أي مصدر آخر
              </p>
            </div>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Library className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>المكتبة المشتركة قريباً</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 mt-4">
          <div>
            <Label>عنوان الملف الصوتي *</Label>
            <Input
              placeholder="مثال: شرح الدرس بالصوت"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>وصف (اختياري)</Label>
            <Textarea
              placeholder="وصف مختصر للملف الصوتي..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          {duration && (
            <div className="text-sm text-muted-foreground">
              المدة: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} دقيقة
            </div>
          )}

          {/* معاينة الصوت */}
          {previewUrl && (
            <div>
              <Label className="mb-2 block">معاينة</Label>
              <AudioPlayer src={previewUrl} title={title || 'معاينة'} />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'تحديث' : 'حفظ'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            إلغاء
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
