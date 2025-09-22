import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import Lottie from 'lottie-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Grade11LessonMedia } from '@/hooks/useGrade11Content';
import { Loader2, Settings } from 'lucide-react';

interface LottieEditFormProps {
  media: Grade11LessonMedia;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Grade11LessonMedia>) => Promise<void>;
}

export const LottieEditForm = ({ media, isOpen, onClose, onUpdate }: LottieEditFormProps) => {
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lottieKey, setLottieKey] = useState(0);
  const lottieRef = useRef<any>(null);
  
  const [formData, setFormData] = useState({
    file_name: media.file_name || '',
    title: media.metadata?.title || media.file_name || '',
    description: media.metadata?.description || '',
    speed: typeof media.metadata?.speed === 'number' ? media.metadata.speed : 1,
    loop: typeof media.metadata?.loop === 'boolean' ? media.metadata.loop : true,
    autoplay: typeof media.metadata?.autoplay === 'boolean' ? media.metadata.autoplay : true
  });

  // Apply speed changes to Lottie in real-time
  useEffect(() => {
    if (lottieRef.current && formData.speed !== undefined) {
      console.log('Applying speed to preview:', formData.speed);
      lottieRef.current.setSpeed(formData.speed);
    }
  }, [formData.speed]);

  // Only super admin can edit
  const canEdit = userProfile?.role === 'superadmin';

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات ملف اللوتي
            </DialogTitle>
            <DialogDescription>
              يمكن للمدير العام فقط تعديل إعدادات ملفات اللوتي
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم الملف</Label>
              <Input value={formData.file_name} disabled />
            </div>
            <div>
              <Label>السرعة: {formData.speed}x</Label>
              <Slider value={[formData.speed]} disabled />
            </div>
            <div className="flex items-center justify-between">
              <Label>تكرار التشغيل</Label>
              <Switch checked={formData.loop} disabled />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedMetadata = {
        ...media.metadata,
        title: formData.title,
        description: formData.description,
        speed: Number(formData.speed), // Ensure it's saved as number
        loop: Boolean(formData.loop),
        autoplay: Boolean(formData.autoplay)
      };
      
      console.log('Saving Lottie metadata with speed:', updatedMetadata.speed);

      await onUpdate({
        file_name: formData.file_name,
        metadata: updatedMetadata
      });

      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات ملف اللوتي بنجاح"
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating Lottie media:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث إعدادات ملف اللوتي",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse animation data for preview
  let animationData = null;
  try {
    if (media.metadata?.animation_data) {
      animationData = typeof media.metadata.animation_data === 'string' 
        ? JSON.parse(media.metadata.animation_data)
        : media.metadata.animation_data;
    } else if (media.metadata?.lottie_data) {
      animationData = typeof media.metadata.lottie_data === 'string'
        ? JSON.parse(media.metadata.lottie_data)
        : media.metadata.lottie_data;
    }
  } catch (e) {
    console.error('Error parsing animation data:', e);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            تعديل إعدادات ملف اللوتي
          </DialogTitle>
          <DialogDescription>
            قم بتعديل اسم الملف والإعدادات الخاصة بالتشغيل
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fileName">اسم الملف</Label>
                <Input
                  id="fileName"
                  value={formData.file_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_name: e.target.value }))}
                  placeholder="أدخل اسم الملف"
                  required
                />
              </div>

              <div>
                <Label htmlFor="title">العنوان</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="عنوان ملف اللوتي"
                />
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف محتوى ملف اللوتي"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>سرعة التشغيل: {formData.speed}x</Label>
                <Slider
                  value={[formData.speed]}
                  onValueChange={(value) => {
                    const newSpeed = Math.max(0.1, Math.min(5, value[0])); // Validate speed range
                    console.log('Speed changed to:', newSpeed);
                    setFormData(prev => ({ ...prev, speed: newSpeed }));
                  }}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0.1x</span>
                  <span>5x</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="loop">تكرار التشغيل</Label>
                <Switch
                  id="loop"
                  checked={formData.loop}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, loop: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoplay">التشغيل التلقائي</Label>
                <Switch
                  id="autoplay"
                  checked={formData.autoplay}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoplay: checked }))}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  حفظ التغييرات
                </Button>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <Label>معاينة مباشرة</Label>
            <Card>
              <CardContent className="p-4">
                {animationData ? (
                  <div className="flex items-center justify-center">
                    <Lottie
                      key={lottieKey}
                      lottieRef={lottieRef}
                      animationData={animationData}
                      loop={formData.loop}
                      autoplay={formData.autoplay}
                      style={{ width: 200, height: 200 }}
                      onLoadedData={() => {
                        console.log('Preview Lottie loaded');
                        if (lottieRef.current && formData.speed !== 1) {
                          console.log('Setting preview speed on load:', formData.speed);
                          lottieRef.current.setSpeed(formData.speed);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <p>لا يمكن عرض ملف اللوتي</p>
                  </div>
                )}
                
                <div className="mt-4 space-y-2 text-sm">
                  <p><strong>العنوان:</strong> {formData.title}</p>
                  {formData.description && (
                    <p><strong>الوصف:</strong> {formData.description}</p>
                  )}
                  <p><strong>السرعة:</strong> {formData.speed}x</p>
                  <p><strong>التكرار:</strong> {formData.loop ? 'مفعل' : 'معطل'}</p>
                  <p><strong>التشغيل التلقائي:</strong> {formData.autoplay ? 'مفعل' : 'معطل'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};