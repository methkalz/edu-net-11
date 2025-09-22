import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grade11Lesson, Grade11LessonMedia } from '@/hooks/useGrade11Content';
import Grade11LessonMediaManager from './Grade11LessonMediaManager';

interface Grade11LessonFormProps {
  lesson?: Grade11Lesson;
  topicId: string;
  onSave: (lessonData: Omit<Grade11Lesson, 'id' | 'created_at' | 'updated_at' | 'media'>) => void;
  onAddMedia?: (mediaData: Omit<Grade11LessonMedia, 'id' | 'created_at'>) => Promise<any>;
  onDeleteMedia?: (mediaId: string) => Promise<void>;
  onUpdateMedia?: (mediaId: string, updates: Partial<Grade11LessonMedia>) => Promise<void>;
  onCancel: () => void;
}

const Grade11LessonForm: React.FC<Grade11LessonFormProps> = ({
  lesson,
  topicId,
  onSave,
  onAddMedia,
  onDeleteMedia,
  onUpdateMedia,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    topic_id: topicId,
    title: '',
    content: '',
    order_index: 0
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        topic_id: lesson.topic_id,
        title: lesson.title,
        content: lesson.content || '',
        order_index: lesson.order_index
      });
    } else if (topicId) {
      setFormData(prev => ({ ...prev, topic_id: topicId }));
    }
  }, [lesson, topicId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
            <TabsTrigger value="media">الوسائط ({lesson?.media?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الدرس</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أدخل عنوان الدرس"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">محتوى الدرس</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="أدخل محتوى الدرس"
                  rows={8}
                />
              </div>

              <div>
                <Label htmlFor="order_index">ترتيب الدرس</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {lesson ? 'تحديث' : 'حفظ'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="media" className="space-y-4">
            {lesson?.id && (
              <Grade11LessonMediaManager
                lessonId={lesson.id}
                media={lesson.media || []}
                onAddMedia={onAddMedia}
                onDeleteMedia={onDeleteMedia}
                onUpdateMedia={onUpdateMedia}
              />
            )}
            {!lesson?.id && (
              <div className="text-center py-8 text-muted-foreground">
                <p>يجب حفظ الدرس أولاً قبل إضافة الوسائط</p>
              </div>
            )}
            
            <div className="flex gap-2 justify-end border-t pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                إغلاق
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Grade11LessonForm;