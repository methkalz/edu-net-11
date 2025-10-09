import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Clock, FileText, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useExamSystem } from '@/hooks/useExamSystem';
import ExamTemplateForm from './ExamTemplateForm';
import ExamSettings from './ExamSettings';
import ExamPreview from './ExamPreview';
import { logger } from '@/lib/logger';

const ExamTemplateManager: React.FC = () => {
  const { loading, templates, fetchTemplates, generateTemplatePreview } = useExamSystem();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    exam?: {
      title: string;
      description?: string;
      duration_minutes: number;
      pass_percentage: number;
      show_results_immediately?: boolean;
    };
    questions: any[];
    settings?: Record<string, unknown>;
  } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  const handleFormSave = () => {
    handleFormClose();
    fetchTemplates();
  };

  const handleExamSettings = (template: any) => {
    setSelectedTemplate(template);
    setIsSettingsOpen(true);
  };

  const handleSettingsSuccess = () => {
    setIsSettingsOpen(false);
    setSelectedTemplate(null);
    fetchTemplates();
  };

  const handlePreviewTemplate = async (template: any) => {
    try {
      const data = await generateTemplatePreview(template);
      setPreviewData(data);
      setIsPreviewOpen(true);
    } catch (error) {
      logger.error('Error generating template preview', error as Error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">قوالب الاختبارات</h2>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              إنشاء قالب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'تعديل قالب الاختبار' : 'إنشاء قالب اختبار جديد'}
              </DialogTitle>
            </DialogHeader>
            <ExamTemplateForm
              template={editingTemplate}
              onClose={handleFormClose}
              onSave={handleFormSave}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد قوالب اختبارات</p>
              </CardContent>
            </Card>
          ) : (
            templates.map((template: any) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          الصف {template.grade_level}
                        </Badge>
                        {template.is_active ? (
                          <Badge className="bg-green-100 text-green-800">نشط</Badge>
                        ) : (
                          <Badge variant="secondary">غير نشط</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                        title="معاينة القالب"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        title="تعديل القالب"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{template.total_questions} سؤال</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{template.duration_minutes} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>{template.pass_percentage}% للنجاح</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{template.max_attempts} محاولة</span>
                    </div>
                  </div>

                  {/* Difficulty Distribution */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">توزيع مستويات الصعوبة:</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-800">سهل</div>
                        <div className="text-green-600">{template.difficulty_distribution?.easy || 0}%</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="font-medium text-yellow-800">متوسط</div>
                        <div className="text-yellow-600">{template.difficulty_distribution?.medium || 0}%</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-medium text-red-800">صعب</div>
                        <div className="text-red-600">{template.difficulty_distribution?.hard || 0}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {template.randomize_questions && (
                      <Badge variant="outline" className="text-xs">ترتيب عشوائي للأسئلة</Badge>
                    )}
                    {template.randomize_answers && (
                      <Badge variant="outline" className="text-xs">ترتيب عشوائي للأجوبة</Badge>
                    )}
                    {template.show_results_immediately && (
                      <Badge variant="outline" className="text-xs">إظهار النتائج فوراً</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handlePreviewTemplate(template)}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      معاينة الاختبار
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={() => handleExamSettings(template)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      إعدادات الاختبار
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Exam Settings Dialog */}
      {selectedTemplate && (
        <ExamSettings
          template={selectedTemplate}
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          onSuccess={handleSettingsSuccess}
        />
      )}

      {/* Exam Preview Dialog */}
      {previewData && (
        <ExamPreview
          examData={{
            exam: previewData.exam || {
              title: 'معاينة القالب',
              description: 'معاينة لقالب الامتحان',
              duration_minutes: 60,
              pass_percentage: 60,
              show_results_immediately: true
            },
            questions: previewData.questions
          }}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />
      )}
    </div>
  );
};

export default ExamTemplateManager;