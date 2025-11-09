import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grade10Lesson, Grade10LessonMedia } from '@/hooks/useGrade10AdminContent';
import RichTextEditor from '@/components/content/RichTextEditor';
import Grade10LessonMediaManager from '@/components/content/Grade10LessonMediaManager';

interface Grade10LessonFormProps {
  lesson?: Grade10Lesson | null;
  lessonMedia?: Grade10LessonMedia[];
  topicId: string;
  onSave: (data: any) => Promise<any>;
  onCancel: () => void;
  saving: boolean;
  onAddMedia?: (mediaData: Omit<Grade10LessonMedia, 'id' | 'created_at'>) => Promise<any>;
  onDeleteMedia?: (mediaId: string) => Promise<void>;
  onUpdateMedia?: (mediaId: string, updates: Partial<Grade10LessonMedia>) => Promise<void>;
}

const Grade10LessonForm: React.FC<Grade10LessonFormProps> = ({
  lesson,
  lessonMedia = [],
  topicId,
  onSave,
  onCancel,
  saving,
  onAddMedia,
  onDeleteMedia,
  onUpdateMedia
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic_id: topicId,
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        content: lesson.content || '',
        topic_id: lesson.topic_id,
        order_index: lesson.order_index,
        is_active: lesson.is_active
      });
    } else {
      setFormData({
        title: '',
        content: '',
        topic_id: topicId,
        order_index: 0,
        is_active: true
      });
    }
  }, [lesson, topicId]);

  const handleContentChange = (newContent: string) => {
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // When lesson is saved, show media tab
  const showMediaTab = lesson && lesson.id;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">معلومات الدرس</TabsTrigger>
            <TabsTrigger value="media" disabled={!showMediaTab}>
              الوسائط {lessonMedia.length > 0 && `(${lessonMedia.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الدرس *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="مثال: مضيف (Host)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">محتوى الدرس</Label>
            <div className="border rounded-md">
              <RichTextEditor
                content={formData.content}
                onChange={handleContentChange}
                placeholder="اكتب محتوى الدرس هنا..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_index">ترتيب الدرس</Label>
            <Input
              id="order_index"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              min={0}
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">الدرس نشط</Label>
          </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving || !formData.title.trim()}>
                  {saving ? 'جاري الحفظ...' : (lesson ? 'تحديث الدرس' : 'إضافة الدرس')}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  إلغاء
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            {showMediaTab && (
              <Grade10LessonMediaManager
                lessonId={lesson?.id}
                media={lessonMedia}
                onAddMedia={onAddMedia}
                onDeleteMedia={onDeleteMedia}
                onUpdateMedia={onUpdateMedia}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Grade10LessonForm;