import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface VideoInfoCardProps {
  title: string;
  description: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const VideoInfoCard: React.FC<VideoInfoCardProps> = ({
  title,
  description,
  canEdit = false,
  onEdit,
  onDelete
}) => {
  return (
    <Alert className="relative border-2 border-primary/20 bg-primary/5">
      <Info className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-bold mb-2 flex items-center justify-between pr-8">
        {title}
        {canEdit && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من حذف هذه البطاقة؟ سيتم حذفها نهائياً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </AlertTitle>
      <AlertDescription className="text-base leading-relaxed whitespace-pre-line">
        {description}
      </AlertDescription>
    </Alert>
  );
};

export default VideoInfoCard;