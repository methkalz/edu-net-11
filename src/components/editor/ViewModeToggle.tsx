import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Eye, 
  Edit3, 
  FileText, 
  Printer, 
  CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'continuous' | 'page-breaks' | 'print-preview';

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

const viewModes = [
  {
    id: 'continuous' as ViewMode,
    label: 'التحرير المستمر',
    description: 'تحرير سريع ومرن بدون قيود الصفحات',
    icon: Edit3,
  },
  {
    id: 'page-breaks' as ViewMode,
    label: 'معاينة الصفحات',
    description: 'عرض تقريبي لفواصل الصفحات',
    icon: FileText,
  },
  {
    id: 'print-preview' as ViewMode,
    label: 'معاينة الطباعة',
    description: 'معاينة دقيقة لشكل المستند المطبوع',
    icon: Printer,
  },
];

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  currentMode,
  onModeChange,
  className
}) => {
  const currentModeData = viewModes.find(mode => mode.id === currentMode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 min-w-[120px]", className)}
        >
          {currentModeData?.icon && <currentModeData.icon className="h-4 w-4" />}
          <span className="hidden sm:inline">{currentModeData?.label}</span>
          <Eye className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1 text-sm font-medium text-muted-foreground border-b mb-1">
          أنماط العرض
        </div>
        
        {viewModes.map((mode) => (
          <DropdownMenuItem
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "flex items-start gap-3 p-3 cursor-pointer",
              currentMode === mode.id && "bg-accent text-accent-foreground"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              <mode.icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{mode.label}</span>
                {currentMode === mode.id && (
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {mode.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
        
        <div className="px-3 py-2 text-xs text-muted-foreground border-t mt-1">
          💡 يمكنك التبديل بين الأنماط في أي وقت حسب احتياجك
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ViewModeToggle;