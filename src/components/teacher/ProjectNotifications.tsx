import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  MessageCircle, 
  Eye, 
  X, 
  CheckCheck, 
  Clock,
  User,
  FileText,
  Send,
  AlertCircle
} from 'lucide-react';
import { useProjectNotifications } from '@/hooks/useProjectNotifications';
import { useTeacherProjects } from '@/hooks/useTeacherProjects';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const ProjectNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification
  } = useProjectNotifications();
  
  const { addComment } = useTeacherProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/grade12-project-editor/${projectId}?tab=comments`);
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

  const recentNotifications = notifications.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              الإشعارات
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              تعليقات جديدة وتحديثات المشاريع
            </CardDescription>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد إشعارات</p>
              <p className="text-sm">ستظهر هنا الإشعارات الجديدة من الطلاب</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                    !notification.is_read 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-background hover:bg-muted/50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-shrink-0">
                          {notification.notification_type === 'new_comment' ? (
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {notification.title}
                        </h4>
                        
                        {!notification.is_read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {notification.student_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {notification.project_title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProject(notification.project_id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(notification.project_id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>رد سريع على التعليق</DialogTitle>
                            <DialogDescription>
                              مشروع: {notification.project_title} - طالب: {notification.student_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="اكتب ردك هنا..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setReplyText('');
                                  setSelectedProject(null);
                                }}
                              >
                                إلغاء
                              </Button>
                              <Button
                                onClick={handleQuickReply}
                                disabled={!replyText.trim() || sendingReply}
                              >
                                {sendingReply ? (
                                  <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    جارٍ الإرسال...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    إرسال الرد
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 10 && (
          <div className="text-center pt-4">
            <Separator className="mb-4" />
            <Button variant="link" className="text-xs text-muted-foreground">
              عرض جميع الإشعارات ({notifications.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectNotifications;