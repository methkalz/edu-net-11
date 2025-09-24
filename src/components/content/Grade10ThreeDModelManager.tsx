import React, { useState } from 'react';
import { useStudentGrade10Lessons } from '@/hooks/useStudentGrade10Lessons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Box, Eye, Trash2, Edit } from 'lucide-react';
import { Grade10ThreeDModelForm } from './Grade10ThreeDModelForm';
import { ThreeDModelViewer } from './ThreeDModelViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Grade10ThreeDModelManager: React.FC = () => {
  const { sections, loading, refetch } = useStudentGrade10Lessons();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewModel, setPreviewModel] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleTopic = (topicId: string) => {
    setOpenTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleDelete3DModel = async (modelId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النموذج ثلاثي الأبعاد؟')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('grade10_lesson_media')
        .delete()
        .eq('id', modelId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف النموذج ثلاثي الأبعاد بنجاح",
      });

      refetch();
    } catch (error) {
      console.error('Error deleting 3D model:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف النموذج ثلاثي الأبعاد",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (model: any) => {
    setPreviewModel(model);
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-2">جارٍ تحميل المحتوى...</span>
      </div>
    );
  }

  const get3DModels = () => {
    const models: any[] = [];
    sections.forEach(section => {
      section.topics.forEach(topic => {
        topic.lessons.forEach(lesson => {
          if (lesson.media) {
            lesson.media
              .filter(media => media.media_type === '3d_model')
              .forEach(model => {
                models.push({
                  ...model,
                  sectionTitle: section.title,
                  topicTitle: topic.title,
                  lessonTitle: lesson.title,
                  lessonId: lesson.id
                });
              });
          }
        });
      });
    });
    return models;
  };

  const threeDModels = get3DModels();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Box className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">إدارة النماذج ثلاثية الأبعاد</h2>
          <Badge variant="secondary">{threeDModels.length} نموذج</Badge>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة نموذج ثلاثي الأبعاد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة نموذج ثلاثي الأبعاد جديد</DialogTitle>
            </DialogHeader>
            {selectedLessonId ? (
              <Grade10ThreeDModelForm
                lessonId={selectedLessonId}
                onSuccess={() => {
                  setShowAddForm(false);
                  setSelectedLessonId(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedLessonId(null);
                }}
              />
            ) : (
              <div className="p-4">
                <p className="text-center text-muted-foreground mb-4">
                  اختر درساً لإضافة النموذج ثلاثي الأبعاد إليه:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sections.map(section => (
                    <div key={section.id}>
                      <Collapsible 
                        open={openSections[section.id]} 
                        onOpenChange={() => toggleSection(section.id)}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded">
                          {openSections[section.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <span className="font-medium">{section.title}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mr-6">
                          {section.topics.map(topic => (
                            <div key={topic.id}>
                              <Collapsible 
                                open={openTopics[topic.id]} 
                                onOpenChange={() => toggleTopic(topic.id)}
                              >
                                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded">
                                  {openTopics[topic.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  <span>{topic.title}</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mr-6">
                                  {topic.lessons.map(lesson => (
                                    <Button
                                      key={lesson.id}
                                      variant="ghost"
                                      className="w-full justify-start p-2"
                                      onClick={() => {
                                        setSelectedLessonId(lesson.id);
                                      }}
                                    >
                                      {lesson.title}
                                    </Button>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Models Grid */}
      {threeDModels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Box className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد نماذج ثلاثية الأبعاد</h3>
            <p className="text-muted-foreground mb-4 text-center">
              لم يتم إضافة أي نماذج ثلاثية الأبعاد بعد
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              إضافة أول نموذج
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threeDModels.map((model) => (
            <Card key={model.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">{model.file_name}</CardTitle>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{model.sectionTitle}</p>
                      <p>{model.topicTitle}</p>
                      <p className="font-medium">{model.lessonTitle}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {model.file_path.toLowerCase().endsWith('.glb') ? 'GLB' : 'OBJ'}
                  </Badge>
                </div>
                {model.metadata?.description && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {model.metadata.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(model)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    معاينة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete3DModel(model.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewModel?.file_name}</DialogTitle>
          </DialogHeader>
          {previewModel && (
            <div className="h-96">
              <ThreeDModelViewer
                modelUrl={previewModel.file_path}
                modelType={previewModel.file_path.toLowerCase().endsWith('.glb') ? 'glb' : 'obj'}
                title={previewModel.file_name}
                autoRotate={previewModel.metadata?.autoRotate !== false}
                showControls={true}
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Grade10ThreeDModelManager;