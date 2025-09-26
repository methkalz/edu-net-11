import React, { useState } from 'react';
import { Users, ChevronDown, Eye, EyeOff, Clock, Wifi, RadioIcon, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudentPresence } from '@/hooks/useStudentPresence';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StudentPresenceWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const StudentPresenceWidget: React.FC<StudentPresenceWidgetProps> = ({
  isOpen,
  onToggle
}) => {
  const {
    onlineStudents,
    classes,
    selectedClasses,
    loading,
    toggleClassSelection,
    clearClassSelection
  } = useStudentPresence();

  const [showClassFilter, setShowClassFilter] = useState(false);

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

  const getStudentStatus = (lastSeenAt: string) => {
    const now = Date.now();
    const lastSeen = new Date(lastSeenAt).getTime();
    const timeDiff = now - lastSeen;
    
    const oneMinute = 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeDiff <= oneMinute) {
      return { status: 'online', color: 'text-green-500', bgColor: 'bg-green-500/20', icon: RadioIcon };
    } else if (timeDiff <= fiveMinutes) {
      return { status: 'recent', color: 'text-orange-500', bgColor: 'bg-orange-500/20', icon: Timer };
    } else {
      return { status: 'offline', color: 'text-muted-foreground', bgColor: 'bg-muted/20', icon: Clock };
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
        <Button
          onClick={onToggle}
          size="lg"
          className="rounded-full shadow-xl bg-primary/90 backdrop-blur-sm hover:bg-primary hover:scale-105 text-primary-foreground transition-all duration-300 border border-primary/20"
        >
          <Users className="h-5 w-5 ml-2" />
          <span className="mx-2">المتواجدون الآن</span>
          <Badge variant="secondary" className="mr-2 bg-secondary/80 backdrop-blur-sm">
            {onlineStudents.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50 w-96 animate-scale-in">
        <Card className="shadow-2xl border border-border/20 bg-background/10 backdrop-blur-xl">
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">المتواجدون الآن</h3>
              <Badge variant="secondary" className="bg-secondary/20 backdrop-blur-sm border border-secondary/30">
                {onlineStudents.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClassFilter(!showClassFilter)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showClassFilter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
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

          {/* فلتر الصفوف */}
          <Collapsible open={showClassFilter} onOpenChange={setShowClassFilter}>
            <CollapsibleContent className="space-y-2">
              <Separator className="bg-border/30" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">فلترة حسب الصف:</span>
                  {selectedClasses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearClassSelection}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      مسح الكل
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {classes.map(classInfo => (
                    <Badge
                      key={classInfo.id}
                      variant={selectedClasses.includes(classInfo.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-all duration-200 hover:scale-105 bg-background/20 backdrop-blur-sm"
                      onClick={() => toggleClassSelection(classInfo.id)}
                    >
                      {classInfo.name} - {classInfo.grade_level}
                      <span className="mr-1 text-xs opacity-70">
                        ({classInfo.student_count})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground animate-fade-in">
              جاري التحميل...
            </div>
          ) : onlineStudents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground animate-fade-in">
              لا يوجد طلاب متواجدون حاليا
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {onlineStudents.map(student => {
                  const studentStatus = getStudentStatus(student.last_seen_at);
                  
                  return (
                    <Tooltip key={student.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/20 backdrop-blur-sm border border-border/20 hover:bg-background/30 hover:border-border/40 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 backdrop-blur-sm flex items-center justify-center border border-primary/20">
                                <span className="text-sm font-medium text-primary">
                                  {student.student.full_name.charAt(0)}
                                </span>
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background/80 backdrop-blur-sm ${studentStatus.bgColor} transition-colors duration-300`}>
                                <div className={`w-full h-full rounded-full ${
                                  studentStatus.status === 'online' ? 'bg-green-500 animate-pulse' : ''
                                }`} />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
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
                            <div className={`flex items-center gap-1 ${studentStatus.color} transition-colors duration-300`}>
                              <studentStatus.icon className="h-3 w-3" />
                              <span className="text-xs">
                                {studentStatus.status === 'online' 
                                  ? 'متصل' 
                                  : studentStatus.status === 'recent'
                                  ? 'انقطع حديثاً'
                                  : formatLastSeen(student.last_seen_at)
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="bg-background/90 backdrop-blur-sm border border-border/20">
                        <div className="space-y-1">
                          <p className="font-medium">{student.student.full_name}</p>
                          {student.class_info && (
                            <p className="text-xs text-muted-foreground">
                              {student.class_info.class_name} - {student.class_info.grade_level}
                            </p>
                          )}
                          <p className="text-xs">
                            آخر ظهور: {formatLastSeen(student.last_seen_at)}
                          </p>
                          <p className="text-xs">
                            الحالة: {studentStatus.status === 'online' 
                              ? 'متصل الآن' 
                              : studentStatus.status === 'recent'
                              ? 'انقطع حديثاً'
                              : 'غير متصل'
                            }
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};