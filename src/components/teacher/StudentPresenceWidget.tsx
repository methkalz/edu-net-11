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
        <div className="group flex items-center gap-3 p-3 rounded-2xl transition-all duration-500 cursor-pointer backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-primary/5 hover:scale-[1.02]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full backdrop-blur-sm bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20 transition-all duration-500 group-hover:border-white/40 group-hover:shadow-lg group-hover:shadow-primary/10">
              <span className="text-sm font-bold text-foreground/90">
                {student.student.full_name.charAt(0)}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full backdrop-blur-sm border-2 border-white/30 flex items-center justify-center transition-all duration-500 ${
              studentStatus.status === 'online' 
                ? 'bg-emerald-500/90 shadow-lg shadow-emerald-500/50' 
                : studentStatus.status === 'recent' 
                ? 'bg-amber-500/90 shadow-lg shadow-amber-500/50' 
                : 'bg-muted-foreground/30'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                studentStatus.status === 'online' 
                  ? 'bg-white animate-pulse' 
                  : studentStatus.status === 'recent' 
                  ? 'bg-white/90' 
                  : 'bg-white/50'
              }`} />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground/90 truncate mb-1">
              {student.student.full_name}
            </p>
            {student.class_info && (
              <p className="text-xs text-muted-foreground/80">
                {student.class_info.class_name} • {student.class_info.grade_level}
              </p>
            )}
          </div>

          <div className={`text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
            studentStatus.status === 'online' 
              ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' 
              : studentStatus.status === 'recent' 
              ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' 
              : 'bg-muted/20 text-muted-foreground/70 border border-muted/30'
          }`}>
            {studentStatus.label}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="backdrop-blur-2xl bg-white/90 dark:bg-black/90 border border-white/20 shadow-2xl max-w-xs rounded-2xl">
        <div className="space-y-3 p-2">
          <p className="font-bold text-sm text-foreground">{student.student.full_name}</p>
          {student.class_info && (
            <p className="text-xs text-muted-foreground/80 flex items-center gap-1">
              📚 {student.class_info.class_name} • {student.class_info.grade_level}
            </p>
          )}
          <Separator className="opacity-30" />
          <div className="space-y-2">
            <p className="text-xs">
              <span className="text-muted-foreground/70">آخر ظهور:</span> 
              <span className="font-medium mr-1">{formatLastSeen(student.last_seen_at)}</span>
            </p>
            <p className="text-xs">
              <span className="text-muted-foreground/70">الحالة:</span> 
              <span className={`mr-1 font-semibold ${studentStatus.color}`}>
                {studentStatus.label}
              </span>
            </p>
            {student.current_page && (
              <p className="text-xs">
                <span className="text-muted-foreground/70">الصفحة:</span> 
                <span className="font-medium mr-1">{student.current_page}</span>
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
          className="relative rounded-full shadow-2xl backdrop-blur-2xl bg-white/10 hover:bg-white/20 text-foreground border border-white/20 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:shadow-primary/20"
        >
          <Users className="h-5 w-5 ml-2" />
          <span className="mx-3 font-bold">المتواجدون الآن</span>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-600">{actualOnlineCount}</span>
            </div>
            {totalVisibleCount > actualOnlineCount && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm bg-amber-500/20 border border-amber-500/30">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-amber-600">+{totalVisibleCount - actualOnlineCount}</span>
              </div>
            )}
          </div>
          
          {refreshing && (
            <div className="absolute -top-2 -right-2 w-4 h-4">
              <div className="w-full h-full rounded-full bg-primary/60 animate-ping"></div>
              <div className="absolute inset-1 w-2 h-2 rounded-full bg-primary"></div>
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50 w-[440px] animate-scale-in">
        <Card className="shadow-2xl backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 space-y-4 bg-gradient-to-r from-white/5 to-transparent">
            {/* Header العلوي */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground/90">المتواجدون الآن</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground/80 mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span>متصل: {actualOnlineCount}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span>غادر حديثاً: {totalVisibleCount - actualOnlineCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {refreshing && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse"></div>
                    <span className="text-xs text-muted-foreground/70">تحديث...</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="text-muted-foreground hover:text-foreground backdrop-blur-sm hover:bg-white/10 rounded-xl"
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                placeholder="البحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 pl-12 h-12 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-white/15 transition-all duration-300"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 backdrop-blur-sm hover:bg-white/10 rounded-xl"
                >
                  <X className="h-4 w-4" />
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
                <div className="flex flex-wrap gap-2">
                  {classes.map(classInfo => (
                    <button
                      key={classInfo.id}
                      className={`group relative overflow-hidden rounded-xl px-3 py-2 text-xs font-medium transition-all duration-300 border backdrop-blur-sm ${
                        selectedClasses.includes(classInfo.id)
                          ? 'bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/10'
                          : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-foreground'
                      }`}
                      onClick={() => toggleClassSelection(classInfo.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-semibold leading-tight">
                            {classInfo.name}
                          </div>
                          <div className="text-xs opacity-70 leading-tight">
                            {classInfo.grade_level}
                          </div>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded-md text-xs font-bold backdrop-blur-sm ${
                          selectedClasses.includes(classInfo.id)
                            ? 'bg-primary/30 text-primary'
                            : 'bg-white/10 text-muted-foreground/80'
                        }`}>
                          {classInfo.student_count}
                        </div>
                      </div>
                      
                      {/* تأثير الـ hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    </button>
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
                <div className="space-y-3 pr-4">
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