import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentNotifications } from '@/hooks/useStudentNotifications';
import { 
  Bell, 
  MessageCircle, 
  CheckCircle, 
  Clock,
  BookOpen,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const StudentNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useStudentNotifications();

  const handleNotificationClick = async (notification: any) => {
    // تحديد الإشعار كمقروء
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // الانتقال إلى المشروع مع فتح تاب التعليقات
    if (notification.project_id) {
      navigate(`/grade12-project-editor/${notification.project_id}?tab=comments`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></div>
            <p className="text-sm text-muted-foreground">جاري تحميل الإشعارات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'teacher_comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'project_update':
        return <BookOpen className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'teacher_comment':
        return 'bg-blue-50 border-blue-200';
      case 'project_update':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">لا توجد إشعارات حالياً</p>
            <p className="text-xs text-muted-foreground mt-1">
              ستظهر هنا الإشعارات عند وصول تعليقات من المعلمين
            </p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                    notification.is_read 
                      ? 'bg-white border-gray-200' 
                      : getNotificationColor(notification.notification_type)
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={`text-sm font-medium ${
                          notification.is_read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            جديد
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        notification.is_read ? 'text-gray-500' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ar
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentNotifications;