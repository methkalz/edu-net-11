import React, { useState } from 'react';
import { useTeacherStudentsPresence, StudentPresence } from '@/hooks/useTeacherStudentsPresence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UniversalAvatar } from '@/components/shared/UniversalAvatar';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Search, 
  ChevronUp, 
  ChevronDown,
  Wifi,
  WifiOff,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StudentItemProps {
  student: StudentPresence;
  showClass?: boolean;
}

const StudentItem: React.FC<StudentItemProps> = ({ student, showClass = true }) => {
  const getStatusColor = (status: StudentPresence['status']) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: StudentPresence['status']) => {
    switch (status) {
      case 'online': return <Circle className="w-2 h-2 fill-current text-green-500" />;
      case 'away': return <Circle className="w-2 h-2 fill-current text-yellow-500" />;
      default: return <Circle className="w-2 h-2 fill-current text-muted-foreground" />;
    }
  };

  const getLastActiveText = () => {
    if (student.status === 'online') return 'متواجد الآن';
    if (!student.last_active_at) return 'لم يسجل دخول مؤخراً';
    
    try {
      return `آخر تواجد ${formatDistanceToNow(new Date(student.last_active_at), { 
        addSuffix: true, 
        locale: ar 
      })}`;
    } catch (error) {
      return 'آخر تواجد غير محدد';
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <div className="relative">
        <UniversalAvatar 
          userName={student.full_name}
          size="sm"
          className="w-8 h-8"
        />
        <div className="absolute -bottom-0.5 -right-0.5">
          {getStatusIcon(student.status)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {student.full_name}
          </p>
          {showClass && student.class_name && (
            <Badge variant="outline" className="text-xs">
              {student.class_name}
            </Badge>
          )}
        </div>
        <p className={cn("text-xs", getStatusColor(student.status))}>
          {getLastActiveText()}
        </p>
      </div>
    </div>
  );
};

const TeacherStudentsPresence: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('online');
  
  const {
    students,
    studentsByClass,
    onlineCount,
    awayCount,
    totalCount,
    isLoading,
    error
  } = useTeacherStudentsPresence();

  // فلترة الطلاب حسب البحث
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineStudents = filteredStudents.filter(s => s.status === 'online');
  const awayStudents = filteredStudents.filter(s => s.status === 'away');
  const allFilteredStudents = filteredStudents;

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">خطأ في تحميل بيانات الطلاب</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isExpanded ? (
        // الأيقونة العائمة المطوية
        <Button
          onClick={() => setIsExpanded(true)}
          className="relative rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg"
          size="icon"
        >
          <Users className="w-6 h-6" />
          {onlineCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center bg-green-500 hover:bg-green-500"
            >
              {onlineCount}
            </Badge>
          )}
        </Button>
      ) : (
        // اللوحة الموسعة
        <Card className="w-96 max-h-[600px] shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                الطلاب المتواجدون
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            
            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الطلاب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
                <TabsTrigger value="online" className="text-xs">
                  <Wifi className="w-3 h-3 mr-1" />
                  متواجد ({onlineCount})
                </TabsTrigger>
                <TabsTrigger value="away" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  بعيد ({awayCount})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  الكل ({totalCount})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-80">
                <TabsContent value="online" className="mt-0">
                  <div className="px-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        جاري التحميل...
                      </div>
                    ) : onlineStudents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        لا يوجد طلاب متواجدون حالياً
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(
                          onlineStudents.reduce((acc, student) => {
                            const classKey = student.class_name || 'غير محدد';
                            if (!acc[classKey]) acc[classKey] = [];
                            acc[classKey].push(student);
                            return acc;
                          }, {} as Record<string, StudentPresence[]>)
                        ).map(([className, classStudents]) => (
                          <div key={className} className="mb-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                              {className}
                            </h4>
                            {classStudents.map(student => (
                              <StudentItem 
                                key={student.id} 
                                student={student} 
                                showClass={false} 
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="away" className="mt-0">
                  <div className="px-4">
                    {awayStudents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        لا يوجد طلاب بعيدون حالياً
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {awayStudents.map(student => (
                          <StudentItem key={student.id} student={student} />
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="all" className="mt-0">
                  <div className="px-4">
                    {allFilteredStudents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        لا يوجد طلاب
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(
                          allFilteredStudents.reduce((acc, student) => {
                            const classKey = student.class_name || 'غير محدد';
                            if (!acc[classKey]) acc[classKey] = [];
                            acc[classKey].push(student);
                            return acc;
                          }, {} as Record<string, StudentPresence[]>)
                        ).map(([className, classStudents]) => (
                          <div key={className} className="mb-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                              {className} ({classStudents.length})
                            </h4>
                            {classStudents.map(student => (
                              <StudentItem 
                                key={student.id} 
                                student={student} 
                                showClass={false} 
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherStudentsPresence;