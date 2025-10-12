import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const StudentComparisonView: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            قريباً: مقارنة الطلاب
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            ستتمكن قريباً من مقارنة أداء عدة طلاب في امتحان واحد، مع مخططات Radar تفاعلية
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
