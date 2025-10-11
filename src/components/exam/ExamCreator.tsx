import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const ExamCreator: React.FC = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          سيتم إضافة نموذج إنشاء الامتحانات قريباً. ستتمكن من إنشاء امتحانات جديدة وتخصيصها بالكامل.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>إنشاء امتحان جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            قريباً: نموذج إنشاء امتحان متكامل مع خيارات متقدمة
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
