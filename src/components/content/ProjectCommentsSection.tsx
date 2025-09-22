import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Clock, Eye, EyeOff, Send, Loader2, Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useProjectComments } from '@/hooks/useProjectComments';
import { cn } from '@/lib/utils';

interface ProjectCommentsSectionProps {
  projectId: string;
  className?: string;
}

export const ProjectCommentsSection: React.FC<ProjectCommentsSectionProps> = ({ 
  projectId, 
  className 
}) => {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<string>('comment');
  
  const { user } = useAuth();
  const {
    comments,
    isLoading,
    isSubmitting,
    error,
    unreadCount,
    addComment,
    markAsRead,
    markAllAsRead
  } = useProjectComments({ projectId, enabled: !!projectId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const success = await addComment(newComment, commentType as 'comment' | 'feedback' | 'grade');
    if (success) {
      setNewComment('');
      setCommentType('comment');
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback':
        return <MessageCircle className="h-4 w-4" />;
      case 'grade':
        return <Star className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'feedback':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'grade': 
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch (type) {
      case 'feedback':
        return 'ملاحظة';
      case 'grade':
        return 'تقييم';
      default:
        return 'تعليق';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher':
      case 'school_admin':
      case 'superadmin':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'student':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'معلم';
      case 'school_admin':
        return 'مدير مدرسة';
      case 'superadmin':
        return 'مدير عام';
      case 'student':
        return 'طالب';
      default:
        return 'مستخدم';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>جاري تحميل التعليقات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            التعليقات والملاحظات
            {comments.length > 0 && (
              <Badge variant="secondary" className="mr-2">
                {comments.length}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {unreadCount} جديد
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                تحديد الكل كمقروء
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* قائمة التعليقات */}
        <ScrollArea className="h-96">
          <div className="space-y-4 pr-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>لا توجد تعليقات بعد</p>
                <p className="text-sm">كن أول من يضيف تعليقاً على هذا المشروع</p>
              </div>
            ) : (
              comments.map((comment) => {
                const isOwn = comment.created_by === user?.id;
                const isUnread = !comment.is_read && !isOwn;
                
                return (
                  <div
                    key={comment.id}
                    className={cn(
                      "relative p-4 rounded-lg border transition-all",
                      isOwn 
                        ? "bg-primary/5 border-primary/20 mr-4" 
                        : "bg-muted/30 border-muted ml-4",
                      isUnread && "ring-2 ring-blue-500/20 bg-blue-50"
                    )}
                    onClick={() => isUnread && markAsRead(comment.id)}
                  >
                    <div className="flex items-start gap-3">
                      <UniversalAvatar
                        avatarUrl={comment.author?.avatar_url}
                        userName={comment.author?.full_name}
                        size="sm"
                        className="shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {comment.author?.full_name || 'مستخدم غير معروف'}
                          </span>
                          
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getRoleColor(comment.author?.role || 'student'))}
                          >
                            {getRoleLabel(comment.author?.role || 'student')}
                          </Badge>
                          
                          <Badge 
                            variant="outline"
                            className={cn("text-xs", getCommentTypeColor(comment.comment_type))}
                          >
                            {getCommentTypeIcon(comment.comment_type)}
                            <span className="mr-1">{getCommentTypeLabel(comment.comment_type)}</span>
                          </Badge>
                          
                          {isUnread && (
                            <Badge variant="destructive" className="text-xs">
                              <EyeOff className="h-3 w-3 ml-1" />
                              جديد
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-foreground leading-relaxed mb-2">
                          {comment.comment}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: ar
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* نموذج إضافة تعليق جديد */}
        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Select value={commentType} onValueChange={setCommentType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment">تعليق</SelectItem>
                  <SelectItem value="feedback">ملاحظة</SelectItem>
                  <SelectItem value="grade">تقييم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقك هنا..."
              className="min-h-20 resize-none"
              disabled={isSubmitting}
            />
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500 حرف
              </span>
              
              <Button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
              </Button>
            </div>
          </form>
        )}
        
        {!user && (
          <div className="text-center py-4 text-muted-foreground">
            <p>يجب تسجيل الدخول لإضافة تعليق</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};