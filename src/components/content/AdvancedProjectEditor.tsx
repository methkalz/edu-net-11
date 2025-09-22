import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useGrade10MiniProjects } from '@/hooks/useGrade10MiniProjects';
import EnhancedDocumentEditor from './EnhancedDocumentEditor';
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
  MessageSquare,
  Eye,
  EyeOff,
  History,
  Share,
  BookOpen,
  Target,
  Award,
  BarChart3,
  CheckSquare,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdvancedProjectEditorProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  type: 'teacher' | 'student' | 'system';
}

interface ProjectVersion {
  id: string;
  content: string;
  timestamp: string;
  changes: string;
}

const AdvancedProjectEditor: React.FC<AdvancedProjectEditorProps> = ({
  project,
  isOpen,
  onClose,
  onSave
}) => {
  const { userProfile } = useAuth();
  const { 
    updateProjectContent, 
    updateProjectStatus, 
    addComment, 
    tasks, 
    fetchTasks,
    toggleTaskCompletion
  } = useGrade10MiniProjects();
  
  const [content, setContent] = useState(project?.content || '');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();

  // Enhanced auto-save with version history
  useEffect(() => {
    if (!project?.id || content === project?.content) return;

    if (autoSaveIntervalRef.current) {
      clearTimeout(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await updateProjectContent(project.id, content);
        setLastSaved(new Date());
        
        // Save auto version history (max 5 versions)
        const newVersion: ProjectVersion = {
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
        
        toast({
          title: "حُفظ تلقائياً",
          description: "تم حفظ المشروع تلقائياً",
          duration: 2000
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "خطأ في الحفظ التلقائي",
          description: "فشل في الحفظ التلقائي",
          variant: "destructive"
        });
      } finally {
        setIsAutoSaving(false);
      }
    }, 600000); // Auto-save after 10 minutes of inactivity

    return () => {
      if (autoSaveIntervalRef.current) {
        clearTimeout(autoSaveIntervalRef.current);
      }
    };
  }, [content, project?.id, project?.content, updateProjectContent]);

  // Load comments, versions, and tasks
  useEffect(() => {
    if (project?.id) {
      loadComments();
      loadVersionHistory();
      fetchTasks(project.id);
    }
  }, [project?.id, fetchTasks]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('grade10_project_comments')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get user info separately
      const userIds = [...new Set((data || []).map(comment => comment.user_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .in('user_id', userIds);

      if (usersError) throw usersError;

      const userMap = new Map(usersData?.map(user => [user.user_id, user]) || []);

      const formattedComments: Comment[] = (data || []).map(comment => {
        const user = userMap.get(comment.user_id);
        return {
          id: comment.id,
          text: comment.comment_text,
          author: user?.full_name || 'مستخدم',
          timestamp: comment.created_at,
          type: user?.role === 'teacher' || user?.role === 'school_admin' ? 'teacher' : 'student'
        };
      });

      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadVersionHistory = () => {
    // In a real implementation, this would load from a database
    // For now, we'll initialize with current content
    if (project?.content) {
      const initialVersion: ProjectVersion = {
        id: 'initial',
        content: project.content,
        timestamp: project.created_at || new Date().toISOString(),
        changes: 'النسخة الأولية'
      };
      setVersions([initialVersion]);
    }
  };

  const handleSave = async () => {
    if (!project?.id) return;

    try {
      await updateProjectContent(project.id, content);
      setLastSaved(new Date());
      
      // Add to manual version history (max 3 versions)
      const newVersion: ProjectVersion = {
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
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المشروع بنجاح"
      });
      onSave?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ المشروع",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !project?.id) return;

    try {
      await addComment(project.id, {
        comment_text: newComment,
        comment_type: 'comment',
        is_private: false
      });

      const newCommentObj: Comment = {
        id: `temp_${Date.now()}`,
        text: newComment,
        author: userProfile?.full_name || 'أنت',
        timestamp: new Date().toISOString(),
        type: userProfile?.role === 'teacher' || userProfile?.role === 'school_admin' ? 'teacher' : 'student'
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      
      toast({
        title: "تم إضافة التعليق",
        description: "تم إضافة تعليقك بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة التعليق",
        variant: "destructive"
      });
    }
  };

  const restoreVersion = (version: ProjectVersion) => {
    setContent(version.content);
    toast({
      title: "تم استرداد النسخة",
      description: `تم استرداد النسخة من ${new Date(version.timestamp).toLocaleString('en-US')}`
    });
  };


  const calculateProgress = () => {
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
    const hasImages = content.includes('<img');
    const hasTables = content.includes('<table');
    
    let progress = 0;
    if (wordCount > 50) progress += 25;
    if (wordCount > 200) progress += 25;
    if (hasImages) progress += 25;
    if (hasTables || wordCount > 500) progress += 25;
    
    return Math.min(progress, 100);
  };

  const isStudent = userProfile?.role === 'student';
  const canEdit = isStudent && project?.student_id === userProfile?.user_id;
  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'school_admin';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (!project) return null;

  const currentProgress = calculateProgress();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl mb-2">{project.title}</DialogTitle>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(project.status)}>
                  {getStatusText(project.status)}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>التقدم: {currentProgress}%</span>
                  <Progress value={currentProgress} className="w-24 h-2" />
                </div>
                {isAutoSaving && (
                  <Badge variant="outline" className="animate-pulse">
                    جاري الحفظ...
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="gap-2"
                  >
                    {isPreviewMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {isPreviewMode ? 'تحرير' : 'معاينة'}
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="gap-2"
                    disabled={isAutoSaving}
                  >
                    <Save className="h-4 w-4" />
                    {isAutoSaving ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>

                </>
              )}
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
              <TabsTrigger value="editor" className="gap-2">
                <FileText className="h-4 w-4" />
                المحرر
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                المهام ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                التعليقات ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                الإصدارات ({versions.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                الإحصائيات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 overflow-hidden mt-0">
              {canEdit && !isPreviewMode ? (
                <EnhancedDocumentEditor
                  content={content}
                  onChange={setContent}
                  placeholder="ابدأ بكتابة مشروعك هنا... يمكنك إضافة النصوص والجداول والصور واستخدام جميع أدوات التنسيق المتقدمة"
                  autoSave={true}
                  onSave={handleSave}
                />
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-8 max-w-4xl mx-auto">
                    <div 
                      className="prose prose-lg max-w-none"
                      style={{ direction: 'rtl' }}
                      dangerouslySetInnerHTML={{ 
                        __html: content || '<p class="text-muted-foreground text-center py-8">لا يوجد محتوى في هذا المشروع بعد.</p>' 
                      }}
                    />
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="flex-1 overflow-hidden mt-0">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-medium mb-2">المهام الأساسية للمشروع</h3>
                  <p className="text-sm text-muted-foreground">
                    أكمل هذه المهام الخمس لإنجاز مشروعك بنجاح
                  </p>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد مهام بعد</p>
                      </div>
                    ) : (
                      tasks.map((task, index) => (
                        <Card key={task.id} className={`transition-all ${task.is_completed ? 'bg-green-50 border-green-200' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                  {index + 1}
                                </span>
                                <button
                                  onClick={() => toggleTaskCompletion(task.id, !task.is_completed)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    task.is_completed 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'border-gray-300 hover:border-green-500'
                                  }`}
                                  disabled={!canEdit}
                                >
                                  {task.is_completed && <CheckSquare className="w-3 h-3" />}
                                </button>
                              </div>
                              
                              <div className="flex-1">
                                <h4 className={`font-medium mb-1 ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {task.description}
                                  </p>
                                )}
                                {task.completed_at && (
                                  <p className="text-xs text-green-600 mt-2">
                                    تم الإنجاز: {new Date(task.completed_at).toLocaleString('en-US')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      تم إنجاز {tasks.filter(t => t.is_completed).length} من أصل {tasks.length} مهام
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={tasks.length > 0 ? (tasks.filter(t => t.is_completed).length / tasks.length) * 100 : 0} 
                        className="w-24 h-2" 
                      />
                      <span className="text-sm font-medium">
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 overflow-hidden mt-0">
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد تعليقات بعد</p>
                      </div>
                    ) : (
                      comments.map(comment => (
                        <Card key={comment.id} className={`${comment.type === 'teacher' ? 'border-l-4 border-l-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{comment.author}</span>
                                <Badge variant={comment.type === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                                  {comment.type === 'teacher' ? 'معلم' : 'طالب'}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleString('en-US')}
                              </span>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4 bg-muted/30">
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تعليقك هنا..."
                      className="flex-1 min-h-[80px]"
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="self-end"
                    >
                      إرسال
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {versions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد إصدارات محفوظة</p>
                    </div>
                  ) : (
                    versions.map((version, index) => (
                      <Card key={version.id} className={index === 0 ? 'border-primary' : ''}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {index === 0 ? 'النسخة الحالية' : `إصدار ${versions.length - index}`}
                                </span>
                                {index === 0 && <Badge variant="default" className="text-xs">حالي</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{version.changes}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(version.timestamp).toLocaleString('en-US')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {index !== 0 && canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreVersion(version)}
                                  className="text-xs"
                                >
                                  استرداد
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setContent(version.content);
                                  setActiveTab('editor');
                                  setIsPreviewMode(true);
                                }}
                                className="text-xs"
                              >
                                معاينة
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">إحصائيات النص</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>الكلمات:</span>
                          <span className="font-medium">
                            {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>الأحرف:</span>
                          <span className="font-medium">
                            {content.replace(/<[^>]*>/g, '').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>الفقرات:</span>
                          <span className="font-medium">
                            {(content.match(/<p[^>]*>/g) || []).length || 1}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">العناصر المضافة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>الصور:</span>
                          <span className="font-medium">
                            {(content.match(/<img[^>]*>/g) || []).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>الجداول:</span>
                          <span className="font-medium">
                            {(content.match(/<table[^>]*>/g) || []).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>القوائم:</span>
                          <span className="font-medium">
                            {(content.match(/<[ou]l[^>]*>/g) || []).length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">تقدم المشروع</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">اكتمال:</span>
                          <span className="font-medium">{currentProgress}%</span>
                        </div>
                        <Progress value={currentProgress} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {currentProgress < 25 && 'ابدأ بكتابة المحتوى الأساسي'}
                          {currentProgress >= 25 && currentProgress < 50 && 'أضف المزيد من المحتوى'}
                          {currentProgress >= 50 && currentProgress < 75 && 'أضف الصور والجداول'}
                          {currentProgress >= 75 && currentProgress < 100 && 'اكمل التفاصيل النهائية'}
                          {currentProgress === 100 && 'المشروع مكتمل!'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">معلومات المشروع</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
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
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">النشاط</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>عدد التعليقات:</span>
                          <span className="font-medium">{comments.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الإصدارات المحفوظة:</span>
                          <span className="font-medium">{versions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مرات الحفظ:</span>
                          <span className="font-medium">{versions.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">التقييم المقترح</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {currentProgress >= 90 ? 'ممتاز' : 
                             currentProgress >= 75 ? 'جيد جداً' :
                             currentProgress >= 60 ? 'جيد' :
                             currentProgress >= 40 ? 'مقبول' : 'يحتاج تحسين'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {currentProgress >= 90 ? 'مشروع رائع مع محتوى غني ومتنوع' :
                           currentProgress >= 75 ? 'مشروع جيد، يمكن إضافة المزيد من التفاصيل' :
                           currentProgress >= 60 ? 'مشروع مقبول، يحتاج المزيد من المحتوى' :
                           'المشروع في بدايته، يحتاج المزيد من العمل'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              {project.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>موعد التسليم: {new Date(project.due_date).toLocaleDateString('en-US')}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>تم الإنشاء: {new Date(project.created_at).toLocaleDateString('en-US')}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastSaved && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>آخر حفظ: {lastSaved.toLocaleTimeString('en-US')}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>التقدم: {currentProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedProjectEditor;