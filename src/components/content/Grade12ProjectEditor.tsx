import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useGrade12Projects } from '@/hooks/useGrade12Projects';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  FileText,
  MessageSquare,
  Plus,
  Save,
  Target,
  Trash2,
  User,
  AlertCircle,
  History,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import { logger } from '@/lib/logger';
import { ProfessionalDocumentEditor } from '@/components/editor/ProfessionalDocumentEditor';

interface Grade12ProjectEditorProps {
  project: any;
  viewMode: 'student' | 'teacher';
  onClose: () => void;
  onSave: () => void;
}

const Grade12ProjectEditor: React.FC<Grade12ProjectEditorProps> = ({
  project,
  viewMode,
  onClose,
  onSave
}) => {
  const { userProfile } = useAuth();
  const {
    tasks,
    comments,
    revisions,
    fetchTasks,
    fetchComments,
    fetchRevisions,
    updateProject,
    saveRevision,
    addTask,
    updateTaskStatus,
    deleteTask,
    addComment,
  } = useGrade12Projects();

  const [content, setContent] = useState(project.content || '');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [teacherFeedback, setTeacherFeedback] = useState(project.teacher_feedback || '');
  const [newComment, setNewComment] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedParentTask, setSelectedParentTask] = useState<string>('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    if (project.id) {
      fetchTasks(project.id);
      fetchComments(project.id);
      fetchRevisions(project.id);
    }
  }, [project.id]);

  // دالة لاستخراج النص من محتوى TipTap
  const extractTextFromTiptapContent = (content: any): string => {
    if (!content || !content.content) return '';
    
    let text = '';
    const traverse = (node: any) => {
      if (node.type === 'text') {
        text += node.text;
      }
      if (node.content) {
        node.content.forEach(traverse);
      }
    };
    
    content.content.forEach(traverse);
    return text;
  };

  // معالجة تغيير المحتوى من المحرر
  const handleContentChange = (newContent: any, html: string, plainText: string) => {
    setContent(JSON.stringify(newContent));
    setWordCount(plainText.split(/\s+/).filter(word => word.length > 0).length);
    setCharacterCount(plainText.length);
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !content) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await updateProject(project.id, { project_content: content });
        await saveRevision(project.id, content, 'حفظ تلقائي');
      } catch (error) {
        logger.error('Auto-save failed', error as Error);
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [content, autoSaveEnabled, project.id, updateProject, saveRevision]);

  // حفظ المحرر
  const handleEditorSave = async (newContent: any) => {
    if (!project?.id) return;
    
    try {
      await updateProject(project.id, { 
        project_content: JSON.stringify(newContent)
      });
      await saveRevision(project.id, JSON.stringify(newContent), 'حفظ');
      onSave();
    } catch (error) {
      logger.error('خطأ في الحفظ:', error as Error);
      toast('خطأ في حفظ المشروع');
    }
  };

  // حساب التقدم
  const calculateProgress = (): number => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.is_completed);
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  // حفظ المشروع يدوياً
  const handleSaveProject = async () => {
    try {
      await updateProject(project.id, { 
        content,
        ...(viewMode === 'teacher' && { teacher_feedback: teacherFeedback })
      });
      await saveRevision(project.id, content, 'حفظ يدوي');
      toast.success('تم حفظ المشروع بنجاح');
    } catch (error) {
      logger.error('Error saving project', error as Error);
      toast.error('خطأ في حفظ المشروع');
    }
  };

  // إضافة مهمة جديدة
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await addTask({
        project_id: project.id,
        title: newTaskTitle,
        description: newTaskDescription,
        parent_task_id: selectedParentTask || null,
        task_type: selectedParentTask ? 'sub' : 'main',
        order_index: tasks.length,
      });
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setSelectedParentTask('');
      toast.success('تم إضافة المهمة بنجاح');
    } catch (error) {
      logger.error('Error adding task', error as Error);
    }
  };

  // تحديث حالة المهمة
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await updateTaskStatus(taskId, isCompleted);
    } catch (error) {
      logger.error('Error updating task', error as Error);
    }
  };

  // إضافة تعليق
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment({
        project_id: project.id,
        comment: newComment,
        comment_type: viewMode === 'teacher' ? 'feedback' : 'note',
      });
      
      setNewComment('');
      toast.success('تم إضافة التعليق بنجاح');
    } catch (error) {
      logger.error('Error adding comment', error as Error);
    }
  };

  // رندر المهام بشكل هرمي
  const renderTasks = (taskList: any[], parentId: string | null = null, level: number = 0) => {
    const filteredTasks = taskList.filter(task => task.parent_task_id === parentId);
    
    return filteredTasks.map((task) => (
      <div key={task.id} className={`space-y-2 ${level > 0 ? 'mr-6' : ''}`}>
        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Checkbox
            checked={task.is_completed}
            onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
            disabled={viewMode === 'teacher'}
          />
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </span>
              {task.task_type === 'sub' && (
                <Badge variant="outline" className="text-xs">فرعية</Badge>
              )}
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.due_date), 'dd MMM yyyy', { locale: ar })}</span>
              </div>
            )}
          </div>
          
          {viewMode === 'teacher' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask(task.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* رندر المهام الفرعية */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mr-4">
            {renderTasks(task.subtasks, task.id, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-xl font-bold">{project.title}</h1>
                <p className="text-sm text-muted-foreground">
                  طالب: {project?.student_profile?.full_name || 'غير محدد'} • {viewMode === 'teacher' ? 'وضع المعلم' : 'وضع الطالب'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={`${
                project.status === 'completed' ? 'bg-green-100 text-green-700' :
                project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {project.status === 'draft' ? 'مسودة' :
                 project.status === 'in_progress' ? 'قيد التنفيذ' :
                 project.status === 'submitted' ? 'تم التسليم' :
                 project.status === 'completed' ? 'مكتمل' : 'تم المراجعة'}
              </Badge>
              
              <Button onClick={handleSaveProject} className="gap-2">
                <Save className="h-4 w-4" />
                حفظ
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>التقدم الإجمالي</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="project" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="project">المشروع</TabsTrigger>
            <TabsTrigger value="tasks">المهام</TabsTrigger>
            <TabsTrigger value="comments">التعليقات</TabsTrigger>
            <TabsTrigger value="revisions">المراجعات</TabsTrigger>
          </TabsList>

          {/* Project Content */}
          <TabsContent value="project" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Project Editor */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      محرر المشروع
                    </CardTitle>
                    <CardDescription>
                      اكتب محتوى مشروعك هنا. يتم الحفظ التلقائي كل 5 ثوانِ.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px]">
                      <ProfessionalDocumentEditor
                        documentId={project.id}
                        initialContent={project?.project_content ? JSON.parse(project.project_content) : undefined}
                        onContentChange={handleContentChange}
                        onSave={handleEditorSave}
                        className="h-full"
                        showToolbar={true}
                        enableCollaboration={false}
                        autoSave={autoSaveEnabled}
                        title={project?.title || "مشروع التخرج"}
                        wordCount={wordCount}
                        enableImagePasting={true}
                        enableImageResizing={true}
                        readOnly={viewMode === 'teacher'}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Project Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">معلومات المشروع</CardTitle>
                  </CardHeader>
                   <CardContent className="space-y-3 text-sm">
                     <div className="flex items-center gap-2">
                       <FileText className="h-4 w-4 text-muted-foreground" />
                       <span>الكلمات: {wordCount}</span>
                     </div>
                     
                     <div className="flex items-center gap-2">
                       <FileText className="h-4 w-4 text-muted-foreground" />
                       <span>الأحرف: {characterCount}</span>
                     </div>
                     
                     {project.due_date && (
                       <div className="flex items-center gap-2">
                         <Calendar className="h-4 w-4 text-muted-foreground" />
                         <span>التسليم: {format(new Date(project.due_date), 'dd MMM yyyy', { locale: ar })}</span>
                       </div>
                     )}
                     
                     {project.grade && (
                       <div className="flex items-center gap-2">
                         <Target className="h-4 w-4 text-muted-foreground" />
                         <span>الدرجة: {project.grade}</span>
                       </div>
                     )}
                     
                     <div className="flex items-center gap-2">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <span>آخر تحديث: {format(new Date(project.updated_at), 'dd MMM yyyy', { locale: ar })}</span>
                     </div>
                   </CardContent>
                </Card>

                {/* Auto-save Toggle */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="auto-save"
                        checked={autoSaveEnabled}
                        onCheckedChange={(checked) => setAutoSaveEnabled(checked === true)}
                      />
                      <Label htmlFor="auto-save" className="text-sm">
                        الحفظ التلقائي
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Teacher Feedback */}
                {viewMode === 'teacher' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">ملاحظات المعلم</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        placeholder="اكتب ملاحظاتك على المشروع..."
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>المهام</CardTitle>
                    <CardDescription>قائمة المهام المطلوبة للمشروع</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد مهام حتى الآن</p>
                      </div>
                    ) : (
                      renderTasks(tasks)
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Add Task Form */}
              {viewMode === 'teacher' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">إضافة مهمة جديدة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">عنوان المهمة</Label>
                      <Input
                        id="task-title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="أدخل عنوان المهمة"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="task-description">الوصف</Label>
                      <Textarea
                        id="task-description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="وصف المهمة..."
                        rows={3}
                      />
                    </div>
                    
                    <Button onClick={handleAddTask} className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة المهمة
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>التعليقات والملاحظات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد تعليقات حتى الآن</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={comment.comment_type === 'feedback' ? 'default' : 'outline'}>
                              {comment.comment_type === 'feedback' ? 'ملاحظة' : 'تعليق'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Add Comment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">إضافة تعليق</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="اكتب تعليقك هنا..."
                    rows={4}
                  />
                  
                  <Button onClick={handleAddComment} className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    إضافة التعليق
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revisions Tab */}
          <TabsContent value="revisions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  سجل المراجعات
                </CardTitle>
                <CardDescription>
                  تاريخ جميع التغييرات المحفوظة في المشروع
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revisions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مراجعات محفوظة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revisions.map((revision) => (
                      <div key={revision.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {revision.revision_note || 'مراجعة غير محددة'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(revision.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {revision.content_snapshot.substring(0, 200)}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Grade12ProjectEditor;