/**
 * Online Students Widget
 * 
 * Displays currently online students in real-time.
 * Used in teacher and admin dashboards.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Search, 
  Clock, 
  Eye,
  RefreshCw,
  UserCheck,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import { useRealtimePresence, type StudentPresence } from '@/hooks/useRealtimePresence';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OnlineStudentsWidgetProps {
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
  classIds?: string[];
}

export const OnlineStudentsWidget: React.FC<OnlineStudentsWidgetProps> = ({
  className = '',
  maxHeight = '400px',
  showFilters = true,
  classIds = []
}) => {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Get real-time presence data
  const { 
    onlineStudents, 
    allStudents, 
    loading, 
    error, 
    refreshData 
  } = useRealtimePresence({
    schoolId: userProfile?.school_id,
    classIds,
    enabled: !!userProfile?.school_id
  });

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    const studentsToShow = showAllStudents ? allStudents : onlineStudents;
    
    if (!searchQuery.trim()) return studentsToShow;

    const query = searchQuery.toLowerCase().trim();
    return studentsToShow.filter(student => 
      student.full_name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.username?.toLowerCase().includes(query)
    );
  }, [onlineStudents, allStudents, searchQuery, showAllStudents]);

  // Get student status
  const getStudentStatus = (student: StudentPresence) => {
    if (!student.is_online) return 'offline';
    
    const lastSeenTime = new Date(student.last_seen_at);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenTime.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 2) return 'online';
    if (diffMinutes <= 10) return 'idle';
    return 'away';
  };

  // Format current page display
  const formatCurrentPage = (currentPage?: string) => {
    if (!currentPage) return 'غير محدد';
    
    const pageMap: Record<string, string> = {
      '/dashboard': 'الصفحة الرئيسية',
      '/grade10-management': 'الصف العاشر',
      '/grade11-management': 'الصف الحادي عشر',
      '/grade12-management': 'الصف الثاني عشر',
      '/pair-matching': 'لعبة المطابقة',
      '/knowledge-adventure': 'مغامرة المعرفة',
      '/educational-content': 'المحتوى التعليمي'
    };

    return pageMap[currentPage] || currentPage.replace('/', '');
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'idle': return 'secondary';
      case 'away': return 'outline';
      case 'offline': return 'destructive';
      default: return 'outline';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'متواجد';
      case 'idle': return 'خامل';
      case 'away': return 'بعيد';
      case 'offline': return 'غير متواجد';
      default: return 'غير محدد';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            المتواجدين الآن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            المتواجدين الآن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">خطأ في تحميل البيانات</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            المتواجدين الآن
            <Badge variant="secondary" className="ml-1">
              {onlineStudents.length}
            </Badge>
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-2 pt-2">
            <div className="relative">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm pr-8"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={!showAllStudents ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllStudents(false)}
                className="flex-1 text-xs"
              >
                المتواجدين ({onlineStudents.length})
              </Button>
              <Button
                variant={showAllStudents ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllStudents(true)}
                className="flex-1 text-xs"
              >
                الكل ({allStudents.length})
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-full" style={{ maxHeight }}>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-6">
              <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب متواجدين حالياً'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student, index) => {
                const status = getStudentStatus(student);
                const lastSeenTime = formatDistanceToNow(
                  new Date(student.last_seen_at), 
                  { addSuffix: true, locale: ar }
                );

                return (
                  <div key={student.student_id}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                            status === 'online' ? 'bg-green-500' :
                            status === 'idle' ? 'bg-yellow-500' :
                            status === 'away' ? 'bg-orange-500' :
                            'bg-gray-400'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {student.full_name || 'طالب غير محدد'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {lastSeenTime}
                          </div>
                          
                          {student.current_page && student.is_online && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Monitor className="h-3 w-3" />
                              <span className="truncate">
                                {formatCurrentPage(student.current_page)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={getStatusBadgeVariant(status)}
                          className="text-xs px-1.5 py-0.5"
                        >
                          {getStatusText(status)}
                        </Badge>
                      </div>
                    </div>
                    
                    {index < filteredStudents.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default OnlineStudentsWidget;