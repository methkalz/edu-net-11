import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, Info } from 'lucide-react';

export const ExamsList: React.FC = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          سيتم عرض قائمة الامتحانات المتوفرة قريباً مع إمكانية إدارتها وعرض الإحصائيات.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold mb-2">لا توجد امتحانات حالياً</p>
          <p className="text-muted-foreground">
            ابدأ بإنشاء أول امتحان من تبويب "إنشاء امتحان"
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
