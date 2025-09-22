import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  CheckSquare, 
  MessageSquare, 
  Upload, 
  Save, 
  Plus,
  X,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { Grade10MiniProject, TaskFormData, CommentFormData } from '@/types/grade10-projects';

interface ProjectEditorProps {
  project: Grade10MiniProject;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, isOpen, onClose }) => {
  const { 
    tasks, 
    comments, 
    files,
    updateProjectContent,
    updateProjectStatus,
    addTask,
    toggleTaskCompletion,
    addComment,
    uploadFile
  } = useGrade10MiniProjects();
  
  const { userProfile } = useAuth();
  const [content, setContent] = useState(project.content);
  const [newTask, setNewTask] = useState<TaskFormData>({ title: '', description: '' });
  const [newComment, setNewComment] = useState<CommentFormData>({
    comment_text: '',
    comment_type: 'comment',
    is_private: false
  });
  const [isAddingTask, setIsAddingTask] = useState(false);

  const isOwner = userProfile?.user_id === project.student_id;
  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'school_admin';

  const handleSaveContent = async () => {
    await updateProjectContent(project.id, content);
  };

  const handleStatusChange = async (newStatus: Grade10MiniProject['status']) => {
    await updateProjectStatus(project.id, newStatus);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال عنوان المهمة",
        variant: "destructive"
      });
      return;
    }

    const result = await addTask(project.id, newTask);
    if (result) {
      setNewTask({ title: '', description: '' });
      setIsAddingTask(false);
    }
  };

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    await toggleTaskCompletion(taskId, isCompleted);
  };

  const handleAddComment = async () => {
    if (!newComment.comment_text.trim()) return;

    const result = await addComment(project.id, newComment);
    if (result) {
      setNewComment({
        comment_text: '',
        comment_type: 'comment',
        is_private: false
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(project.id, file);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'in_progress': return 'outline';
      case 'completed': return 'default';
      case 'reviewed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'reviewed': return 'تم المراجعة';
      default: return status;
    }
  };

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{project.title}</DialogTitle>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              )}
            </div>
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {getStatusText(project.status)}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              المحتوى
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              المهام ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              التعليقات ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <Upload className="h-4 w-4" />
              الملفات ({files.length})
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">محتوى المشروع</h3>
                {isOwner && (
                  <Button onClick={handleSaveContent} size="sm" className="gap-2">
                    <Save className="h-4 w-4" />
                    حفظ
                  </Button>
                )}
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب محتوى مشروعك هنا..."
                rows={15}
                disabled={!isOwner}
                className="min-h-[400px]"
              />
            </div>

            {/* Status Controls */}
            {isOwner && (
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={project.status === 'in_progress'}
                >
                  بدء العمل
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleStatusChange('completed')}
                  disabled={project.status === 'completed' || progressPercentage < 100}
                >
                  إكمال المشروع
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">قائمة المهام الثابتة</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>التقدم: {progressPercentage}%</span>
                <span>مكتملة: {completedTasks} من 5</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Fixed Tasks List */}
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <Card key={task.id} className={task.is_completed ? 'bg-muted/50' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {task.order_index}
                        </div>
                        <Checkbox
                          checked={task.is_completed}
                          onCheckedChange={(checked) => 
                            handleTaskToggle(task.id, checked as boolean)
                          }
                          disabled={!isOwner}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        {task.completed_at && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>تم الإكمال: {new Date(task.completed_at).toLocaleDateString('en-GB')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">جاري تحميل المهام...</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">التعليقات والملاحظات</h3>
            </div>

            {/* Add Comment Form */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Textarea
                  placeholder="اكتب تعليقك هنا..."
                  value={newComment.comment_text}
                  onChange={(e) => setNewComment(prev => ({ ...prev, comment_text: e.target.value }))}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {isTeacher && (
                      <Checkbox
                        checked={newComment.is_private}
                        onCheckedChange={(checked) => 
                          setNewComment(prev => ({ ...prev, is_private: checked as boolean }))
                        }
                      />
                    )}
                    {isTeacher && <span className="text-sm">ملاحظة خاصة</span>}
                  </div>
                  <Button onClick={handleAddComment} disabled={!newComment.comment_text.trim()}>
                    إرسال التعليق
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {comment.user_id === userProfile?.user_id ? 'أنت' : 'المعلم'}
                        </span>
                        {comment.is_private && (
                          <Badge variant="secondary" className="text-xs">خاص</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('en-GB')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.comment_text}</p>
                  </CardContent>
                </Card>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">لا توجد تعليقات بعد</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">الملفات المرفقة</h3>
              {isOwner && (
                <div>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <Button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    size="sm" 
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    رفع ملف
                  </Button>
                </div>
              )}
            </div>

            {/* Files List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {file.is_image ? (
                          <img 
                            src={file.file_path} 
                            alt={file.alt_text || file.file_name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{file.file_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'غير محدد'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {files.length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">لا توجد ملفات مرفقة</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditor;