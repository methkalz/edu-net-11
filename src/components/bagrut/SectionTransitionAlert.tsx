// مكون تنبيه الانتقال لقسم الاختصاص
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookMarked, ArrowLeft, Info } from 'lucide-react';

interface SectionTransitionAlertProps {
  open: boolean;
  onDismiss: () => void;
  sectionTitle: string;
  specializationLabel?: string;
  questionsCount: number;
  totalPoints: number;
}

const SectionTransitionAlert: React.FC<SectionTransitionAlertProps> = ({
  open,
  onDismiss,
  sectionTitle,
  specializationLabel,
  questionsCount,
  totalPoints,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <BookMarked className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            🔔 انتقلت إلى قسم الاختصاص
          </DialogTitle>
          <DialogDescription className="text-base">
            أنت الآن في أسئلة التخصص
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-accent/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">القسم:</span>
              <Badge variant="secondary" className="text-sm">
                {sectionTitle}
              </Badge>
            </div>
            
            {specializationLabel && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">التخصص:</span>
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  {specializationLabel}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">عدد الأسئلة:</span>
              <span className="font-medium">{questionsCount} أسئلة</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">مجموع العلامات:</span>
              <span className="font-bold text-primary">{totalPoints} علامة</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              هذا القسم يختلف عن القسم الإلزامي. تأكد من قراءة الأسئلة بتمعّن والإجابة على جميع البنود المطلوبة.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onDismiss} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            متابعة الامتحان
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SectionTransitionAlert;
