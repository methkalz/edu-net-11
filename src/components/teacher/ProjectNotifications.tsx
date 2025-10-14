import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Bell, MessageCircle, Eye, X, CheckCheck, Clock, User, FileText, Send, AlertCircle, Settings } from 'lucide-react';
import { useProjectNotifications } from '@/hooks/useProjectNotifications';
import { useTeacherProjects } from '@/hooks/useTeacherProjects';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
interface ProjectNotificationsProps {
  gradeFilter?: '10' | '12';
  title?: string;
}
const ProjectNotifications: React.FC<ProjectNotificationsProps> = ({
  gradeFilter,
  title = 'الإشعارات'
}) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification
  } = useProjectNotifications();
  const {
    addComment
  } = useTeacherProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
  };
  const handleViewProject = (projectId: string) => {
    // Navigate based on gradeFilter 
    if (gradeFilter === '10') {
      navigate(`/grade10-project-editor/${projectId}?tab=comments`);
    } else if (gradeFilter === '12') {
      navigate(`/grade12-project-editor/${projectId}?tab=comments`);
    } else {
      // Default to grade 12 if no filter specified
      navigate(`/grade12-project-editor/${projectId}?tab=comments`);
    }
  };
  const handleQuickReply = async () => {
    if (!selectedProject || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const success = await addComment(selectedProject, replyText, 'teacher_reply');
      if (success) {
        setReplyText('');
        setSelectedProject(null);
        toast({
          title: 'تم إرسال الرد',
          description: 'تم إرسال ردك على التعليق بنجاح'
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSendingReply(false);
    }
  };

  // Filter notifications by grade if gradeFilter is provided
  const filteredNotifications = gradeFilter 
    ? notifications.filter(notification => notification.grade_level === gradeFilter)
    : notifications;
  
  // حساب عدد الإشعارات غير المقروءة للصف المُفلتر
  const filteredUnreadCount = filteredNotifications.filter(n => !n.is_read).length;
  
  const recentNotifications = filteredNotifications.slice(0, 10);

  // Debug: تتبع التغييرات في البيانات
  useEffect(() => {
    console.log('🎯 [Effect] notifications changed:', notifications.length);
    console.log('🎯 [Effect] filtered:', filteredNotifications.length);
    console.log('🎯 [Effect] recent:', recentNotifications.length);
  }, [notifications, filteredNotifications, recentNotifications]);

  console.log('🎯 [Render] notifications:', notifications.length, 'filtered:', filteredNotifications.length, 'recent:', recentNotifications.length);
  
  return <Card className="border border-divider/60 bg-gradient-to-br from-surface-light to-card shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/5 to-orange-500/10 flex items-center justify-center border-2 border-orange-500/15">
              <Bell className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                {title}
                {filteredUnreadCount > 0 && <Badge variant="destructive" className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600 border-2 border-red-200/60">
                    {filteredUnreadCount}
                  </Badge>}
              </CardTitle>
              <CardDescription className="text-sm text-text-soft">
                تعليقات وتحديثات المشاريع
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {filteredUnreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs h-8 px-3 border-divider/60 hover:bg-surface-hover">
                <CheckCheck className="h-4 w-4 mr-1" />
                تحديد الكل كمقروء
              </Button>}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-surface-hover">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 text-center">
        <ScrollArea className="h-80">
          {loading ? <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>)}
            </div> : recentNotifications.length === 0 ? <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2 text-center">لا توجد إشعارات</h3>
              <p className="text-sm text-muted-foreground text-center">
                ستظهر هنا الإشعارات الجديدة من الطلاب
              </p>
            </div> : <div className="space-y-3">
              {recentNotifications.map(notification => <div key={notification.id} className={`relative p-4 rounded-xl border transition-all hover:shadow-sm cursor-pointer group ${!notification.is_read ? 'bg-muted/30 border-primary/20' : 'bg-card hover:bg-muted/30 border-border'}`} onClick={() => handleNotificationClick(notification)}>
                  {!notification.is_read && <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></div>}
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      {notification.notification_type === 'new_comment' ? <MessageCircle className="h-5 w-5 text-primary" /> : <AlertCircle className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {notification.title}
                        </h4>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {notification.student_name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {notification.project_title}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ar
                    })}
                        </span>
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={e => {
                  e.stopPropagation();
                  handleViewProject(notification.project_id);
                }} className="h-8 w-8 p-0 hover:bg-primary/10">
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={e => {
                      e.stopPropagation();
                      setSelectedProject(notification.project_id);
                    }} className="h-8 w-8 p-0 hover:bg-green-100">
                            <Send className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>رد سريع على التعليق</DialogTitle>
                            <DialogDescription>
                              مشروع: {notification.project_title} - طالب: {notification.student_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea placeholder="اكتب ردك هنا..." value={replyText} onChange={e => setReplyText(e.target.value)} className="min-h-[100px] resize-none" />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => {
                          setReplyText('');
                          setSelectedProject(null);
                        }}>
                                إلغاء
                              </Button>
                              <Button onClick={handleQuickReply} disabled={!replyText.trim() || sendingReply} className="bg-primary hover:bg-primary/90">
                                {sendingReply ? <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    جارٍ الإرسال...
                                  </> : <>
                                    <Send className="h-4 w-4 mr-2" />
                                    إرسال الرد
                                  </>}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="sm" onClick={e => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>)}
            </div>}
        </ScrollArea>
        
        {notifications.length > 10 && <div className="pt-4 border-t mt-4">
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/notifications')}>
              عرض جميع الإشعارات ({filteredNotifications.length})
            </Button>
          </div>}
      </CardContent>
    </Card>;
};
export default ProjectNotifications;