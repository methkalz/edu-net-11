import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useGrade12DefaultTasks } from '@/hooks/useGrade12DefaultTasks';
import { ProfessionalDocumentEditor } from '@/components/editor/ProfessionalDocumentEditor';
import { 
  Save, 
  X, 
  Clock, 
  FileText, 
  Users,
  CheckCircle,
  Calendar,
  Upload,
  Image as ImageIcon,
  Download,
  Trophy,
  Target,
  Sparkles,
  MessageSquare,
  History,
  Info,
  Plus,
  Send,
  RotateCcw,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Grade12FinalProjectEditorProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

// Types for comments and versions
interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  type: 'teacher' | 'student';
}

interface Version {
  id: string;
  content: string;
  timestamp: string;
  changes: string;
}

const Grade12FinalProjectEditor: React.FC<Grade12FinalProjectEditorProps> = ({
  project,
  isOpen,
  onClose,
  onSave
}) => {
  const { userProfile } = useAuth();
  const { updateProject, saveRevision, addComment } = useGrade12Projects();
  const { phases, updateTaskCompletion, getOverallProgress } = useGrade12DefaultTasks();
  const [content, setContent] = useState(project?.project_content || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments and versions states
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('editor');

  // معالجة تغيير المحتوى من المحرر
  const handleContentChange = (newContent: any, html: string, plainText: string) => {
    setContent(JSON.stringify(newContent));
    setWordCount(plainText.split(/\s+/).filter(word => word.length > 0).length);
    setCharacterCount(plainText.length);
  };

  // حفظ المحرر
  const handleEditorSave = async (newContent: any) => {
    if (!project?.id) return;
    
    setIsAutoSaving(true);
    try {
      await updateProject(project.id, { 
        project_content: JSON.stringify(newContent)
      });
      setLastSaved(new Date());
      onSave?.();
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save functionality with versioning
  useEffect(() => {
    if (!project?.id || content === project?.project_content) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await updateProject(project.id, { project_content: content });
        
        // Save auto version history (max 5 versions)
        const newVersion: Version = {
          id: `auto_${Date.now()}`,
          content,
          timestamp: new Date().toISOString(),
          changes: `تحديث تلقائي - ${new Date().toLocaleTimeString('en-US')}`
        };
        setVersions(prev => {
          const autoVersions = prev.filter(v => v.id.startsWith('auto_'));
          const manualVersions = prev.filter(v => v.id.startsWith('manual_'));
          const updatedAutoVersions = [newVersion, ...autoVersions.slice(0, 4)]; // Keep 5 auto versions
          return [...updatedAutoVersions, ...manualVersions];
        });
        
        setLastSaved(new Date());
        toast({
          title: "حُفظ تلقائياً",
          description: "تم حفظ المشروع النهائي تلقائياً",
          duration: 2000
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 600000); // Auto-save after 10 minutes of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [content, project?.id, project?.project_content, updateProject]);

  const handleSave = async () => {
    if (!project?.id) return;

    try {
      await updateProject(project.id, { project_content: content });
      
      // Add to manual version history (max 3 versions)
      const newVersion: Version = {
        id: `manual_${Date.now()}`,
        content,
        timestamp: new Date().toISOString(),
        changes: `حفظ يدوي - ${new Date().toLocaleTimeString('en-US')}`
      };
      setVersions(prev => {
        const autoVersions = prev.filter(v => v.id.startsWith('auto_'));
        const manualVersions = prev.filter(v => v.id.startsWith('manual_'));
        const updatedManualVersions = [newVersion, ...manualVersions.slice(0, 2)]; // Keep 3 manual versions
        return [...autoVersions, ...updatedManualVersions];
      });
      
      setLastSaved(new Date());
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المشروع النهائي بنجاح"
      });
      onSave?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ المشروع النهائي",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload to Supabase Storage - create bucket for grade12 projects if it doesn't exist
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('grade10-documents')
        .upload(`grade12-final-projects/${userProfile?.user_id}/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('grade10-documents')
        .getPublicUrl(data.path);

      // Insert image into editor
      const imageHTML = `<img src="${publicUrlData.publicUrl}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" alt="صورة المشروع النهائي" />`;
      
      setContent(prev => prev + imageHTML);

      toast({
        title: "تم رفع الصورة",
        description: "تم إدراج الصورة في المشروع النهائي بنجاح"
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive"
      });
    }
  };

  const handlePasteImage = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          // Create a fake input event to reuse the upload logic
          const fakeEvent = {
            target: { files: [file] }
          } as any;
          handleImageUpload(fakeEvent);
        }
        break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePasteImage);
    return () => document.removeEventListener('paste', handlePasteImage);
  }, [project?.id]);

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    try {
      await updateTaskCompletion(taskId, isCompleted);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Add comment functionality
  const handleAddComment = async () => {
    if (!newComment.trim() || !project?.id) return;

    try {
      const comment: Comment = {
        id: `c_${Date.now()}`,
        text: newComment,
        author: userProfile?.full_name || 'مجهول',
        timestamp: new Date().toISOString(),
        type: userProfile?.role === 'teacher' ? 'teacher' : 'student'
      };

      // Add to local state
      setComments(prev => [comment, ...prev]);
      
      // Save to database if available
      if (addComment) {
        await addComment({
          project_id: project.id,
          comment: newComment,
          comment_type: 'general',
          created_by: userProfile?.user_id
        });
      }

      setNewComment('');
      toast({
        title: "تم إضافة التعليق",
        description: "تم حفظ التعليق بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة التعليق",
        variant: "destructive"
      });
    }
  };

  // Restore version functionality
  const handleRestoreVersion = (version: Version) => {
    setContent(version.content);
    toast({
      title: "تم استرداد النسخة",
      description: `تم استرداد النسخة من ${new Date(version.timestamp).toLocaleString('en-US')}`
    });
  };

  const isStudent = userProfile?.role === 'student';
  const canEdit = isStudent && project?.student_id === userProfile?.user_id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'submitted': return 'مُسلم';
      case 'reviewed': return 'تم المراجعة';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };

  const overallProgress = getOverallProgress();

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">المشروع النهائي: {project.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  آخر حفظ: {lastSaved ? lastSaved.toLocaleTimeString('en-US') : 'لم يتم الحفظ'}
                  {isAutoSaving && <span className="text-blue-600 ml-2">جاري الحفظ...</span>}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Tasks Sidebar */}
          <div className="w-80 flex-shrink-0 bg-muted/30 rounded-lg p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  المهام الافتراضية
                </h3>
                <div className="space-y-2">
                  <Progress value={overallProgress.percentage} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {overallProgress.completed} من {overallProgress.total} مهام مكتملة
                  </p>
                </div>
              </div>

              {phases.map((phase) => (
                <Card key={phase.phase_number} className="bg-background border border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        {phase.phase_title}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {phase.completion_percentage}%
                      </Badge>
                    </div>
                    <Progress value={phase.completion_percentage} className="h-1.5" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <button
                            onClick={() => handleTaskToggle(task.id, !task.progress?.is_completed)}
                            className="mt-0.5 flex-shrink-0"
                            disabled={!canEdit}
                          >
                            <CheckCircle 
                              className={`h-4 w-4 transition-colors ${
                                task.progress?.is_completed 
                                  ? 'text-green-600 fill-green-100' 
                                  : 'text-muted-foreground hover:text-green-600'
                              }`} 
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium leading-tight ${
                              task.progress?.is_completed 
                                ? 'line-through text-muted-foreground' 
                                : 'text-foreground'
                            }`}>
                              {task.task_title}
                            </p>
                            {task.task_description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                                {task.task_description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  المحرر
                </TabsTrigger>
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  التعليقات ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  النسخ ({versions.length})
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  معلومات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="flex-1 mt-4">
                <div className="h-full">
                  <ProfessionalDocumentEditor
                    documentId={project.id}
                    initialContent={project?.project_content ? JSON.parse(project.project_content) : undefined}
                    onContentChange={handleContentChange}
                    onSave={handleEditorSave}
                    className="h-full"
                    showToolbar={true}
                    enableCollaboration={false}
                    autoSave={true}
                    title={project?.title || "المشروع النهائي"}
                    wordCount={wordCount}
                    enableImagePasting={true}
                    enableImageResizing={true}
                    readOnly={!canEdit}
                  />
                </div>
              </TabsContent>

              <TabsContent value="comments" className="flex-1 mt-4">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      التعليقات والملاحظات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    {/* Add new comment */}
                    {canEdit && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="اكتب تعليقاً أو ملاحظة..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="w-fit"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          إضافة تعليق
                        </Button>
                      </div>
                    )}

                    {/* Comments list */}
                    <ScrollArea className="flex-1">
                      <div className="space-y-4">
                        {comments.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد تعليقات بعد</p>
                          </div>
                        ) : (
                          comments.map((comment) => (
                            <Card key={comment.id} className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{comment.author}</span>
                                    <Badge variant={comment.type === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                                      {comment.type === 'teacher' ? 'معلم' : 'طالب'}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.timestamp).toLocaleString('en-US')}
                                  </span>
                                  <p className="text-sm mt-2">{comment.text}</p>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="flex-1 mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5" />
                      نسخ محفوظة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-full">
                      <div className="space-y-3">
                        {versions.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد نسخ محفوظة بعد</p>
                          </div>
                        ) : (
                          versions.map((version) => (
                            <Card key={version.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm text-muted-foreground mb-2">{version.changes}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(version.timestamp).toLocaleString('en-US')}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestoreVersion(version)}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    استرداد
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="flex-1 mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      معلومات المشروع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>تاريخ الإنشاء:</span>
                          <span className="font-medium">
                            {new Date(project.created_at).toLocaleDateString('en-US')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>آخر تحديث:</span>
                          <span className="font-medium">
                            {lastSaved ? lastSaved.toLocaleString('en-US') : 'لم يحفظ بعد'}
                          </span>
                        </div>
                        {project.due_date && (
                          <div className="flex justify-between">
                            <span>موعد التسليم:</span>
                            <span className="font-medium">
                              {new Date(project.due_date).toLocaleDateString('en-US')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>الحالة:</span>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>التقدم في المهام:</span>
                          <span className="font-medium">{overallProgress.percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>عدد التعليقات:</span>
                          <span className="font-medium">{comments.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">إحصائيات التقدم</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>المهام المكتملة:</span>
                          <span>{overallProgress.completed} من {overallProgress.total}</span>
                        </div>
                        <Progress value={overallProgress.percentage} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                آخر تحديث: {new Date(project.updated_at).toLocaleString('en-US')}
              </span>
            </div>
            {project.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  موعد التسليم: {new Date(project.due_date).toLocaleDateString('en-US')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>التقدم: {overallProgress.percentage}%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  رفع صورة
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isAutoSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  حفظ يدوي
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Grade12FinalProjectEditor;