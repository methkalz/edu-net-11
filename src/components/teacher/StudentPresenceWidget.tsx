import React, { useState } from 'react';
import { Users, ChevronDown, Eye, EyeOff, Clock, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
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

  const isStudentOnline = (lastSeenAt: string) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeenAt) > fiveMinutesAgo;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onToggle}
          size="lg"
          className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Users className="h-5 w-5 ml-2" />
          <span className="mx-2">الطلاب المتواجدون</span>
          <Badge variant="secondary" className="mr-2">
            {onlineStudents.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96">
      <Card className="shadow-xl border-border bg-background/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">الطلاب المتواجدون</h3>
              <Badge variant="secondary">
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
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">فلترة حسب الصف:</span>
                  {selectedClasses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearClassSelection}
                      className="text-xs text-muted-foreground hover:text-foreground"
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
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
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
            <div className="text-center py-4 text-muted-foreground">
              جاري التحميل...
            </div>
          ) : onlineStudents.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              لا يوجد طلاب متواجدون حاليا
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {onlineStudents.map(student => {
                const isOnline = isStudentOnline(student.last_seen_at);
                
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {student.student.full_name.charAt(0)}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
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
                      {isOnline ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Wifi className="h-3 w-3" />
                          <span className="text-xs">متصل</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            {formatLastSeen(student.last_seen_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};