import React, { useState, memo } from 'react';
import { Users, ChevronDown, Filter, Clock, Wifi, WifiOff, Timer, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useStudentPresence } from '@/hooks/useStudentPresence';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StudentPresenceWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

// مكون فردي للطالب مع memo لمنع re-render غير ضروري
const StudentCard = memo(({ student }: { student: any }) => {
  const formatLastSeen = (lastSeenAt: string) => {
    try {
      return formatDistanceToNow(new Date(lastSeenAt), {
        addSuffix: true,
        locale: ar
      });
    } catch {
      return 'غير معروف';
    }
  };

  const getStudentStatus = (lastSeenAt: string, isOnline: boolean) => {
    const now = Date.now();
    const lastSeen = new Date(lastSeenAt).getTime();
    const timeDiff = now - lastSeen;
    
    const oneMinute = 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (isOnline && timeDiff <= oneMinute) {
      return { 
        status: 'online', 
        color: 'text-emerald-500', 
        bgColor: 'bg-emerald-500/10 border-emerald-500/20', 
        icon: Wifi,
        label: 'متصل الآن',
        pulse: true
      };
    } else if (timeDiff <= fiveMinutes) {
      return { 
        status: 'recent', 
        color: 'text-amber-500', 
        bgColor: 'bg-amber-500/10 border-amber-500/20', 
        icon: Timer,
        label: 'غادر الآن',
        pulse: false
      };
    } else {
      return { 
        status: 'offline', 
        color: 'text-muted-foreground', 
        bgColor: 'bg-muted/5 border-muted/10', 
        icon: WifiOff,
        label: 'غير متصل',
        pulse: false
      };
    }
  };

  const studentStatus = getStudentStatus(student.last_seen_at, student.is_online);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`group flex items-center justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer border ${studentStatus.bgColor} hover:shadow-md hover:scale-[1.01] hover:border-primary/20`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center border border-primary/20 transition-all duration-300 group-hover:border-primary/40">
                <span className="text-sm font-semibold text-primary">
                  {student.student.full_name.charAt(0)}
                </span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background ${studentStatus.bgColor} flex items-center justify-center transition-all duration-300`}>
                <div className={`w-2 h-2 rounded-full ${
                  studentStatus.status === 'online' 
                    ? 'bg-emerald-500' + (studentStatus.pulse ? ' animate-pulse' : '') 
                    : studentStatus.status === 'recent' 
                    ? 'bg-amber-500' 
                    : 'bg-muted-foreground/50'
                }`} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate mb-0.5">
                {student.student.full_name}
              </p>
              {student.class_info && (
                <p className="text-xs text-muted-foreground">
                  {student.class_info.class_name} - {student.class_info.grade_level}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${studentStatus.color} transition-colors duration-300`}>
              <studentStatus.icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {studentStatus.label}
              </span>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-popover/95 backdrop-blur-sm border border-border/50 shadow-lg max-w-xs">
        <div className="space-y-2">
          <p className="font-semibold text-sm">{student.student.full_name}</p>
          {student.class_info && (
            <p className="text-xs text-muted-foreground">
              📚 {student.class_info.class_name} - {student.class_info.grade_level}
            </p>
          )}
          <Separator className="opacity-50" />
          <div className="space-y-1">
            <p className="text-xs">
              <span className="text-muted-foreground">آخر ظهور:</span> {formatLastSeen(student.last_seen_at)}
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground">الحالة:</span> 
              <span className={`mr-1 font-medium ${studentStatus.color}`}>
                {studentStatus.label}
              </span>
            </p>
            {student.current_page && (
              <p className="text-xs">
                <span className="text-muted-foreground">الصفحة:</span> {student.current_page}
              </p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

StudentCard.displayName = 'StudentCard';

export const StudentPresenceWidget: React.FC<StudentPresenceWidgetProps> = memo(({
  isOpen,
  onToggle
}) => {
  const {
    allVisibleStudents,
    actualOnlineCount,
    totalVisibleCount,
    classes,
    selectedClasses,
    loading,
    refreshing,
    lastUpdated,
    toggleClassSelection,
    clearClassSelection
  } = useStudentPresence();

  const [showClassFilter, setShowClassFilter] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const formatLastSeen = (lastSeenAt: string) => {
    try {
      return formatDistanceToNow(new Date(lastSeenAt), {
        addSuffix: true,
        locale: ar
      });
    } catch {
      return 'غير معروف';
    }
  };

  // فلترة الطلاب حسب البحث
  const filteredStudents = React.useMemo(() => {
    if (!searchQuery.trim()) return allVisibleStudents;
    
    return allVisibleStudents.filter(student => 
      student.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.class_info?.class_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.class_info?.grade_level.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allVisibleStudents, searchQuery]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onToggle}
          size="lg"
          className="relative rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 border border-primary/20 hover:scale-105 backdrop-blur-sm"
        >
          <Users className="h-5 w-5 ml-2" />
          <span className="mx-3 font-medium">المتواجدون الآن</span>
          
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/20 backdrop-blur-sm">
              {actualOnlineCount}
            </Badge>
            {totalVisibleCount > actualOnlineCount && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/20 backdrop-blur-sm">
                +{totalVisibleCount - actualOnlineCount}
              </Badge>
            )}
          </div>
          
          {refreshing && (
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <div className="w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75"></div>
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50 w-[420px] animate-scale-in">
        <Card className="shadow-2xl border border-border/30 bg-background/95 backdrop-blur-xl">
          <CardHeader className="pb-4 space-y-4">
            {/* Header العلوي */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">المتواجدون الآن</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>متصل: {actualOnlineCount}</span>
                    <span>•</span>
                    <span>غادر حديثاً: {totalVisibleCount - actualOnlineCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {refreshing && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                )}
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                    {formatLastSeen(lastUpdated.toISOString())}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-10 h-9 bg-background/50 border-border/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* فلتر الصفوف المحسن */}
            <Collapsible open={showClassFilter} onOpenChange={setShowClassFilter}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-sm font-medium hover:bg-primary/5">
                    <Filter className="h-4 w-4" />
                    <span>فلترة حسب الصف</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showClassFilter ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                
                {selectedClasses.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearClassSelection}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    مسح الكل ({selectedClasses.length})
                  </Button>
                )}
              </div>
              
              <CollapsibleContent className="mt-3">
                <div className="grid grid-cols-2 gap-2">
                  {classes.map(classInfo => (
                    <Badge
                      key={classInfo.id}
                      variant={selectedClasses.includes(classInfo.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-all duration-200 hover:scale-[1.02] justify-between p-2 h-auto"
                      onClick={() => toggleClassSelection(classInfo.id)}
                    >
                      <div className="text-right">
                        <div className="font-medium text-xs">
                          {classInfo.name}
                        </div>
                        <div className="text-xs opacity-70">
                          {classInfo.grade_level}
                        </div>
                      </div>
                      <div className="text-xs bg-background/20 rounded px-1.5 py-0.5">
                        {classInfo.student_count}
                      </div>
                    </Badge>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>

          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  <span className="text-sm">جاري التحميل...</span>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <div className="space-y-2">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">لا توجد نتائج للبحث "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">لا يوجد طلاب متواجدون حالياً</p>
                  </div>
                )}
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="space-y-2 pr-4">
                  {filteredStudents.map(student => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
});

StudentPresenceWidget.displayName = 'StudentPresenceWidget';