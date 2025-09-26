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
      case 'online': return 'text-green-600';
      case 'away': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: StudentPresence['status']) => {
    switch (status) {
      case 'online': return (
        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse shadow-sm"></div>
      );
      case 'away': return (
        <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-background shadow-sm"></div>
      );
      default: return (
        <div className="w-3 h-3 bg-muted-foreground/40 rounded-full border-2 border-background shadow-sm"></div>
      );
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
    <div className="group flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/50">
      <div className="relative">
        <UniversalAvatar 
          userName={student.full_name}
          size="sm"
          className="w-10 h-10 ring-2 ring-background shadow-sm"
        />
        <div className="absolute -bottom-0.5 -right-0.5">
          {getStatusIcon(student.status)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {student.full_name}
          </p>
          {showClass && student.class_name && student.class_name !== 'غير محدد' && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
              {student.class_name}
            </Badge>
          )}
        </div>
        <p className={cn("text-xs font-medium", getStatusColor(student.status))}>
          {getLastActiveText()}
        </p>
      </div>
    </div>
  );
};

const TeacherStudentsPresence: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
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
        // الأيقونة العائمة المطوية - تصميم محسن
        <Button
          onClick={() => setIsExpanded(true)}
          className="relative rounded-full w-16 h-16 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl border-2 border-primary/20 transition-all duration-300 hover:scale-105"
          size="icon"
        >
          <div className="flex flex-col items-center justify-center">
            <Users className="w-6 h-6 mb-0.5" />
            <span className="text-xs font-medium">{totalCount}</span>
          </div>
          {onlineCount > 0 && (
            <div className="absolute -top-1 -right-1 flex items-center gap-1">
              <Badge className="w-5 h-5 p-0 flex items-center justify-center bg-green-500 hover:bg-green-500 text-xs border-2 border-background animate-pulse">
                {onlineCount}
              </Badge>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
          )}
        </Button>
      ) : (
        // اللوحة الموسعة - تصميم محسن ومينيماليست
        <Card className="w-[420px] max-h-[650px] shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-xl flex items-center gap-3 font-semibold">
                <div className="relative">
                  <Users className="w-6 h-6 text-primary" />
                  {onlineCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                  )}
                </div>
                الطلاب المتواجدون
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-9 w-9 rounded-full hover:bg-muted/50 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>

            {/* إحصائيات سريعة */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-600">{onlineCount} متواجد</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-yellow-600">{awayCount} بعيد</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                <span className="font-medium text-muted-foreground">{totalCount - onlineCount - awayCount} غير متواجد</span>
              </div>
            </div>
            
            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الطلاب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-border/40 focus:border-primary/40 bg-background/50"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mx-4 mb-4 bg-muted/30 h-11">
                <TabsTrigger value="all" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  الكل ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="online" className="text-sm font-medium text-green-600 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  متواجد ({onlineCount})
                </TabsTrigger>
                <TabsTrigger value="away" className="text-sm font-medium text-yellow-600 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  بعيد ({awayCount})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-96">
                <TabsContent value="online" className="mt-0">
                  <div className="px-4">
                    {isLoading ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
                        جاري التحميل...
                      </div>
                    ) : onlineStudents.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
                          <WifiOff className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="font-medium">لا يوجد طلاب متواجدون حالياً</p>
                        <p className="text-xs mt-1">سيظهر الطلاب هنا عند دخولهم للنظام</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(
                          onlineStudents.reduce((acc, student) => {
                            const classKey = student.class_name || 'غير محدد';
                            if (!acc[classKey]) acc[classKey] = [];
                            acc[classKey].push(student);
                            return acc;
                          }, {} as Record<string, StudentPresence[]>)
                        ).map(([className, classStudents]) => (
                          <div key={className} className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                {className}
                              </h4>
                              <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                {(classStudents as StudentPresence[]).length} متواجد
                              </Badge>
                            </div>
                            {(classStudents as StudentPresence[]).map(student => (
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
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
                          <Clock className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="font-medium">لا يوجد طلاب بعيدون حالياً</p>
                        <p className="text-xs mt-1">الطلاب الذين لم يكونوا نشطين مؤخراً</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {awayStudents.map(student => (
                          <StudentItem key={student.id} student={student} />
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="all" className="mt-0">
                  <div className="px-4">
                    {isLoading ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                        جاري التحميل...
                      </div>
                    ) : allFilteredStudents.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(
                          allFilteredStudents.reduce((acc, student) => {
                            const classKey = student.class_name || 'غير محدد';
                            if (!acc[classKey]) acc[classKey] = [];
                            acc[classKey].push(student);
                            return acc;
                          }, {} as Record<string, StudentPresence[]>)
                        ).map(([className, classStudents]) => (
                          <div key={className} className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                {className}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {(classStudents as StudentPresence[]).length}
                              </Badge>
                            </div>
                            {(classStudents as StudentPresence[]).map(student => (
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